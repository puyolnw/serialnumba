const express = require('express');
const { Checkin, Attendance, User, Activity, Serial } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get pending check-ins (admin/staff only)
router.get('/pending', requireRole('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { page = 1, limit = 20, activity_id } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (activity_id) {
      whereClause.activity_id = activity_id;
    }

    const { count, rows: checkins } = await Checkin.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Activity,
          as: 'activity',
          attributes: ['id', 'title', 'start_date', 'end_date', 'hours_awarded']
        }
      ],
      order: [['id', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Check which check-ins are already confirmed
    const checkinIds = checkins.map(c => c.id);
    const confirmedCheckins = await Attendance.findAll({
      where: {
        [Op.or]: checkins.map(checkin => ({
          activity_id: checkin.activity_id,
          identifier_type: checkin.identifier_type,
          identifier_value: checkin.identifier_value
        }))
      }
    });

    const confirmedMap = new Map();
    confirmedCheckins.forEach(confirmed => {
      const key = `${confirmed.activity_id}-${confirmed.identifier_type}-${confirmed.identifier_value}`;
      confirmedMap.set(key, true);
    });

    const pendingCheckins = checkins.filter(checkin => {
      const key = `${checkin.activity_id}-${checkin.identifier_type}-${checkin.identifier_value}`;
      return !confirmedMap.has(key);
    });

    res.json({
      success: true,
      data: {
        checkins: pendingCheckins,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get pending check-ins error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending check-ins'
    });
  }
});

// Confirm attendance (admin/staff only)
router.post('/confirm', requireRole('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { checkin_id } = req.body;

    if (!checkin_id) {
      return res.status(400).json({
        success: false,
        message: 'Check-in ID is required'
      });
    }

    // Find the check-in
    const checkin = await Checkin.findByPk(checkin_id, {
      include: [{
        model: Activity,
        as: 'activity',
        attributes: ['id', 'title', 'hours_awarded']
      }]
    });

    if (!checkin) {
      return res.status(404).json({
        success: false,
        message: 'Check-in not found'
      });
    }

    // Check if already confirmed
    const existingAttendance = await Attendance.findOne({
      where: {
        activity_id: checkin.activity_id,
        identifier_type: checkin.identifier_type,
        identifier_value: checkin.identifier_value
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already confirmed'
      });
    }

    // Try to find user by identifier
    let user = null;
    switch (checkin.identifier_type) {
      case 'EMAIL':
        user = await User.findOne({ where: { email: checkin.identifier_value } });
        break;
      case 'USERNAME':
        user = await User.findOne({ where: { username: checkin.identifier_value } });
        break;
      case 'STUDENT_CODE':
        user = await User.findOne({ where: { student_code: checkin.identifier_value } });
        break;
    }

    // Create attendance record
    const attendance = await Attendance.create({
      activity_id: checkin.activity_id,
      user_id: user ? user.id : null,
      identifier_type: checkin.identifier_type,
      identifier_value: checkin.identifier_value,
      confirmed_by: req.user.id
    });

    // Generate serial code if user exists
    let serial = null;
    if (user) {
      const serialCode = generateSerialCode();
      serial = await Serial.create({
        activity_id: checkin.activity_id,
        code: serialCode,
        user_id: user.id,
        identifier_value: checkin.identifier_value,
        status: 'PENDING'
      });
    }

    res.json({
      success: true,
      message: 'Attendance confirmed successfully',
      data: {
        attendance_id: attendance.id,
        activity_title: checkin.activity.title,
        identifier_type: checkin.identifier_type,
        identifier_value: checkin.identifier_value,
        user_found: !!user,
        serial_generated: !!serial,
        serial_code: serial ? serial.code : null
      }
    });
  } catch (error) {
    console.error('Confirm attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm attendance'
    });
  }
});

// Bulk confirm attendance (admin/staff only)
router.post('/confirm-bulk', requireRole('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { checkin_ids } = req.body;

    if (!checkin_ids || !Array.isArray(checkin_ids) || checkin_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Check-in IDs array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const checkin_id of checkin_ids) {
      try {
        // Find the check-in
        const checkin = await Checkin.findByPk(checkin_id, {
          include: [{
            model: Activity,
            as: 'activity',
            attributes: ['id', 'title', 'hours_awarded']
          }]
        });

        if (!checkin) {
          errors.push({ checkin_id, error: 'Check-in not found' });
          continue;
        }

        // Check if already confirmed
        const existingAttendance = await Attendance.findOne({
          where: {
            activity_id: checkin.activity_id,
            identifier_type: checkin.identifier_type,
            identifier_value: checkin.identifier_value
          }
        });

        if (existingAttendance) {
          errors.push({ checkin_id, error: 'Already confirmed' });
          continue;
        }

        // Try to find user by identifier
        let user = null;
        switch (checkin.identifier_type) {
          case 'EMAIL':
            user = await User.findOne({ where: { email: checkin.identifier_value } });
            break;
          case 'USERNAME':
            user = await User.findOne({ where: { username: checkin.identifier_value } });
            break;
          case 'STUDENT_CODE':
            user = await User.findOne({ where: { student_code: checkin.identifier_value } });
            break;
        }

        // Create attendance record
        const attendance = await Attendance.create({
          activity_id: checkin.activity_id,
          user_id: user ? user.id : null,
          identifier_type: checkin.identifier_type,
          identifier_value: checkin.identifier_value,
          confirmed_by: req.user.id
        });

        // Generate serial code if user exists
        let serial = null;
        if (user) {
          const serialCode = generateSerialCode();
          serial = await Serial.create({
            activity_id: checkin.activity_id,
            code: serialCode,
            user_id: user.id,
            identifier_value: checkin.identifier_value,
            status: 'PENDING'
          });
        }

        results.push({
          checkin_id,
          attendance_id: attendance.id,
          user_found: !!user,
          serial_generated: !!serial,
          serial_code: serial ? serial.code : null
        });
      } catch (error) {
        errors.push({ checkin_id, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Processed ${checkin_ids.length} check-ins`,
      data: {
        confirmed: results,
        errors: errors
      }
    });
  } catch (error) {
    console.error('Bulk confirm attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm attendance'
    });
  }
});

// Get attendance history (admin/staff only)
router.get('/history', requireRole('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { page = 1, limit = 20, activity_id } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (activity_id) {
      whereClause.activity_id = activity_id;
    }

    const { count, rows: attendance } = await Attendance.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Activity,
          as: 'activity',
          attributes: ['id', 'title', 'start_date', 'end_date', 'hours_awarded']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'username', 'student_code'],
          required: false
        },
        {
          model: User,
          as: 'confirmer',
          attributes: ['id', 'name', 'username']
        }
      ],
      order: [['confirmed_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        attendance,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance history'
    });
  }
});

// Helper function to generate serial code
function generateSerialCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = router;
