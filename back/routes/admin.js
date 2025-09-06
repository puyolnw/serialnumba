const express = require('express');
const router = express.Router();
const { User, SystemSetting, SerialHistory, Activity, Serial, Checkin, ActivityReview } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get all users (Admin only)
router.get('/users', requireRole('ADMIN'), async (req, res) => {
  try {
    const { role } = req.query;
    const whereClause = role ? { role } : {};
    
    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password_hash'] },
      order: [['id', 'DESC']]
    });
    
    res.json({
      success: true,
      data: { users },
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Create user (Admin only)
router.post('/users', requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, email, username, student_code, password, role, is_active } = req.body;
    
    console.log('👤 [CREATE USER] Request:', { 
      name, 
      email, 
      username, 
      student_code: student_code ? student_code.substring(0, 3) + '***' : 'none',
      role,
      is_active 
    });
    
    // Validate required fields
    if (!name || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, อีเมล, ชื่อผู้ใช้, รหัสผ่าน)'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'รูปแบบอีเมลไม่ถูกต้อง'
      });
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'ชื่อผู้ใช้ต้องเป็นตัวอักษร ตัวเลข และ _ เท่านั้น (3-50 ตัวอักษร)'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
      });
    }

    // Validate role
    if (role && !['ADMIN', 'STAFF', 'STUDENT'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'บทบาทไม่ถูกต้อง (ADMIN, STAFF, STUDENT)'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { username },
          ...(student_code && student_code.trim() ? [{ student_code }] : [])
        ]
      }
    });
    
    if (existingUser) {
      let duplicateField = '';
      if (existingUser.email === email) duplicateField = 'อีเมล';
      else if (existingUser.username === username) duplicateField = 'ชื่อผู้ใช้';
      else if (student_code && student_code.trim() && existingUser.student_code === student_code) duplicateField = 'รหัสนักเรียน';
      
      return res.status(400).json({
        success: false,
        message: `${duplicateField}นี้มีอยู่ในระบบแล้ว`
      });
    }
    
    // Let the model handle password hashing via hooks
    const user = await User.create({
      name,
      email,
      username,
      student_code: student_code && student_code.trim() ? student_code : null, // Only set if not empty
      password_hash: password, // Will be hashed by model hook
      role: role || 'STUDENT',
      is_active: is_active !== undefined ? is_active : true
    });
    
    console.log('✅ [CREATE USER] Success:', { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    });
    
    res.status(201).json({
      success: true,
      data: { user: { ...user.toJSON(), password_hash: undefined } },
      message: 'สร้างผู้ใช้สำเร็จ'
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

// Update user (Admin only)
router.put('/users/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, username, student_code, password, is_active } = req.body;
    
    console.log('👤 [UPDATE USER] Request:', { 
      id,
      name, 
      email, 
      username, 
      student_code: student_code ? student_code.substring(0, 3) + '***' : 'none',
      hasPassword: !!password,
      is_active 
    });
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้ในระบบ'
      });
    }
    
    // Validate required fields
    if (!name || !email || !username) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, อีเมล, ชื่อผู้ใช้)'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'รูปแบบอีเมลไม่ถูกต้อง'
      });
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'ชื่อผู้ใช้ต้องเป็นตัวอักษร ตัวเลข และ _ เท่านั้น (3-50 ตัวอักษร)'
      });
    }

    // Validate password length if provided
    if (password && password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
      });
    }

    // For students, student_code is required
    if (user.role === 'STUDENT' && !student_code?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกรหัสนักเรียน'
      });
    }
    
    // Check if email/username/student_code already exists (excluding current user)
    const existingUser = await User.findOne({
      where: {
        [Op.and]: [
          { id: { [Op.ne]: id } }, // Exclude current user
          {
            [Op.or]: [
              { email },
              { username },
              ...(student_code && student_code.trim() ? [{ student_code }] : [])
            ]
          }
        ]
      }
    });
    
    if (existingUser) {
      let duplicateField = '';
      if (existingUser.email === email) duplicateField = 'อีเมล';
      else if (existingUser.username === username) duplicateField = 'ชื่อผู้ใช้';
      else if (student_code && student_code.trim() && existingUser.student_code === student_code) duplicateField = 'รหัสนักเรียน';
      
      return res.status(400).json({
        success: false,
        message: `${duplicateField}นี้มีอยู่ในระบบแล้ว`
      });
    }
    
    const updateData = { 
      name, 
      email, 
      username, 
      student_code: student_code && student_code.trim() ? student_code : null,
      is_active 
    };
    
    // Only update password if provided
    if (password) {
      updateData.password_hash = password; // Let model hook handle hashing
    }
    
    await user.update(updateData);
    
    console.log('✅ [UPDATE USER] Success:', { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    });
    
    res.json({
      success: true,
      data: { user: { ...user.toJSON(), password_hash: undefined } },
      message: 'อัปเดตผู้ใช้สำเร็จ'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถอัปเดตผู้ใช้ได้'
    });
  }
});

// Delete user (Admin only)
router.delete('/users/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.destroy();
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// Update user status (Admin only)
router.put('/users/:id/status', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.update({ is_active });
    
    res.json({
      success: true,
      message: 'User status updated successfully'
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// Get system settings (Admin only)
router.get('/settings', requireRole('ADMIN'), async (req, res) => {
  try {
    console.log('🔧 [SETTINGS] Fetching system settings...');
    
    let settings = await SystemSetting.findByPk(1);
    
    if (!settings) {
      console.log('🔧 [SETTINGS] No settings found, creating default...');
      // Create default settings if not exists
      settings = await SystemSetting.create({
        id: 1,
        required_hours: 100,
        updated_by: req.user.id
      });
    }
    
    console.log('🔧 [SETTINGS] Settings found:', {
      id: settings.id,
      required_hours: settings.required_hours,
      updated_at: settings.updated_at
    });
    
    res.json({
      success: true,
      data: {
        id: settings.id,
        required_hours: settings.required_hours,
        updated_at: settings.updated_at
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings'
    });
  }
});

// Update system settings (Admin only)
router.put('/settings', requireRole('ADMIN'), async (req, res) => {
  try {
    const { required_hours } = req.body;
    
    console.log('🔧 [SETTINGS] Update request:', { required_hours, userId: req.user.id });
    
    if (!required_hours || required_hours < 1) {
      return res.status(400).json({
        success: false,
        message: 'จำนวนชั่วโมงต้องมีอย่างน้อย 1 ชั่วโมง'
      });
    }
    
    let settings = await SystemSetting.findByPk(1);
    
    if (!settings) {
      console.log('🔧 [SETTINGS] Creating new settings...');
      settings = await SystemSetting.create({
        id: 1,
        required_hours,
        updated_by: req.user.id
      });
    } else {
      console.log('🔧 [SETTINGS] Updating existing settings...');
      await settings.update({
        required_hours,
        updated_by: req.user.id
      });
    }
    
    console.log('🔧 [SETTINGS] Settings updated successfully:', {
      id: settings.id,
      required_hours: settings.required_hours,
      updated_at: settings.updated_at
    });
    
    res.json({
      success: true,
      message: 'บันทึกการตั้งค่าสำเร็จ',
      data: {
        id: settings.id,
        required_hours: settings.required_hours,
        updated_at: settings.updated_at
      }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถบันทึกการตั้งค่าได้'
    });
  }
});

// Get required hours for students (Public endpoint)
router.get('/required-hours', async (req, res) => {
  try {
    let settings = await SystemSetting.findByPk(1);
    
    if (!settings) {
      // Return default if no settings found
      return res.json({
        success: true,
        data: {
          required_hours: 50
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        required_hours: settings.required_hours
      }
    });
  } catch (error) {
    console.error('Get required hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch required hours'
    });
  }
});

// Get activity participants (Admin only)
router.get('/activities/:id/participants', requireRole('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const activity = await Activity.findByPk(id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    const participants = await Checkin.findAll({
      where: { activity_id: id },
      attributes: ['id', 'identifier_type', 'identifier_value', 'name', 'student_code', 'serial_sent', 'serial_sent_at', 'created_at'],
      order: [['id', 'DESC']]
    });

    // Transform participants to include user info if available
    const participantsWithInfo = await Promise.all(
      participants.map(async (participant) => {
        let userInfo = null;
        
        // Try to find user by identifier
        if (participant.identifier_type === 'EMAIL') {
          userInfo = await User.findOne({ where: { email: participant.identifier_value } });
        } else if (participant.identifier_type === 'USERNAME') {
          userInfo = await User.findOne({ where: { username: participant.identifier_value } });
        } else if (participant.identifier_type === 'STUDENT_CODE') {
          userInfo = await User.findOne({ where: { student_code: participant.identifier_value } });
        }

        return {
          id: participant.id,
          identifier_type: participant.identifier_type,
          identifier_value: participant.identifier_value,
          created_at: participant.created_at,
          serial_sent: participant.serial_sent,
          serial_sent_at: participant.serial_sent_at,
          name: participant.name || (userInfo ? userInfo.name : participant.identifier_value),
          email: userInfo ? userInfo.email : (participant.identifier_type === 'EMAIL' ? participant.identifier_value : ''),
          student_code: participant.student_code || (userInfo ? userInfo.student_code : (participant.identifier_type === 'STUDENT_CODE' ? participant.identifier_value : '')),
          username: userInfo ? userInfo.username : (participant.identifier_type === 'USERNAME' ? participant.identifier_value : '')
        };
      })
    );
    
    console.log('📊 [ADMIN] Participants data being sent:', participantsWithInfo.map(p => ({
      id: p.id,
      identifier_value: p.identifier_value,
      serial_sent: p.serial_sent,
      serial_sent_at: p.serial_sent_at
    })));

    res.json({
      success: true,
      data: { participants: participantsWithInfo },
      message: 'Activity participants retrieved successfully'
    });
  } catch (error) {
    console.error('Get activity participants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity participants'
    });
  }
});

// Get system statistics (Admin only)
router.get('/stats', requireRole('ADMIN'), async (req, res) => {
  try {
    const [
      totalUsers,
      totalActivities,
      totalSerials,
      redeemedSerials,
      totalHours,
      totalCheckins
    ] = await Promise.all([
      User.count(),
      Activity.count(),
      Serial.count(),
      Serial.count({ where: { status: 'REDEEMED' } }),
      SerialHistory.sum('hours_earned'),
      Checkin.count()
    ]);
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalActivities,
        totalSerials,
        redeemedSerials,
        totalHours: totalHours || 0,
        totalCheckins
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system statistics'
    });
  }
});

// Get all activities (Staff and Admin)
router.get('/activities', requireRole('ADMIN', 'STAFF'), async (req, res) => {
  try {
    // Get activities with creator info
    const activities = await Activity.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'role']
        }
      ],
      order: [['id', 'DESC']]
    });

    console.log('🔍 [ADMIN] Raw activities from database:', activities.map(a => ({
      id: a.id,
      title: a.title
    })));

    // Get participant count for each activity using raw query
    const activitiesWithCount = await Promise.all(
      activities.map(async (activity) => {
        // Count checkins for this activity
        const checkinCount = await Checkin.count({
          where: { activity_id: activity.id }
        });
        
        console.log(`🔍 Activity ${activity.id} (${activity.title}): ${checkinCount} participants`);
        
        // Also get actual checkins to verify
        const actualCheckins = await Checkin.findAll({
          where: { activity_id: activity.id },
          attributes: ['id', 'identifier_value']
        });
        console.log(`📋 Activity ${activity.id} actual checkins:`, actualCheckins.map(c => c.identifier_value));
        
        return {
          ...activity.toJSON(),
          participant_count: checkinCount
        };
      })
    );

    console.log('📊 [ADMIN] Activities with participant count:', activitiesWithCount.map(a => ({
      id: a.id,
      title: a.title,
      participant_count: a.participant_count
    })));

    res.json({
      success: true,
      data: { activities: activitiesWithCount },
      message: 'All activities retrieved successfully'
    });
  } catch (error) {
    console.error('Get all activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities'
    });
  }
});

// Get dashboard statistics (Admin only)
router.get('/dashboard-stats', requireRole('ADMIN'), async (req, res) => {
  try {
    // Get top rated activities
    const topRatedActivities = await ActivityReview.findAll({
      attributes: [
        'activity_id',
        [require('sequelize').fn('AVG', require('sequelize').col('overall_rating')), 'avg_rating'],
        [require('sequelize').fn('COUNT', require('sequelize').col('ActivityReview.id')), 'review_count']
      ],
      include: [
        {
          model: Activity,
          as: 'activity',
          attributes: ['id', 'title', 'description']
        }
      ],
      group: ['activity_id', 'activity.id'],
      order: [[require('sequelize').fn('AVG', require('sequelize').col('overall_rating')), 'DESC']],
      limit: 5
    });

    // Get students with most hours (top 3)
    const topStudents = await SerialHistory.findAll({
      attributes: [
        'user_id',
        [require('sequelize').fn('SUM', require('sequelize').col('hours_earned')), 'total_hours'],
        [require('sequelize').fn('COUNT', require('sequelize').col('SerialHistory.id')), 'activity_count']
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'student_code'],
          where: { role: 'STUDENT' }
        }
      ],
      where: {
        is_reviewed: true
      },
      group: ['user_id', 'user.id', 'user.name', 'user.student_code'],
      order: [[require('sequelize').literal('total_hours'), 'DESC']],
      limit: 3
    });

    // Get recent reviews
    const recentReviews = await ActivityReview.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'student_code']
        },
        {
          model: Activity,
          as: 'activity',
          attributes: ['id', 'title']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Get review statistics
    const reviewStats = await ActivityReview.findAll({
      attributes: [
        [require('sequelize').fn('AVG', require('sequelize').col('overall_rating')), 'avg_overall'],
        [require('sequelize').fn('AVG', require('sequelize').col('fun_rating')), 'avg_fun'],
        [require('sequelize').fn('AVG', require('sequelize').col('learning_rating')), 'avg_learning'],
        [require('sequelize').fn('AVG', require('sequelize').col('organization_rating')), 'avg_organization'],
        [require('sequelize').fn('AVG', require('sequelize').col('venue_rating')), 'avg_venue'],
        [require('sequelize').fn('COUNT', require('sequelize').col('ActivityReview.id')), 'total_reviews']
      ]
    });

    res.json({
      success: true,
      data: {
        topRatedActivities,
        topStudents,
        recentReviews,
        reviewStats: reviewStats[0] || {}
      },
      message: 'Dashboard statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

module.exports = router;
