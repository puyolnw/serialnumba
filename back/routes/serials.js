const express = require('express');
const { Serial, Activity, User, EmailQueue, Checkin } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const nodemailer = require('nodemailer');

const router = express.Router();

// Create transporter for immediate email sending
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true,
  tls: { ciphers: 'TLSv1.2' },
});

// Generate unique serial code
function generateSerialCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get all serials (admin/staff only)
router.get('/', requireRole('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, activity_id } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (activity_id) whereClause.activity_id = activity_id;

    const { count, rows: serials } = await Serial.findAndCountAll({
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
        }
      ],
      order: [['id', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        serials,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get serials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch serials'
    });
  }
});

// Generate serials for activity (admin/staff only)
router.post('/generate', requireRole('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { activity_id, count = 1 } = req.body;

    if (!activity_id) {
      return res.status(400).json({
        success: false,
        message: 'Activity ID is required'
      });
    }

    // Find activity
    const activity = await Activity.findByPk(activity_id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    const generatedSerials = [];
    const errors = [];

    for (let i = 0; i < count; i++) {
      try {
        const serialCode = generateSerialCode();
        
        // Check if code already exists
        const existingSerial = await Serial.findOne({
          where: { code: serialCode }
        });

        if (existingSerial) {
          errors.push({ index: i, error: 'Serial code already exists' });
          continue;
        }

        const serial = await Serial.create({
          activity_id,
          code: serialCode,
          status: 'PENDING'
        });

        generatedSerials.push(serial);
      } catch (error) {
        errors.push({ index: i, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Generated ${generatedSerials.length} serial codes`,
      data: {
        generated: generatedSerials,
        errors: errors
      }
    });
  } catch (error) {
    console.error('Generate serials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate serials'
    });
  }
});

// Generate and send serial to participant (admin/staff only)
router.post('/send', requireRole('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { activity_id, participant_id, method = 'email' } = req.body;
    
    console.log('🔵 [SERIAL SEND] Request received:', {
      activity_id,
      participant_id,
      method,
      timestamp: new Date().toISOString()
    });

    if (!activity_id || !participant_id) {
      return res.status(400).json({
        success: false,
        message: 'Activity ID and participant ID are required'
      });
    }

    // Check if participant has checked in to this activity
    const checkin = await Checkin.findOne({
      where: { 
        activity_id, 
        id: participant_id  // participant_id คือ checkin.id
      },
      include: [{
        model: Activity,
        as: 'activity',
        attributes: ['id', 'title', 'hours_awarded', 'start_date', 'end_date']
      }]
    });

    console.log('🔍 [SERIAL SEND] Checkin found:', {
      checkin_id: checkin?.id,
      activity_id: checkin?.activity_id,
      activity_title: checkin?.activity?.title,
      activity_hours: checkin?.activity?.hours_awarded,
      identifier_type: checkin?.identifier_type,
      identifier_value: checkin?.identifier_value
    });

    if (!checkin) {
      console.log('❌ [SERIAL SEND] Checkin not found:', participant_id);
      return res.status(404).json({
        success: false,
        message: 'Participant checkin not found'
      });
    }

    // Check if serial already exists for this checkin
    const existingSerial = await Serial.findOne({
      where: { 
        activity_id, 
        identifier_value: checkin.identifier_value 
      }
    });

    if (existingSerial) {
      console.log('⚠️ [SERIAL SEND] Serial already exists for this participant');
      
      // Update checkin status even if serial already exists
      await checkin.update({
        serial_sent: true,
        serial_sent_at: new Date()
      });
      
      console.log('🔄 [SERIAL SEND] Checkin status updated - serial already exists');
      
      return res.status(400).json({
        success: false,
        message: 'Serial already exists for this participant'
      });
    }

    // Generate serial code
    const serialCode = generateSerialCode();
    
    console.log('🎫 [SERIAL SEND] Generated serial code:', serialCode);
    
    // Create serial
    const serial = await Serial.create({
      code: serialCode,
      activity_id,
      user_id: null, // ไม่มี user_id เพราะไม่ได้ login
      identifier_value: checkin.identifier_value, // ใช้ email ที่ลงทะเบียน
      status: 'PENDING'
    });

    console.log('💾 [SERIAL SEND] Serial created:', {
      serial_id: serial.id,
      code: serial.code,
      activity_id: serial.activity_id,
      user_id: serial.user_id,
      status: serial.status
    });

    // Send via email if requested
    if (method === 'email') {
      console.log('📧 [SERIAL SEND] Preparing to send email to:', checkin.identifier_value);
      
      try {
        const emailSubject = `🎫 รหัสซีเรียลสำหรับกิจกรรม: ${checkin.activity.title}`;
        
        console.log('📧 [SERIAL SEND] Email details:', {
          to: checkin.identifier_value,
          subject: emailSubject,
          activity_title: checkin.activity.title,
          activity_hours: checkin.activity.hours_awarded,
          serial_code: serialCode
        });
        
        // Get participant name and student code from checkin record
        const participantName = checkin.name || checkin.identifier_value;
        const studentCode = checkin.student_code || 'ไม่ระบุ';
        
        const emailBody = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🎫 รหัสซีเรียลของคุณ</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${checkin.activity.title}</p>
            </div>
            <div style="padding: 30px;">
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
                <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">👤 ข้อมูลผู้เข้าร่วม</h3>
                <p style="margin: 5px 0; color: #495057;"><strong>ชื่อ-นามสกุล:</strong> ${participantName}</p>
                <p style="margin: 5px 0; color: #495057;"><strong>รหัสนิสิต:</strong> ${studentCode}</p>
                <p style="margin: 5px 0; color: #495057;"><strong>อีเมล:</strong> ${checkin.identifier_value}</p>
              </div>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #17a2b8;">
                <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">📧 ข้อมูลกิจกรรม</h3>
                <p style="margin: 5px 0; color: #495057;"><strong>ชื่อกิจกรรม:</strong> ${checkin.activity.title}</p>
                <p style="margin: 5px 0; color: #495057;"><strong>ชั่วโมงที่ได้รับ:</strong> ${checkin.activity.hours_awarded || 0} ชั่วโมง</p>
                ${checkin.activity.start_date ? `<p style="margin: 5px 0; color: #495057;"><strong>วันที่เริ่ม:</strong> ${new Date(checkin.activity.start_date).toLocaleDateString('th-TH')}</p>` : ''}
                ${checkin.activity.end_date ? `<p style="margin: 5px 0; color: #495057;"><strong>วันที่สิ้นสุด:</strong> ${new Date(checkin.activity.end_date).toLocaleDateString('th-TH')}</p>` : ''}
                <p style="margin: 5px 0; color: #495057;"><strong>วันที่ส่งรหัส:</strong> ${new Date().toLocaleString('th-TH')}</p>
              </div>
              <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3; text-align: center;">
                <h3 style="color: #1565c0; margin: 0 0 15px 0; font-size: 18px;">🔑 รหัสซีเรียลของคุณ</h3>
                <div style="background: #ffffff; padding: 15px; border-radius: 5px; border: 2px dashed #2196f3; margin: 10px 0;">
                  <span style="font-size: 24px; font-weight: bold; color: #1565c0; letter-spacing: 2px;">${serialCode}</span>
                </div>
                <p style="margin: 10px 0 0 0; color: #424242; font-size: 14px;">รหัสนี้มีอายุ 30 วัน นับจากวันที่ส่ง</p>
              </div>
              <div style="text-align: center; margin-top: 25px; padding: 20px; background: #f1f8e9; border-radius: 8px; border-left: 4px solid #4caf50;">
                <p style="margin: 0; color: #2e7d32; font-weight: 600; font-size: 16px;">✅ ขอบคุณที่เข้าร่วมกิจกรรม!</p>
                <p style="margin: 5px 0 0 0; color: #388e3c; font-size: 14px;">คุณสามารถใช้รหัสนี้แลกคะแนนในระบบได้</p>
              </div>
            </div>
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">ส่งจากระบบ Workflow Management System</p>
            </div>
          </div>
        `;
        
        // Send email immediately
        console.log('📤 [SERIAL SEND] Sending email via transporter...');
        
        const info = await transporter.sendMail({
          from: process.env.FROM_EMAIL || `"Workflow System" <${process.env.SMTP_USER}>`,
          to: checkin.identifier_value,
          subject: emailSubject,
          html: emailBody,
          text: emailBody.replace(/<[^>]*>/g, '') // Strip HTML for text version
        });

        console.log(`✅ [SERIAL SEND] Email sent successfully:`, {
          to: checkin.identifier_value,
          message_id: info.messageId,
          response: info.response
        });
        
        // Update serial status to SENT
        await serial.update({
          status: 'SENT',
          sent_at: new Date()
        });
        
        console.log('🔄 [SERIAL SEND] Serial status updated to SENT');
        
        // Update checkin status to indicate serial has been sent
        await checkin.update({
          serial_sent: true,
          serial_sent_at: new Date()
        });
        
        console.log('🔄 [SERIAL SEND] Checkin status updated - serial sent');
      } catch (emailError) {
        console.error(`❌ [SERIAL SEND] Email send failed:`, {
          to: checkin.identifier_value,
          error: emailError.message,
          stack: emailError.stack
        });
        // Keep serial status as PENDING if email fails
      }
    }

    const responseData = { 
      serial,
      code: serialCode,
      email_sent: method === 'email'
    };
    
    console.log('📤 [SERIAL SEND] Sending response:', {
      success: true,
      message: 'Serial generated and sent successfully',
      data: responseData
    });
    
    res.json({
      success: true,
      message: 'Serial generated and sent successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Generate serial error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate serial'
    });
  }
});

// Check if participant has serial
router.get('/check/:activity_id/:participant_id', requireRole('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { activity_id, participant_id } = req.params;

    // Find the checkin record to get identifier info
    const checkin = await Checkin.findByPk(participant_id);
    if (!checkin) {
      return res.json({
        success: true,
        data: { hasSerial: false }
      });
    }

    // Check if serial exists for this participant
    const serial = await Serial.findOne({
      where: { 
        activity_id,
        [Op.or]: [
          { user_id: participant_id },
          { identifier_value: checkin.identifier_value }
        ]
      }
    });

    res.json({
      success: true,
      data: { hasSerial: !!serial }
    });
  } catch (error) {
    console.error('Check serial error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check serial'
    });
  }
});

// Send serial via email (admin/staff only)
router.post('/send', requireRole('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { serial_id, to_email, custom_message } = req.body;

    if (!serial_id || !to_email) {
      return res.status(400).json({
        success: false,
        message: 'Serial ID and email are required'
      });
    }

    // Find serial
    const serial = await Serial.findByPk(serial_id, {
      include: [{
        model: Activity,
        as: 'activity',
        attributes: ['id', 'title', 'hours_awarded']
      }]
    });

    if (!serial) {
      return res.status(404).json({
        success: false,
        message: 'Serial not found'
      });
    }

    if (serial.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Serial has already been sent or redeemed'
      });
    }

    // Create email queue entry
    const emailSubject = `Serial Code - ${serial.activity.title}`;
    const emailBody = generateEmailTemplate(serial, custom_message);

    const emailQueue = await EmailQueue.create({
      to_email: to_email,
      subject: emailSubject,
      body: emailBody,
      status: 'QUEUED'
    });

    // Update serial status
    await serial.update({
      status: 'SENT',
      sent_at: new Date()
    });

    res.json({
      success: true,
      message: 'Serial sent successfully',
      data: {
        serial_id: serial.id,
        serial_code: serial.code,
        to_email: to_email,
        email_queue_id: emailQueue.id
      }
    });
  } catch (error) {
    console.error('Send serial error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send serial'
    });
  }
});

// Bulk send serials (admin/staff only)
router.post('/send-bulk', requireRole('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { serial_ids, custom_message } = req.body;

    if (!serial_ids || !Array.isArray(serial_ids) || serial_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Serial IDs array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const serial_id of serial_ids) {
      try {
        // Find serial
        const serial = await Serial.findByPk(serial_id, {
          include: [{
            model: Activity,
            as: 'activity',
            attributes: ['id', 'title', 'hours_awarded']
          }]
        });

        if (!serial) {
          errors.push({ serial_id, error: 'Serial not found' });
          continue;
        }

        if (serial.status !== 'PENDING') {
          errors.push({ serial_id, error: 'Serial already sent or redeemed' });
          continue;
        }

        // Determine recipient email
        let toEmail = null;
        if (serial.user_id) {
          const user = await User.findByPk(serial.user_id);
          toEmail = user ? user.email : null;
        } else if (serial.identifier_value) {
          // Try to find user by identifier
          const user = await User.findOne({
            where: {
              [Op.or]: [
                { email: serial.identifier_value },
                { username: serial.identifier_value },
                { student_code: serial.identifier_value }
              ]
            }
          });
          toEmail = user ? user.email : serial.identifier_value;
        }

        if (!toEmail) {
          errors.push({ serial_id, error: 'No email address found' });
          continue;
        }

        // Get participant info from checkin record
        const checkin = await Checkin.findOne({
          where: { 
            activity_id: serial.activity_id,
            identifier_value: toEmail
          },
          attributes: ['name', 'student_code']
        });
        
        const participantName = checkin?.name || toEmail;
        const studentCode = checkin?.student_code || 'ไม่ระบุ';

        // Send email immediately
        const emailSubject = `🎫 รหัสซีเรียลสำหรับกิจกรรม: ${serial.activity.title}`;
        const emailBody = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🎫 รหัสซีเรียลของคุณ</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${serial.activity.title}</p>
            </div>
            <div style="padding: 30px;">
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
                <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">👤 ข้อมูลผู้เข้าร่วม</h3>
                <p style="margin: 5px 0; color: #495057;"><strong>ชื่อ-นามสกุล:</strong> ${participantName}</p>
                <p style="margin: 5px 0; color: #495057;"><strong>รหัสนิสิต:</strong> ${studentCode}</p>
                <p style="margin: 5px 0; color: #495057;"><strong>อีเมล:</strong> ${toEmail}</p>
              </div>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #17a2b8;">
                <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">📧 ข้อมูลกิจกรรม</h3>
                <p style="margin: 5px 0; color: #495057;"><strong>ชื่อกิจกรรม:</strong> ${serial.activity.title}</p>
                <p style="margin: 5px 0; color: #495057;"><strong>ชั่วโมงที่ได้รับ:</strong> ${serial.activity.hours_awarded} ชั่วโมง</p>
                <p style="margin: 5px 0; color: #495057;"><strong>วันที่ส่ง:</strong> ${new Date().toLocaleString('th-TH')}</p>
              </div>
              <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3; text-align: center;">
                <h3 style="color: #1565c0; margin: 0 0 15px 0; font-size: 18px;">🔑 รหัสซีเรียลของคุณ</h3>
                <div style="background: #ffffff; padding: 15px; border-radius: 5px; border: 2px dashed #2196f3; margin: 10px 0;">
                  <span style="font-size: 24px; font-weight: bold; color: #1565c0; letter-spacing: 2px;">${serial.code}</span>
                </div>
                <p style="margin: 10px 0 0 0; color: #424242; font-size: 14px;">รหัสนี้มีอายุ 30 วัน นับจากวันที่ส่ง</p>
              </div>
              <div style="text-align: center; margin-top: 25px; padding: 20px; background: #f1f8e9; border-radius: 8px; border-left: 4px solid #4caf50;">
                <p style="margin: 0; color: #2e7d32; font-weight: 600; font-size: 16px;">✅ ขอบคุณที่เข้าร่วมกิจกรรม!</p>
                <p style="margin: 5px 0 0 0; color: #388e3c; font-size: 14px;">คุณสามารถใช้รหัสนี้แลกคะแนนในระบบได้</p>
              </div>
            </div>
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">ส่งจากระบบ Workflow Management System</p>
            </div>
          </div>
        `;

        try {
          // Send email immediately
          const info = await transporter.sendMail({
            from: process.env.FROM_EMAIL || `"Workflow System" <${process.env.SMTP_USER}>`,
            to: toEmail,
            subject: emailSubject,
            html: emailBody,
            text: emailBody.replace(/<[^>]*>/g, '') // Strip HTML for text version
          });

          console.log(`✅ ส่งอีเมล Serial สำเร็จ: ${toEmail} (Message ID: ${info.messageId})`);
          
          // Update serial status to SENT
          await serial.update({
            status: 'SENT',
            sent_at: new Date()
          });

          results.push({
            serial_id: serial.id,
            serial_code: serial.code,
            to_email: toEmail,
            message_id: info.messageId,
            email_sent: true
          });
        } catch (emailError) {
          console.error(`❌ ส่งอีเมล Serial ไม่สำเร็จ: ${toEmail}`, emailError.message);
          errors.push({ serial_id, error: `Email send failed: ${emailError.message}` });
        }
      } catch (error) {
        errors.push({ serial_id, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Processed ${serial_ids.length} serials`,
      data: {
        sent: results,
        errors: errors
      }
    });
  } catch (error) {
    console.error('Bulk send serials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send serials'
    });
  }
});

// Get serial statistics (admin/staff only)
router.get('/stats', requireRole('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const [
      totalSerials,
      pendingSerials,
      sentSerials,
      redeemedSerials
    ] = await Promise.all([
      Serial.count(),
      Serial.count({ where: { status: 'PENDING' } }),
      Serial.count({ where: { status: 'SENT' } }),
      Serial.count({ where: { status: 'REDEEMED' } })
    ]);

    res.json({
      success: true,
      data: {
        total: totalSerials,
        pending: pendingSerials,
        sent: sentSerials,
        redeemed: redeemedSerials
      }
    });
  } catch (error) {
    console.error('Get serial stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch serial statistics'
    });
  }
});

// Get pending serial count for notifications (admin/staff only)
router.get('/pending-count', requireRole('ADMIN', 'STAFF'), async (req, res) => {
  try {
    // Count checkins that have serial_sent_at as NULL (not sent yet)
    const pendingCount = await sequelize.query(`
      SELECT COUNT(DISTINCT c.id) as count
      FROM checkins c
      INNER JOIN activities a ON c.activity_id = a.id
      WHERE a.status IN ('OPEN', 'CLOSED')
        AND c.serial_sent_at IS NULL
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    const count = pendingCount[0]?.count || 0;

    res.json({
      success: true,
      data: {
        pending_serials: parseInt(count)
      }
    });
  } catch (error) {
    console.error('Get pending serial count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending serial count'
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

// Helper function to generate email template
function generateEmailTemplate(serial, customMessage) {
  const defaultMessage = `
Dear Participant,

Thank you for participating in "${serial.activity.title}".

Your serial code is: ${serial.code}
Hours awarded: ${serial.activity.hours_awarded}

You can redeem this code in the student portal to add hours to your account.

Best regards,
Activity Management System
  `;

  return customMessage ? `${customMessage}\n\n${defaultMessage}` : defaultMessage;
}

module.exports = router;
