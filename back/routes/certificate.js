const express = require('express');
const router = express.Router();
const { User, SystemSetting, SerialHistory } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

// Generate certificate for student
router.get('/generate/:userId', requireRole('STUDENT'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user is requesting their own certificate
    if (req.params.userId !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'ไม่สามารถสร้างใบประกาศของผู้อื่นได้'
      });
    }

    // Get user data
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // Get system settings for required hours
    const settings = await SystemSetting.findByPk(1);
    const requiredHours = settings ? settings.required_hours : 100;
    
    // Get total hours earned by student
    const totalHours = await SerialHistory.sum('hours_earned', {
      where: { user_id: userId }
    }) || 0;

    // Check if student has completed required hours
    if (totalHours < requiredHours) {
      return res.status(400).json({
        success: false,
        message: `ยังไม่ครบชั่วโมงที่กำหนด (${totalHours}/${requiredHours} ชั่วโมง)`
      });
    }

    // Generate certificate
    const certificateBuffer = await generateCertificate(user, totalHours, requiredHours);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate_${user.student_id || user.id}.pdf"`);
    res.setHeader('Content-Length', certificateBuffer.length);
    
    res.send(certificateBuffer);
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถสร้างใบประกาศได้'
    });
  }
});

// Check if student is eligible for certificate
router.get('/check-eligibility', requireRole('STUDENT'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get system settings for required hours
    const settings = await SystemSetting.findByPk(1);
    const requiredHours = settings ? settings.required_hours : 100;
    
    // Get total hours earned by student
    const totalHours = await SerialHistory.sum('hours_earned', {
      where: { user_id: userId }
    }) || 0;

    const isEligible = totalHours >= requiredHours;
    
    res.json({
      success: true,
      data: {
        isEligible,
        totalHours,
        requiredHours,
        remainingHours: Math.max(requiredHours - totalHours, 0)
      }
    });
  } catch (error) {
    console.error('Check certificate eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถตรวจสอบสิทธิ์ใบประกาศได้'
    });
  }
});

// Generate certificate function
async function generateCertificate(user, totalHours, requiredHours) {
  return new Promise(async (resolve, reject) => {
    try {
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
