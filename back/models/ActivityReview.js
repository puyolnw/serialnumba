const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityReview = sequelize.define('ActivityReview', {
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
  activity_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'activities',
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
  fun_rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  learning_rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  organization_rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  venue_rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  overall_rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  suggestion: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'activity_reviews',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

ActivityReview.associate = (models) => {
  ActivityReview.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  ActivityReview.belongsTo(models.Activity, {
    foreignKey: 'activity_id',
    as: 'activity'
  });
};

module.exports = ActivityReview;
