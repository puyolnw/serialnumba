const nodemailer = require('nodemailer');
const { EmailQueue, MailSettings } = require('../models');

class EmailProcessor {
  constructor() {
    this.transporter = null;
    this.isProcessing = false;
    this.processInterval = null;
  }

  async initialize() {
    try {
      // Get mail settings
      const settings = await MailSettings.findByPk(1);
      
      if (!settings) {
        console.log('⚠️  ไม่พบการตั้งค่าอีเมล - ข้ามการเริ่มต้น Email Processor');
        return;
      }

      // Create transporter based on settings
      if (settings.method === 'GMAIL_SMTP' || settings.method === 'SMTP' || settings.method === 'GMAIL_API') {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || settings.smtp_host || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT || settings.smtp_port || 587),
          secure: false,
          auth: {
            user: process.env.SMTP_USER || settings.sender_email,
            pass: process.env.SMTP_PASS || settings.client_secret, // Using client_secret as password for SMTP
          },
          pool: true,
          tls: { ciphers: 'TLSv1.2' },
        });

        // Verify connection
        await this.transporter.verify();
        console.log(`✅ Email Processor พร้อมใช้งาน (${settings.method})`);
      } else {
        console.log('⚠️  Email Processor ไม่รองรับ method:', settings.method);
        return;
      }

      // Start processing emails
      this.startProcessing();
    } catch (error) {
      console.error('❌ Email Processor initialization error:', error.message);
    }
  }

  startProcessing() {
    if (this.processInterval) {
      clearInterval(this.processInterval);
    }

    // Process emails every 30 seconds
    this.processInterval = setInterval(() => {
      this.processEmails();
    }, 30000);

    console.log('📧 Email Processor เริ่มทำงาน - ตรวจสอบทุก 30 วินาที');
  }

  stopProcessing() {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
    console.log('⏹️  Email Processor หยุดทำงาน');
  }

  async processEmails() {
    if (this.isProcessing || !this.transporter) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get queued emails (limit to 10 at a time)
      const queuedEmails = await EmailQueue.findAll({
        where: { status: 'QUEUED' },
        order: [['created_at', 'ASC']],
        limit: 10
      });

      if (queuedEmails.length === 0) {
        return;
      }

      console.log(`📤 กำลังส่งอีเมล ${queuedEmails.length} ฉบับ...`);

      for (const email of queuedEmails) {
        await this.sendEmail(email);
      }
    } catch (error) {
      console.error('❌ Email processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async sendEmail(emailQueue) {
    try {
      // Update status to processing
      await emailQueue.update({
        status: 'PENDING',
        attempts: emailQueue.attempts + 1
      });

      // Send email
      const info = await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || `"Workflow System" <${process.env.SMTP_USER}>`,
        to: emailQueue.to_email,
        subject: emailQueue.subject,
        html: emailQueue.body,
        text: emailQueue.body.replace(/<[^>]*>/g, '') // Strip HTML for text version
      });

      // Update status to sent
      await emailQueue.update({
        status: 'SENT',
        sent_at: new Date(),
        error_message: null
      });

      console.log(`✅ ส่งอีเมลสำเร็จ: ${emailQueue.to_email} (Message ID: ${info.messageId})`);
    } catch (error) {
      console.error(`❌ ส่งอีเมลไม่สำเร็จ: ${emailQueue.to_email}`, error.message);

      // Update status to failed if max attempts reached
      const newAttempts = emailQueue.attempts + 1;
      const status = newAttempts >= emailQueue.max_attempts ? 'FAILED' : 'QUEUED';

      await emailQueue.update({
        status: status,
        attempts: newAttempts,
        error_message: error.message
      });

      if (status === 'FAILED') {
        console.log(`💥 อีเมลล้มเหลวถาวร: ${emailQueue.to_email} (${newAttempts}/${emailQueue.max_attempts} attempts)`);
      }
    }
  }

  async sendTestEmail(toEmail, subject, body) {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || `"Workflow System" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: subject,
        html: body,
        text: body.replace(/<[^>]*>/g, '')
      });

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const emailProcessor = new EmailProcessor();

module.exports = emailProcessor;
