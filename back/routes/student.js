const express = require('express');
const router = express.Router();
const { User, SystemSetting, SerialHistory, Activity, Serial, ActivityReview } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get student progress (Student only)
router.get('/progress', requireRole('STUDENT'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get system settings for required hours
    const settings = await SystemSetting.findByPk(1);
    const requiredHours = settings ? settings.required_hours : 100;
    
    // Get total hours earned by student
    const totalHours = await SerialHistory.sum('hours_earned', {
      where: { user_id: userId }
    }) || 0;
    
    // Calculate progress percentage
    const progressPercentage = Math.min((totalHours / requiredHours) * 100, 100);
    
    // Get recent serial history (last 10)
    const recentHistory = await SerialHistory.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Activity,
          as: 'activity',
          attributes: ['title', 'start_date']
        },
        {
          model: Serial,
          as: 'serial',
          attributes: ['code']
        }
      ],
      order: [['redeemed_at', 'DESC']],
      limit: 10
    });
    
    res.json({
      success: true,
      data: {
        totalHours,
        requiredHours,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        remainingHours: Math.max(requiredHours - totalHours, 0),
        isCompleted: totalHours >= requiredHours,
        recentHistory
      }
    });
  } catch (error) {
    console.error('Get student progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student progress'
    });
  }
});

// Get student serial history (Student only)
router.get('/serial-history', requireRole('STUDENT'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;
    
    const { count, rows: history } = await SerialHistory.findAndCountAll({
      where: { user_id: userId },
      include: [
        {
          model: Activity,
          as: 'activity',
          attributes: ['title', 'start_date', 'end_date', 'hours_awarded']
        },
        {
          model: Serial,
          as: 'serial',
          attributes: ['code', 'status']
        }
      ],
      order: [['redeemed_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const totalPages = Math.ceil(count / limit);
    
    res.json({
      success: true,
      data: {
        history,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get serial history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch serial history'
    });
  }
});

// Redeem serial code (Student only)
router.post('/redeem-serial', requireRole('STUDENT'), async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอก Serial code'
      });
    }
    
    // Find serial by code
    const serial = await Serial.findOne({
      where: { code: code.toUpperCase() },
      include: [
        {
          model: Activity,
          as: 'activity',
          attributes: ['title', 'hours_awarded']
        }
      ]
    });
    
    if (!serial) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ Serial code นี้ในระบบ กรุณาตรวจสอบรหัสอีกครั้ง'
      });
    }
    
    if (serial.status !== 'SENT' && serial.status !== 'PENDING') {
      let statusMessage = '';
      if (serial.status === 'REDEEMED') {
        statusMessage = 'Serial code นี้ถูกเติมไปแล้ว';
      } else if (serial.status === 'EXPIRED') {
        statusMessage = 'Serial code นี้หมดอายุแล้ว';
      } else if (serial.status === 'CANCELLED') {
        statusMessage = 'Serial code นี้ถูกยกเลิกแล้ว';
      } else {
        statusMessage = `Serial code นี้ไม่สามารถเติมได้ (สถานะ: ${serial.status})`;
      }
      
      return res.status(400).json({
        success: false,
        message: statusMessage
      });
    }
    
    // Check if user already redeemed this serial
    const existingHistory = await SerialHistory.findOne({
      where: {
        user_id: userId,
        serial_id: serial.id
      }
    });
    
    if (existingHistory) {
      return res.status(400).json({
        success: false,
        message: 'คุณได้เติม Serial code นี้ไปแล้ว'
      });
    }
    
    if (serial.user_id && serial.user_id !== userId) {
      return res.status(400).json({
        success: false,
        message: 'Serial code นี้ถูกเติมโดยผู้ใช้คนอื่นแล้ว ไม่สามารถเติมซ้ำได้'
      });
    }
    
    // Update serial status and user
    await serial.update({
      status: 'REDEEMED',
      user_id: userId,
      redeemed_at: new Date()
    });
    
    // Create serial history record (ยังไม่ได้รีวิว)
    const historyRecord = await SerialHistory.create({
      user_id: userId,
      serial_id: serial.id,
      activity_id: serial.activity_id,
      hours_earned: 0, // ยังไม่ได้ชั่วโมง เพราะยังไม่ได้รีวิว
      redeemed_at: new Date(),
      is_reviewed: false // เริ่มต้นยังไม่ได้รีวิว
    });
    
    res.json({
      success: true,
      message: `เติม Serial code สำเร็จ! กรุณารีวิวกิจกรรม "${serial.activity.title}" เพื่อรับ ${serial.activity.hours_awarded} ชั่วโมง`,
      data: {
        serialHistoryId: historyRecord.id,
        activityTitle: serial.activity.title,
        hoursAwarded: serial.activity.hours_awarded,
        serialCode: serial.code,
        requiresReview: true
      }
    });
  } catch (error) {
    console.error('Redeem serial error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเติม Serial code กรุณาลองใหม่อีกครั้ง'
    });
  }
});

// Get student profile (Student only)
router.get('/profile', requireRole('STUDENT'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student profile'
    });
  }
});

// Get pending reviews for student
router.get('/pending-reviews', requireRole('STUDENT'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    const pendingReviews = await SerialHistory.findAll({
      where: {
        user_id: userId,
        is_reviewed: false
      },
      include: [
        {
          model: Activity,
          as: 'activity',
          attributes: ['id', 'title', 'description', 'start_date', 'hours_awarded']
        },
        {
          model: Serial,
          as: 'serial',
          attributes: ['id', 'code']
        }
      ],
      order: [['redeemed_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { pendingReviews },
      message: 'ดึง Serial ที่รอรีวิวสำเร็จ'
    });
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึง Serial ที่รอรีวิวได้'
    });
  }
});

// Get upcoming activities for student (within next 2 days)
router.get('/upcoming-activities', requireRole('STUDENT'), async (req, res) => {
  try {
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000));
    
    const upcomingActivities = await Activity.findAll({
      where: {
        start_date: {
          [Op.gte]: now,
          [Op.lte]: twoDaysFromNow
        },
        status: { [Op.in]: ['OPEN', 'PENDING'] }
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'role']
        }
      ],
      order: [['start_date', 'ASC']]
    });

    res.json({
      success: true,
      data: { 
        upcomingActivities,
        count: upcomingActivities.length
      },
      message: 'ดึงกิจกรรมที่ใกล้เข้ามาสำเร็จ'
    });
  } catch (error) {
    console.error('Get upcoming activities error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงกิจกรรมที่ใกล้เข้ามาได้'
    });
  }
});

// Submit activity review
router.post('/submit-review', requireRole('STUDENT'), async (req, res) => {
  try {
    const {
      serial_id,
      fun_rating,
      learning_rating,
      organization_rating,
      venue_rating,
      overall_rating,
      suggestion
    } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!serial_id || !fun_rating || !learning_rating || !organization_rating || !venue_rating || !overall_rating) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    // ตรวจสอบคะแนน (1-5)
    const ratings = [fun_rating, learning_rating, organization_rating, venue_rating, overall_rating];
    for (const rating of ratings) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'คะแนนต้องอยู่ระหว่าง 1-5'
        });
      }
    }

    // ตรวจสอบว่า serial นี้เป็นของ user นี้หรือไม่
    const serialHistory = await SerialHistory.findOne({
      where: {
        id: serial_id,
        user_id: req.user.id
      },
      include: [
        { model: Activity, as: 'activity' },
        { model: Serial, as: 'serial' }
      ]
    });

    if (!serialHistory) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ Serial หรือคุณไม่มีสิทธิ์รีวิว'
      });
    }

    // ตรวจสอบว่ารีวิวแล้วหรือยัง
    if (serialHistory.is_reviewed) {
      return res.status(400).json({
        success: false,
        message: 'คุณได้รีวิวกิจกรรมนี้แล้ว'
      });
    }

    // สร้างรีวิว
    const review = await ActivityReview.create({
      user_id: req.user.id,
      activity_id: serialHistory.activity_id,
      serial_id: serial_id,
      fun_rating,
      learning_rating,
      organization_rating,
      venue_rating,
      overall_rating,
      suggestion: suggestion || null
    });

    // อัปเดต serial_history ว่าได้รีวิวแล้ว และให้ชั่วโมง
    await serialHistory.update({ 
      is_reviewed: true,
      hours_earned: serialHistory.activity.hours_awarded // ให้ชั่วโมงเมื่อรีวิวเสร็จ
    });

    res.json({
      success: true,
      data: { 
        review,
        hoursEarned: serialHistory.activity.hours_awarded,
        activityTitle: serialHistory.activity.title
      },
      message: `รีวิวสำเร็จ! คุณได้รับ ${serialHistory.activity.hours_awarded} ชั่วโมงจากกิจกรรม "${serialHistory.activity.title}"`
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถสร้างรีวิวได้'
    });
  }
});

module.exports = router;
