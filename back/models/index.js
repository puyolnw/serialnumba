const User = require('./User');
const Activity = require('./Activity');
const Session = require('./Session');
const SystemSetting = require('./SystemSetting');
const SerialHistory = require('./SerialHistory');
const Checkin = require('./Checkin');
const Attendance = require('./Attendance');
const Serial = require('./Serial');
const MailSettings = require('./MailSettings');
const EmailQueue = require('./EmailQueue');
const Notification = require('./Notification');
const ActivityReview = require('./ActivityReview');

// Define associations
User.hasMany(Activity, { foreignKey: 'created_by', as: 'createdActivities' });
Activity.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(Session, { foreignKey: 'user_id', as: 'sessions' });
Session.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// New associations for v3
User.hasMany(SystemSetting, { foreignKey: 'updated_by', as: 'updatedSettings' });
SystemSetting.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

User.hasMany(SerialHistory, { foreignKey: 'user_id', as: 'serialHistory' });
SerialHistory.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Activity associations
Activity.hasMany(Checkin, { foreignKey: 'activity_id', as: 'checkins' });
Checkin.belongsTo(Activity, { foreignKey: 'activity_id', as: 'activity' });

Activity.hasMany(Attendance, { foreignKey: 'activity_id', as: 'attendance' });
Attendance.belongsTo(Activity, { foreignKey: 'activity_id', as: 'activity' });

Activity.hasMany(Serial, { foreignKey: 'activity_id', as: 'serials' });
Serial.belongsTo(Activity, { foreignKey: 'activity_id', as: 'activity' });

Activity.hasMany(SerialHistory, { foreignKey: 'activity_id', as: 'serialHistories' });

// User associations
// Note: Checkin doesn't have user_id field, it uses identifier_value instead
User.hasMany(Attendance, { foreignKey: 'confirmed_by', as: 'confirmedAttendance' });
User.hasMany(Serial, { foreignKey: 'user_id', as: 'redeemedSerials' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

// Serial associations
Serial.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
SerialHistory.belongsTo(Serial, { foreignKey: 'serial_id', as: 'serial' });
SerialHistory.belongsTo(Activity, { foreignKey: 'activity_id', as: 'activity' });

// Activity Review associations
User.hasMany(ActivityReview, { foreignKey: 'user_id', as: 'reviews' });
ActivityReview.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Activity.hasMany(ActivityReview, { foreignKey: 'activity_id', as: 'reviews' });
ActivityReview.belongsTo(Activity, { foreignKey: 'activity_id', as: 'activity' });

Serial.hasMany(ActivityReview, { foreignKey: 'serial_id', as: 'reviews' });
ActivityReview.belongsTo(Serial, { foreignKey: 'serial_id', as: 'serial' });

module.exports = {
  User,
  Activity,
  Session,
  SystemSetting,
  SerialHistory,
  Checkin,
  Attendance,
  Serial,
  MailSettings,
  EmailQueue,
  Notification,
  ActivityReview
};
