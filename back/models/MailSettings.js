const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MailSettings = sequelize.define('MailSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  method: {
    type: DataTypes.ENUM('GMAIL_API', 'GMAIL_SMTP'),
    allowNull: false,
    defaultValue: 'GMAIL_API'
  },
  sender_email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  client_id: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  client_secret: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  redirect_uri: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  smtp_host: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  smtp_port: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 587
  },
  workspace_domain: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'mail_settings',
  timestamps: false
});

module.exports = MailSettings;
