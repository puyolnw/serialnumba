const express = require('express');
const router = express.Router();
const { Activity, User, Checkin, Attendance } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get all activities (public)
router.get('/', async (req, res) => {
  try {
    const activities = await Activity.findAll({
      where: { status: 'OPEN' },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'role']
        }
      ],
      order: [['start_date', 'ASC']]
    });

    res.json({
      success: true,
      data: { activities },
      message: 'Activities retrieved successfully'
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activities'
    });
  }
});

// Get my activities (authenticated users)
router.get('/my', requireAuth, async (req, res) => {
  try {
    const activities = await Activity.findAll({
      where: { created_by: req.user.id },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'role']
        },
        {
          model: Checkin,
          as: 'checkins',
          attributes: ['id']
        }
      ],
      order: [['id', 'DESC']]
    });

    // Add participant count
    const activitiesWithCount = activities.map(activity => ({
      ...activity.toJSON(),
      participant_count: activity.checkins.length
    }));

    res.json({
      success: true,
      data: { activities: activitiesWithCount },
      message: 'My activities retrieved successfully'
    });
  } catch (error) {
    console.error('Get my activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve my activities'
    });
  }
});

// Create new activity
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      start_date,
      end_date,
      hours_awarded,
      location,
      max_participants,
      status = 'DRAFT'
    } = req.body;

    // Validate required fields
    if (!title || !description || !start_date || !end_date || !hours_awarded) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, start date, end date, and hours awarded are required'
      });
    }

    // Generate unique public slug
    const public_slug = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

    const activity = await Activity.create({
      title,
      description,
      start_date,
      end_date,
      hours_awarded: parseFloat(hours_awarded),
      location,
      max_participants: max_participants ? parseInt(max_participants) : null,
      status,
      public_slug,
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      data: { activity },
      message: 'Activity created successfully'
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create activity'
    });
  }
});

// Get activity by ID
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'role']
        },
        {
          model: Checkin,
          as: 'checkins',
          attributes: ['id', 'identifier_type', 'identifier_value', 'created_at']
        }
      ]
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    res.json({
      success: true,
      data: { activity },
      message: 'Activity retrieved successfully'
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity'
    });
  }
});

// Update activity
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check if user can edit this activity
    if (activity.created_by !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own activities'
      });
    }

    const {
      title,
      description,
      start_date,
      end_date,
      hours_awarded,
      location,
      max_participants,
      status
    } = req.body;

    await activity.update({
      title: title || activity.title,
      description: description || activity.description,
      start_date: start_date || activity.start_date,
      end_date: end_date || activity.end_date,
      hours_awarded: hours_awarded ? parseFloat(hours_awarded) : activity.hours_awarded,
      location: location !== undefined ? location : activity.location,
      max_participants: max_participants ? parseInt(max_participants) : activity.max_participants,
      status: status || activity.status
    });

    res.json({
      success: true,
      data: { activity },
      message: 'Activity updated successfully'
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update activity'
    });
  }
});

// Delete activity
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check if user can delete this activity
    if (activity.created_by !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own activities'
      });
    }

    await activity.destroy();

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete activity'
    });
  }
});

module.exports = router;