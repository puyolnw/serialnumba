const express = require('express');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { Activity, Checkin, Attendance, User, SerialHistory } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Get user hours for testing (public endpoint)
router.get('/user-hours/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user data
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }
    
    // Get total hours earned by user
    const totalHours = await SerialHistory.sum('hours_earned', {
      where: { user_id: userId }
    }) || 0;
    
    // Get user's serial history
    const serialHistory = await SerialHistory.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          student_id: user.student_id,
          email: user.email
        },
        totalHours,
        serialHistory: serialHistory.map(serial => ({
          id: serial.id,
          hours_earned: serial.hours_earned,
          activity_title: serial.activity_title,
          created_at: serial.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Get user hours error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลชั่วโมงได้'
    });
  }
});

// Generate mock certificate (public endpoint for testing)
router.get('/mock-certificate', async (req, res) => {
  try {
    const { name, studentId, hours } = req.query;
    
    // Use mock data if not provided
    const mockUser = {
      name: name || 'นายทดสอบ ระบบ',
      student_id: studentId || 'TEST001',
      id: 'MOCK001'
    };
    
    const mockTotalHours = parseInt(hours) || 120;
    const mockRequiredHours = 100;
    
    // Generate certificate using mock data
    const certificateBuffer = await generateMockCertificate(mockUser, mockTotalHours, mockRequiredHours);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="mock_certificate_${mockUser.student_id}.pdf"`);
    res.setHeader('Content-Length', certificateBuffer.length);
    
    res.send(certificateBuffer);
  } catch (error) {
    console.error('Generate mock certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถสร้างใบประกาศจำลองได้'
    });
  }
});

// Public check-in by slug (no authentication required)
router.post('/checkin/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { identifier_type, identifier_value, name, student_code } = req.body;

    // Validate required fields
    if (!identifier_type || !identifier_value) {
      return res.status(400).json({
        success: false,
        message: 'Identifier type and value are required'
      });
    }

    if (!name || !student_code) {
      return res.status(400).json({
        success: false,
        message: 'Name and student code are required'
      });
    }

    // Validate identifier type
    if (!['EMAIL', 'USERNAME', 'STUDENT_CODE'].includes(identifier_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid identifier type'
      });
    }

    // Find activity by slug
    const activity = await Activity.findOne({
      where: { public_slug: slug, status: 'OPEN' }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found or not open for check-in'
      });
    }

    // Normalize identifier value
    let normalizedValue;
    switch (identifier_type) {
      case 'EMAIL':
        normalizedValue = identifier_value.trim().toLowerCase();
        break;
      case 'USERNAME':
        normalizedValue = identifier_value.trim().toLowerCase();
        break;
      case 'STUDENT_CODE':
        normalizedValue = identifier_value.trim().toUpperCase();
        break;
    }

    // Generate dedup hash
    const dedupHash = crypto
      .createHash('sha256')
      .update(`${activity.id}:${normalizedValue}`)
      .digest('hex');

    // Check if already checked in
    const existingCheckin = await Checkin.findOne({
      where: { activity_id: activity.id, dedup_hash: dedupHash }
    });

    if (existingCheckin) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in for this activity'
      });
    }

    // Create check-in record
    const checkin = await Checkin.create({
      activity_id: activity.id,
      identifier_type,
      identifier_value: normalizedValue,
      name: name.trim(),
      student_code: student_code.trim(),
      dedup_hash: dedupHash
    });

    res.status(201).json({
      success: true,
      message: 'Check-in successful! Your attendance will be confirmed by staff.',
      data: {
        checkin_id: checkin.id,
        activity_title: activity.title,
        identifier_type,
        identifier_value: normalizedValue
      }
    });
  } catch (error) {
    console.error('Public check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Check-in failed'
    });
  }
});

// Get activity info by slug (public)
router.get('/activity/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const activity = await Activity.findOne({
      where: { public_slug: slug },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'username']
      }]
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: activity.id,
        title: activity.title,
        description: activity.description,
        start_date: activity.start_date,
        end_date: activity.end_date,
        hours_awarded: activity.hours_awarded,
        status: activity.status,
        creator: activity.creator
      }
    });
  } catch (error) {
    console.error('Get activity by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity'
    });
  }
});

// Get QR code data for activity
router.get('/qr/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const activity = await Activity.findOne({
      where: { public_slug: slug },
      attributes: ['id', 'title', 'public_slug']
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    const checkinUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkin/${slug}`;

    res.json({
      success: true,
      data: {
        activity_id: activity.id,
        activity_title: activity.title,
        checkin_url: checkinUrl,
        qr_data: checkinUrl
      }
    });
  } catch (error) {
    console.error('Get QR data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR data'
    });
  }
});

// Generate QR code image for activity
router.get('/qr/:slug/image', async (req, res) => {
  try {
    const { slug } = req.params;
    const { format = 'png', size = 200 } = req.query;

    const activity = await Activity.findOne({
      where: { public_slug: slug },
      attributes: ['id', 'title', 'public_slug']
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    const checkinUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkin/${slug}`;

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(checkinUrl, {
      width: parseInt(size),
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    if (format === 'svg') {
      const qrCodeSVG = await QRCode.toString(checkinUrl, {
        type: 'svg',
        width: parseInt(size),
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `inline; filename="qr-${slug}.svg"`);
      res.send(qrCodeSVG);
    } else {
      // Return as base64 data URL
      res.json({
        success: true,
        data: {
          activity_id: activity.id,
          activity_title: activity.title,
          checkin_url: checkinUrl,
          qr_code: qrCodeDataURL,
          format: 'data_url'
        }
      });
    }
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code'
    });
  }
});

// Get public statistics for landing page
router.get('/stats', async (req, res) => {
  try {
    // Get total activities
    const totalActivities = await Activity.count({
      where: { status: { [Op.ne]: 'CANCELLED' } }
    });

    // Get total students
    const totalStudents = await User.count({
      where: { role: 'STUDENT' }
    });

    // Get total hours earned
    const totalHoursResult = await SerialHistory.findOne({
      where: { is_reviewed: true },
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('hours_earned')), 'total']
      ]
    });
    const totalHours = totalHoursResult?.dataValues?.total || 0;

    // Get upcoming activities (next 30 days)
    const upcomingActivities = await Activity.count({
      where: {
        start_date: {
          [Op.gte]: new Date(),
          [Op.lte]: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        status: { [Op.in]: ['OPEN', 'PENDING'] }
      }
    });

    res.json({
      success: true,
      data: {
        totalActivities,
        totalStudents,
        totalHours,
        upcomingActivities
      }
    });
  } catch (error) {
    console.error('Get public stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Generate mock certificate function
async function generateMockCertificate(user, totalHours, requiredHours) {
  return new Promise(async (resolve, reject) => {
    try {
      const PDFDocument = require('pdfkit');
      const Jimp = require('jimp');
      const path = require('path');
      
      // Load template image
      const templatePath = path.join(__dirname, '../picture/ตัวเปล่า.png');
      const template = await Jimp.read(templatePath);
      
      // Get font for Thai text
      const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
      const smallFont = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
      
      // Prepare text data
      const studentName = user.name || 'ไม่ระบุชื่อ';
      const studentId = user.student_id || user.id.toString();
      const currentDate = new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Add text to image
      // Student name (adjust position based on template)
      template.print(font, 400, 300, studentName);
      
      // Student ID
      template.print(smallFont, 400, 350, `รหัสนักศึกษา: ${studentId}`);
      
      // Hours completed
      template.print(smallFont, 400, 380, `ชั่วโมงที่ทำ: ${totalHours} ชั่วโมง`);
      
      // Date
      template.print(smallFont, 400, 410, `วันที่: ${currentDate}`);
      
      // Get image buffer
      const imageBuffer = await template.getBufferAsync(Jimp.MIME_PNG);
      
      // Create PDF with the image
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape'
      });
      
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      
      // Add image to PDF
      doc.image(imageBuffer, 0, 0, { 
        width: 842, 
        height: 595,
        fit: [842, 595]
      });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = router;
