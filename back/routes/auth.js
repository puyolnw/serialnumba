const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Register new user (Student only)
router.post('/register', async (req, res) => {
  try {
    const { 
      name, email, username, student_code, password,
      birth_date, gender, phone, address, enrollment_year, program
    } = req.body;

    // Validate required fields
    if (!name || !email || !username || !student_code || !password ||
        !birth_date || !gender || !phone || !address || !enrollment_year || !program) {
      return res.status(400).json({ 
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
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

    // Validate username format (alphanumeric and underscore only)
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

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { username },
          { student_code }
        ]
      }
    });

    if (existingUser) {
      let duplicateField = '';
      if (existingUser.email === email) duplicateField = 'อีเมล';
      else if (existingUser.username === username) duplicateField = 'ชื่อผู้ใช้';
      else if (existingUser.student_code === student_code) duplicateField = 'รหัสนักเรียน';
      
      return res.status(400).json({ 
        success: false,
        message: `${duplicateField}นี้มีอยู่ในระบบแล้ว` 
      });
    }

    // Create new user (Student only)
    const user = await User.create({
      name,
      email,
      username,
      student_code,
      birth_date,
      gender,
      phone,
      address,
      enrollment_year: parseInt(enrollment_year),
      program,
      password_hash: password, // Will be hashed by model hook
      role: 'STUDENT'
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        student_code: user.student_code,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed' 
    });
  }
});

// Login user (email/username/student_code)
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    console.log('🔐 [LOGIN] Attempt:', { 
      identifier: identifier ? identifier.substring(0, 3) + '***' : 'empty',
      hasPassword: !!password 
    });

    // Validate required fields
    if (!identifier || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
      });
    }

    // Find user by email, username, or student_code
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { username: identifier },
          { student_code: identifier }
        ]
      }
    });

    console.log('👤 [LOGIN] User found:', user ? {
      id: user.id,
      email: user.email,
      username: user.username,
      student_code: user.student_code,
      is_active: user.is_active
    } : 'No user found');

    if (!user) {
      console.log('❌ [LOGIN] User not found for identifier:', identifier);
      return res.status(401).json({ 
        success: false,
        message: 'ไม่พบผู้ใช้ในระบบ กรุณาตรวจสอบอีเมล ชื่อผู้ใช้ หรือรหัสนักศึกษา' 
      });
    }

    if (!user.is_active) {
      console.log('❌ [LOGIN] User account is inactive:', user.email);
      return res.status(401).json({ 
        success: false,
        message: 'บัญชีผู้ใช้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ' 
      });
    }

    // Check password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    console.log('🔑 [LOGIN] Password check:', { 
      userId: user.id, 
      isValid: isPasswordValid 
    });

    if (!isPasswordValid) {
      console.log('❌ [LOGIN] Invalid password for user:', user.email);
      return res.status(401).json({ 
        success: false,
        message: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้ง' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    console.log('✅ [LOGIN] Success for user:', user.email);
    
    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        student_code: user.student_code,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Login failed' 
    });
  }
});

// Get current user info
router.get('/me', requireAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        username: req.user.username,
        student_code: req.user.student_code,
        role: req.user.role,
        is_active: req.user.is_active
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get user info' 
    });
  }
});

// Get user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
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
      data: { user },
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    });
  }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const {
      name, email, username, student_code,
      birth_date, gender, phone, address, enrollment_year, program
    } = req.body;

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

    // Check if email or username is already taken by another user
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: email },
          { username: username }
        ],
        id: { [Op.ne]: req.user.id }
      }
    });

    if (existingUser) {
      let duplicateField = '';
      if (existingUser.email === email) duplicateField = 'อีเมล';
      else if (existingUser.username === username) duplicateField = 'ชื่อผู้ใช้';
      
      return res.status(400).json({
        success: false,
        message: `${duplicateField}นี้มีอยู่ในระบบแล้ว`
      });
    }

    // For students, check if student_code is already taken
    if (req.user.role === 'STUDENT' && student_code) {
      const existingStudent = await User.findOne({
        where: {
          student_code: student_code,
          id: { [Op.ne]: req.user.id }
        }
      });

      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'รหัสนักเรียนนี้มีอยู่ในระบบแล้ว'
        });
      }
    }

    // Update user profile
    const updateData = {
      name,
      email,
      username
    };

    // Add student-specific fields if user is a student
    if (req.user.role === 'STUDENT') {
      updateData.student_code = student_code;
      updateData.birth_date = birth_date;
      updateData.gender = gender;
      updateData.phone = phone;
      updateData.address = address;
      updateData.enrollment_year = enrollment_year ? parseInt(enrollment_year) : null;
      updateData.program = program;
    }

    await User.update(updateData, {
      where: { id: req.user.id }
    });

    // Get updated user data
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] }
    });

    res.json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Change password
router.put('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'
      });
    }

    // Get user with password
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง'
      });
    }

    // Update password
    user.password_hash = newPassword; // Will be hashed by model hook
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

module.exports = router;
