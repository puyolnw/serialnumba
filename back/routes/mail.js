const express = require('express');
const { MailSettings, EmailQueue } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get mail settings (admin only)
router.get('/settings', requireRole('ADMIN'), async (req, res) => {
  try {
    let settings = await MailSettings.findByPk(1);
    
    if (!settings) {
      // Create default settings if not exists
      settings = await MailSettings.create({
        id: 1,
        method: 'GMAIL_API',
        sender_email: '',
        client_id: '',
        client_secret: '',
        redirect_uri: '',
        refresh_token: '',
        smtp_host: '',
        smtp_port: 587,
        workspace_domain: '',
        updated_at: new Date()
      });
    }
    
    // Don't return sensitive data
    const safeSettings = {
      id: settings.id,
      method: settings.method,
      sender_email: settings.sender_email,
      smtp_host: settings.smtp_host,
      smtp_port: settings.smtp_port,
      workspace_domain: settings.workspace_domain,
      updated_at: settings.updated_at,
      is_configured: !!(settings.client_id && settings.client_secret)
    };
    
    res.json({
      success: true,
      data: safeSettings
    });
  } catch (error) {
    console.error('Get mail settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mail settings'
    });
  }
});

// Update mail settings (admin only)
router.put('/settings', requireRole('ADMIN'), async (req, res) => {
  try {
    const {
      provider,
      method,
      sender_email,
      from_email,
      from_name,
      username,
      password,
      client_id,
      client_secret,
      redirect_uri,
      refresh_token,
      smtp_host,
      smtp_port,
      smtp_secure,
      workspace_domain
    } = req.body;
    
    // Determine method based on provider
    let mailMethod = method;
    if (provider === 'gmail') {
      mailMethod = 'GMAIL_SMTP';
    } else if (provider === 'gmail-oauth') {
      mailMethod = 'GMAIL_API';
    } else if (provider === 'outlook') {
      mailMethod = 'SMTP';
    } else if (provider === 'custom') {
      mailMethod = 'SMTP';
    }
    
    const emailToUse = from_email || sender_email;
    if (!emailToUse) {
      return res.status(400).json({
        success: false,
        message: 'Sender email is required'
      });
    }
    
    let settings = await MailSettings.findByPk(1);
    
    // Set default SMTP settings based on provider
    let defaultSmtpHost = smtp_host || '';
    let defaultSmtpPort = smtp_port || 587;
    
    if (provider === 'gmail') {
      defaultSmtpHost = 'smtp.gmail.com';
      defaultSmtpPort = 587;
    } else if (provider === 'outlook') {
      defaultSmtpHost = 'smtp-mail.outlook.com';
      defaultSmtpPort = 587;
    }
    
    if (!settings) {
      settings = await MailSettings.create({
        id: 1,
        method: mailMethod,
        sender_email: emailToUse,
        client_id: client_id || '',
        client_secret: client_secret || '',
        redirect_uri: redirect_uri || '',
        refresh_token: refresh_token || '',
        smtp_host: defaultSmtpHost,
        smtp_port: defaultSmtpPort,
        workspace_domain: workspace_domain || '',
        updated_at: new Date()
      });
    } else {
      await settings.update({
        method: mailMethod,
        sender_email: emailToUse,
        client_id: client_id || '',
        client_secret: client_secret || '',
        redirect_uri: redirect_uri || '',
        refresh_token: refresh_token || '',
        smtp_host: defaultSmtpHost,
        smtp_port: defaultSmtpPort,
        workspace_domain: workspace_domain || '',
        updated_at: new Date()
      });
    }
    
    // Don't return sensitive data
    const safeSettings = {
      id: settings.id,
      method: settings.method,
      sender_email: settings.sender_email,
      smtp_host: settings.smtp_host,
      smtp_port: settings.smtp_port,
      workspace_domain: settings.workspace_domain,
      updated_at: settings.updated_at,
      is_configured: !!(settings.client_id && settings.client_secret)
    };
    
    res.json({
      success: true,
      message: 'Mail settings updated successfully',
      data: safeSettings
    });
  } catch (error) {
    console.error('Update mail settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update mail settings'
    });
  }
});

// Test mail configuration (admin only)
router.post('/test', requireRole('ADMIN'), async (req, res) => {
  try {
    const { test_email } = req.body;
    
    if (!test_email) {
      return res.status(400).json({
        success: false,
        message: 'Test email is required'
      });
    }
    
    // Get mail settings
    const settings = await MailSettings.findByPk(1);
    
    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Mail settings not configured. Please save settings first.'
      });
    }
    
    // Check if settings are properly configured
    if (settings.method === 'GMAIL_API' && (!settings.client_id || !settings.client_secret)) {
      return res.status(400).json({
        success: false,
        message: 'Gmail OAuth2 settings not configured. Please provide Client ID and Client Secret.'
      });
    }
    
    if (settings.method === 'GMAIL_SMTP' && (!settings.sender_email)) {
      return res.status(400).json({
        success: false,
        message: 'Gmail SMTP settings not configured. Please provide sender email.'
      });
    }
    
    // Create test email in queue
    const emailQueue = await EmailQueue.create({
      to_email: test_email,
      subject: 'Test Email - Activity Management System',
      body: `
สวัสดี!

นี่คืออีเมลทดสอบจากระบบจัดการกิจกรรม

หากคุณได้รับอีเมลนี้ แสดงว่าการตั้งค่าอีเมลของคุณทำงานได้ถูกต้อง

ส่งเมื่อ: ${new Date().toLocaleString('th-TH')}

ด้วยความนับถือ,
ระบบจัดการกิจกรรม
      `,
      status: 'QUEUED'
    });
    
    res.json({
      success: true,
      message: 'Test email queued successfully. Please check your inbox.',
      data: {
        email_queue_id: emailQueue.id,
        to_email: test_email,
        method: settings.method
      }
    });
  } catch (error) {
    console.error('Test mail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email: ' + error.message
    });
  }
});

// Get email queue (admin only)
router.get('/queue', requireRole('ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (status) whereClause.status = status;
    
    const { count, rows: emails } = await EmailQueue.findAndCountAll({
      where: whereClause,
      order: [['id', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        emails,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get email queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email queue'
    });
  }
});

// Retry failed emails (admin only)
router.post('/retry', requireRole('ADMIN'), async (req, res) => {
  try {
    const { email_queue_id } = req.body;
    
    if (!email_queue_id) {
      return res.status(400).json({
        success: false,
        message: 'Email queue ID is required'
      });
    }
    
    const email = await EmailQueue.findByPk(email_queue_id);
    
    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }
    
    if (email.status === 'SENT') {
      return res.status(400).json({
        success: false,
        message: 'Email has already been sent'
      });
    }
    
    // Reset status to QUEUED
    await email.update({
      status: 'QUEUED',
      last_error: null
    });
    
    res.json({
      success: true,
      message: 'Email queued for retry',
      data: {
        email_queue_id: email.id,
        to_email: email.to_email
      }
    });
  } catch (error) {
    console.error('Retry email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry email'
    });
  }
});

// Get mail statistics (admin only)
router.get('/stats', requireRole('ADMIN'), async (req, res) => {
  try {
    const [
      totalEmails,
      queuedEmails,
      sentEmails,
      failedEmails
    ] = await Promise.all([
      EmailQueue.count(),
      EmailQueue.count({ where: { status: 'QUEUED' } }),
      EmailQueue.count({ where: { status: 'SENT' } }),
      EmailQueue.count({ where: { status: 'FAILED' } })
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalEmails,
        queued: queuedEmails,
        sent: sentEmails,
        failed: failedEmails
      }
    });
  } catch (error) {
    console.error('Get mail stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mail statistics'
    });
  }
});

module.exports = router;
