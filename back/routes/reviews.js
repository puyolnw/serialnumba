const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { ActivityReview, SerialHistory, User, Activity, Serial } = require('../models');

// สร้างรีวิวกิจกรรม
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      serial_id,
      fun_rating,
      learning_rating,
      organization_rating,
      venue_rating,
      overall_rating,
      suggestion
    } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!serial_id || !fun_rating || !learning_rating || !organization_rating || !venue_rating || !overall_rating) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    // ตรวจสอบคะแนน (1-5)
    const ratings = [fun_rating, learning_rating, organization_rating, venue_rating, overall_rating];
    for (const rating of ratings) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'คะแนนต้องอยู่ระหว่าง 1-5'
        });
      }
    }

    // ตรวจสอบว่า serial นี้เป็นของ user นี้หรือไม่
    const serialHistory = await SerialHistory.findOne({
      where: {
        id: serial_id,
        user_id: req.user.id
      },
      include: [
        { model: Activity, as: 'activity' },
        { model: Serial, as: 'serial' }
      ]
    });

    if (!serialHistory) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ Serial หรือคุณไม่มีสิทธิ์รีวิว'
      });
    }

    // ตรวจสอบว่ารีวิวแล้วหรือยัง
    if (serialHistory.is_reviewed) {
      return res.status(400).json({
        success: false,
        message: 'คุณได้รีวิวกิจกรรมนี้แล้ว'
      });
    }

    // สร้างรีวิว
    const review = await ActivityReview.create({
      user_id: req.user.id,
      activity_id: serialHistory.activity_id,
      serial_id: serial_id,
      fun_rating,
      learning_rating,
      organization_rating,
      venue_rating,
      overall_rating,
      suggestion: suggestion || null
    });

    // อัปเดต serial_history ว่าได้รีวิวแล้ว
    await serialHistory.update({ is_reviewed: true });

    res.json({
      success: true,
      data: { review },
      message: 'รีวิวสำเร็จ'
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถสร้างรีวิวได้'
    });
  }
});

// ดึงรีวิวของ user
router.get('/my-reviews', requireAuth, async (req, res) => {
  try {
    const reviews = await ActivityReview.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Activity, as: 'activity' },
        { model: Serial, as: 'serial' }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { reviews },
      message: 'ดึงรีวิวสำเร็จ'
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงรีวิวได้'
    });
  }
});

// ดึงรีวิวของกิจกรรม
router.get('/activity/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    
    const reviews = await ActivityReview.findAll({
      where: { activity_id: activityId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'username'] }
      ],
      order: [['created_at', 'DESC']]
    });

    // คำนวณคะแนนเฉลี่ย
    const avgRatings = {
      fun_rating: 0,
      learning_rating: 0,
      organization_rating: 0,
      venue_rating: 0,
      overall_rating: 0
    };

    if (reviews.length > 0) {
      Object.keys(avgRatings).forEach(key => {
        avgRatings[key] = (reviews.reduce((sum, review) => sum + review[key], 0) / reviews.length).toFixed(1);
      });
    }

    res.json({
      success: true,
      data: { 
        reviews,
        average_ratings: avgRatings,
        total_reviews: reviews.length
      },
      message: 'ดึงรีวิวกิจกรรมสำเร็จ'
    });
  } catch (error) {
    console.error('Get activity reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงรีวิวกิจกรรมได้'
    });
  }
});

// ดึง serial ที่ยังไม่ได้รีวิว
router.get('/pending-reviews', requireAuth, async (req, res) => {
  try {
    const pendingReviews = await SerialHistory.findAll({
      where: {
        user_id: req.user.id,
        is_reviewed: false
      },
      include: [
        { model: Activity, as: 'activity' },
        { model: Serial, as: 'serial' }
      ],
      order: [['redeemed_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { pendingReviews },
      message: 'ดึง Serial ที่รอรีวิวสำเร็จ'
    });
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึง Serial ที่รอรีวิวได้'
    });
  }
});

module.exports = router;
