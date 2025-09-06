const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SerialHistory = sequelize.define('SerialHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    serial_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'serials',
        key: 'id'
      }
    },
    activity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'activities',
        key: 'id'
      }
    },
    hours_earned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    is_reviewed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    redeemed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'serial_history',
    timestamps: false
  });

  SerialHistory.associate = (models) => {
    SerialHistory.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    SerialHistory.belongsTo(models.Serial, {
      foreignKey: 'serial_id',
      as: 'serial'
    });
    
    SerialHistory.belongsTo(models.Activity, {
      foreignKey: 'activity_id',
      as: 'activity'
    });
  };

module.exports = SerialHistory;
