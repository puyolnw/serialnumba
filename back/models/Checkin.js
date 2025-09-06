const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Checkin = sequelize.define('Checkin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  activity_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'activities',
      key: 'id'
    }
  },
  identifier_type: {
    type: DataTypes.ENUM('EMAIL', 'USERNAME', 'STUDENT_CODE'),
    allowNull: false
  },
  identifier_value: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  student_code: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  dedup_hash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true
  },
  serial_sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  serial_sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'checkins',
  timestamps: false
});

module.exports = Checkin;
