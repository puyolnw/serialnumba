const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const nodemailer = require('nodemailer');
const emailProcessor = require('./services/emailProcessor');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ----- ตั้งค่า Gmail SMTP สำหรับทดสอบ -----
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,                 // smtp.gmail.com
  port: Number(process.env.SMTP_PORT) || 587,  // 587 = STARTTLS
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,               // App Password 16 หลัก
  },
  pool: true,                                  // คิวส่งเมลหลายฉบับ
  tls: { ciphers: 'TLSv1.2' },
});

// Middleware - CORS อนุญาตทุก origin รวม ngrok
app.use(cors({
  origin: function (origin, callback) {
    // อนุญาตทุก origin รวม ngrok
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'ngrok-skip-browser-warning']
}));

// Middleware สำหรับ ngrok warning
app.use((req, res, next) => {
  res.header('ngrok-skip-browser-warning', 'true');
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ----- Mail Testing Routes -----
app.post('/api/test-email', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    // validate ง่าย ๆ
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({
        ok: false,
        error: 'ต้องมี to, subject และ text หรือ html อย่างน้อย 1 อย่าง',
      });
    }

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL, // "Your Name <yourgmail@gmail.com>"
      to,
      subject,
      text: text || undefined,
      html:
        html ||
        `<div style="font-family:system-ui,Segoe UI,Roboto">
          <h2 style="margin:0 0 8px">สวัสดีจากระบบ</h2>
          <p style="margin:0">นี่คืออีเมลทดสอบจาก localhost ผ่าน Gmail SMTP</p>
        </div>`,
    });

    return res.json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error('❌ ส่งอีเมลไม่สำเร็จ:', err);
    return res.status(500).json({ ok: false, error: err?.response || String(err) });
  }
});

// Import routes
const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activities');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');
const publicRoutes = require('./routes/public');
const attendanceRoutes = require('./routes/attendance');
const serialRoutes = require('./routes/serials');
const mailRoutes = require('./routes/mail');
const reportRoutes = require('./routes/reports');
const certificateRoutes = require('./routes/certificate');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/serials', serialRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/admin/reports', reportRoutes);
app.use('/api/certificate', certificateRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sync database models (only if needed)
    try {
      await sequelize.sync({ 
        alter: false,  // Don't alter existing tables
        force: false   // Don't drop and recreate tables
      });
      console.log('Database models synchronized.');
    } catch (error) {
      if (error.code === 'ER_TOO_MANY_KEYS') {
        console.log('⚠️  Too many keys error detected. Skipping sync to prevent duplicate indexes.');
        console.log('💡 Run the fix-indexes script manually if needed.');
      } else {
        throw error;
      }
    }
    
    // ตรวจสภาพ SMTP ตอนเริ่ม
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await transporter.verify();
        console.log('✅ Gmail SMTP พร้อมใช้งาน - ทดสอบส่งอีเมลได้ที่ POST /api/test-email');
        
        // Initialize email processor
        await emailProcessor.initialize();
      } catch (err) {
        console.error('❌ SMTP error:', err.message);
        console.log('⚠️  การส่งอีเมลอาจไม่ทำงาน - ตรวจสอบการตั้งค่า SMTP ใน .env');
      }
    } else {
      console.log('⚠️  ไม่พบการตั้งค่า SMTP - ข้ามการตรวจสอบ');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📧 Mail testing endpoint: http://localhost:${PORT}/api/test-email`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
