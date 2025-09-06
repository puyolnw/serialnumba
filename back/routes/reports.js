const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/auth');
const { User, Activity, ActivityReview, SerialHistory, Serial } = require('../models');
const { Op, QueryTypes, fn, col, literal } = require('sequelize');
const sequelize = require('../config/database');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Helper function to get date range for SerialHistory
const getDateRange = (startDate, endDate) => {
  const where = {};
  if (startDate && endDate) {
    where.redeemed_at = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  } else if (startDate) {
    where.redeemed_at = {
      [Op.gte]: new Date(startDate)
    };
  } else if (endDate) {
    where.redeemed_at = {
      [Op.lte]: new Date(endDate)
    };
  }
  return where;
};

// Helper function to get date range for Activities
const getActivityDateRange = (startDate, endDate) => {
  const where = {};
  if (startDate && endDate) {
    where.start_date = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  } else if (startDate) {
    where.start_date = {
      [Op.gte]: new Date(startDate)
    };
  } else if (endDate) {
    where.start_date = {
      [Op.lte]: new Date(endDate)
    };
  }
  return where;
};


// Staff Routes - Activity Reports
router.get('/staff/activities', requireRole('STAFF'), async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    // Build where clause for date range
    const dateWhere = getActivityDateRange(startDate, endDate);
    
    // Build where clause for status (removed category since activities table has no category column)
    const where = { ...dateWhere };
    if (status) where.status = status;

    // Get activities with participants count
    const activities = await Activity.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['start_date', 'DESC']]
    });

    // Get participants count for each activity
    const activitiesWithParticipants = await Promise.all(
      activities.map(async (activity) => {
        const participantCount = await activity.countCheckins();
        return {
          ...activity.toJSON(),
          participantCount
        };
      })
    );

    // Get summary statistics
    const totalActivities = activities.length;
    const completedActivities = activities.filter(a => a.status === 'CLOSED').length;
    const totalParticipants = activitiesWithParticipants.reduce((sum, a) => sum + a.participantCount, 0);
    
    // Get average rating
    const avgRatingResult = await ActivityReview.findOne({
      attributes: [
        [fn('AVG', col('overall_rating')), 'avg_rating']
      ],
      include: [{
        model: Activity,
        as: 'activity',
        where: where,
        required: true
      }]
    });
    const averageRating = avgRatingResult ? parseFloat(avgRatingResult.dataValues.avg_rating) || 0 : 0;

    // Get participation trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const participationTrend = await sequelize.query(`
      SELECT 
        DATE_FORMAT(a.start_date, '%Y-%m') as month,
        COUNT(DISTINCT c.id) as participants
      FROM activities a
      LEFT JOIN checkins c ON a.id = c.activity_id
      WHERE a.start_date >= :sixMonthsAgo
      GROUP BY DATE_FORMAT(a.start_date, '%Y-%m')
      ORDER BY month
    `, {
      replacements: { sixMonthsAgo },
      type: QueryTypes.SELECT
    });

    // Get activity status distribution
    const activityStatus = await Activity.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      where: dateWhere,
      group: ['status']
    });

    // Get top activities by participants
    const topActivities = await sequelize.query(`
      SELECT 
        a.id,
        a.title,
        a.start_date,
        a.status,
        COUNT(c.id) as participantCount,
        AVG(ar.overall_rating) as averageRating
      FROM activities a
      LEFT JOIN checkins c ON a.id = c.activity_id
      LEFT JOIN activity_reviews ar ON a.id = ar.activity_id
      WHERE 1=1
      ${startDate ? 'AND a.start_date >= :startDate' : ''}
      ${endDate ? 'AND a.start_date <= :endDate' : ''}
      ${status ? 'AND a.status = :status' : ''}
      GROUP BY a.id, a.title, a.start_date, a.status
      ORDER BY participantCount DESC
      LIMIT 10
    `, {
      replacements: { startDate, endDate, status },
      type: QueryTypes.SELECT
    });

    // Get rating distribution
    const ratingDistribution = await sequelize.query(`
      SELECT 
        ar.overall_rating,
        COUNT(*) as count
      FROM activity_reviews ar
      JOIN activities a ON ar.activity_id = a.id
      WHERE 1=1
      ${startDate ? 'AND a.start_date >= :startDate' : ''}
      ${endDate ? 'AND a.start_date <= :endDate' : ''}
      ${status ? 'AND a.status = :status' : ''}
      GROUP BY ar.overall_rating
      ORDER BY ar.overall_rating
    `, {
      replacements: { startDate, endDate, status },
      type: QueryTypes.SELECT
    });

    // Format rating distribution
    const ratingDist = [0, 0, 0, 0, 0];
    ratingDistribution.forEach(r => {
      if (r.overall_rating >= 1 && r.overall_rating <= 5) {
        ratingDist[r.overall_rating - 1] = parseInt(r.count);
      }
    });

    // Get unique statuses for filter options (removed categories since activities table has no category column)
    const statuses = await Activity.findAll({
      attributes: [[fn('DISTINCT', col('status')), 'status']],
      where: dateWhere
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalActivities,
          completedActivities,
          totalParticipants,
          averageRating
        },
        participationTrend,
        activityStatus: activityStatus.map(item => ({
          status: item.status,
          count: parseInt(item.dataValues.count)
        })),
        topActivities,
        ratingDistribution: ratingDist,
        statuses: statuses.map(s => s.dataValues.status).filter(Boolean)
      }
    });
  } catch (error) {
    console.error('Error fetching staff activity reports:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลรายงานกิจกรรมได้'
    });
  }
});

// Staff Routes - Activity Reports Excel Export
router.get('/staff/activities/export/excel', requireRole('STAFF'), async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    // Build where clause
    const dateWhere = getActivityDateRange(startDate, endDate);
    const where = { ...dateWhere };
    if (status) where.status = status;

    // Get activities with participants
    const activities = await Activity.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['name', 'email']
        }
      ],
      order: [['start_date', 'DESC']]
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงานกิจกรรม');

    // Add headers
    worksheet.columns = [
      { header: 'ชื่อกิจกรรม', key: 'title', width: 30 },
      { header: 'คำอธิบาย', key: 'description', width: 40 },
      { header: 'วันที่เริ่ม', key: 'start_date', width: 15 },
      { header: 'วันที่สิ้นสุด', key: 'end_date', width: 15 },
      { header: 'ชั่วโมงที่ได้รับ', key: 'hours_awarded', width: 15 },
      { header: 'สถานะ', key: 'status', width: 15 },
      { header: 'ผู้สร้าง', key: 'creator_name', width: 20 },
      { header: 'จำนวนผู้เข้าร่วม', key: 'participant_count', width: 15 }
    ];

    // Add data
    for (const activity of activities) {
      const participantCount = await activity.countCheckins();
      worksheet.addRow({
        title: activity.title,
        description: activity.description,
        start_date: activity.start_date ? new Date(activity.start_date).toLocaleDateString('th-TH') : '',
        end_date: activity.end_date ? new Date(activity.end_date).toLocaleDateString('th-TH') : '',
        hours_awarded: activity.hours_awarded || 0,
        status: activity.status,
        creator_name: activity.creator?.name || '',
        participant_count: participantCount
      });
    }

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="staff-activity-reports-${new Date().toISOString().split('T')[0]}.xlsx"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting staff activity reports to Excel:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถส่งออกไฟล์ Excel ได้'
    });
  }
});

// Staff Routes - Activity Reports PDF Export
router.get('/staff/activities/export/pdf', requireRole('STAFF'), async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    // Build where clause
    const dateWhere = getActivityDateRange(startDate, endDate);
    const where = { ...dateWhere };
    if (status) where.status = status;

    // Get activities
    const activities = await Activity.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['name', 'email']
        }
      ],
      order: [['start_date', 'DESC']]
    });

    // Create PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="staff-activity-reports-${new Date().toISOString().split('T')[0]}.pdf"`);
    
    doc.pipe(res);

    // Add title
    doc.fontSize(20).text('รายงานกิจกรรม', { align: 'center' });
    doc.moveDown();

    // Add filter info
    if (startDate || endDate || status) {
      doc.fontSize(12).text('ตัวกรอง:', { underline: true });
      if (startDate) doc.text(`วันที่เริ่มต้น: ${new Date(startDate).toLocaleDateString('th-TH')}`);
      if (endDate) doc.text(`วันที่สิ้นสุด: ${new Date(endDate).toLocaleDateString('th-TH')}`);
      if (status) doc.text(`สถานะ: ${status}`);
      doc.moveDown();
    }

    // Add activities
    for (const activity of activities) {
      const participantCount = await activity.countCheckins();
      
      doc.fontSize(14).text(activity.title, { underline: true });
      doc.fontSize(10).text(`คำอธิบาย: ${activity.description || '-'}`);
      doc.text(`วันที่: ${activity.start_date ? new Date(activity.start_date).toLocaleDateString('th-TH') : '-'}`);
      doc.text(`ชั่วโมง: ${activity.hours_awarded || 0}`);
      doc.text(`สถานะ: ${activity.status}`);
      doc.text(`ผู้สร้าง: ${activity.creator?.name || '-'}`);
      doc.text(`ผู้เข้าร่วม: ${participantCount} คน`);
      doc.moveDown();
    }

    doc.end();
  } catch (error) {
    console.error('Error exporting staff activity reports to PDF:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถส่งออกไฟล์ PDF ได้'
    });
  }
});

// Member Reports
router.get('/members', requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate, program, enrollmentYear } = req.query;
    
    // Build where conditions
    const userWhere = { role: 'STUDENT' };
    if (program) userWhere.program = program;
    if (enrollmentYear) userWhere.enrollment_year = enrollmentYear;
    
    const serialWhere = getDateRange(startDate, endDate);
    serialWhere.is_reviewed = true;

    // Get summary data
    const totalMembers = await User.count({ where: userWhere });
    
    const totalHoursResult = await SerialHistory.findOne({
      where: serialWhere,
      attributes: [
        [fn('SUM', col('hours_earned')), 'total']
      ],
      include: [{
        model: User,
        as: 'user',
        where: userWhere,
        attributes: []
      }]
    });
    
    const totalHours = totalHoursResult?.dataValues?.total || 0;
    const averageHours = totalMembers > 0 ? (totalHours / totalMembers).toFixed(1) : 0;

    // Get top students
    const topStudents = await SerialHistory.findAll({
      attributes: [
        'user_id',
        [fn('SUM', col('hours_earned')), 'total_hours'],
        [fn('COUNT', col('SerialHistory.id')), 'activity_count']
      ],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'student_code', 'program'],
        where: userWhere
      }],
      where: serialWhere,
      group: ['user_id', 'user.id', 'user.name', 'user.student_code', 'user.program'],
      order: [[literal('total_hours'), 'DESC']],
      limit: 10
    });

    const topStudentHours = topStudents[0]?.dataValues?.total_hours || 0;

    // Get hours distribution - แบบง่าย
    const hoursDistribution = await SerialHistory.findAll({
      attributes: [
        'user_id',
        [fn('SUM', col('hours_earned')), 'total_hours']
      ],
      include: [{
        model: User,
        as: 'user',
        where: userWhere,
        attributes: []
      }],
      where: serialWhere,
      group: ['user_id'],
      order: [[literal('total_hours'), 'DESC']]
    });

    // จัดกลุ่มข้อมูลใน JavaScript
    const distributionData = {
      '0-9': 0,
      '10-19': 0,
      '20-29': 0,
      '30-39': 0,
      '40+': 0
    };

    hoursDistribution.forEach(item => {
      const hours = parseInt(item.dataValues.total_hours) || 0;
      if (hours < 10) distributionData['0-9']++;
      else if (hours < 20) distributionData['10-19']++;
      else if (hours < 30) distributionData['20-29']++;
      else if (hours < 40) distributionData['30-39']++;
      else distributionData['40+']++;
    });

    // Get program distribution
    const programDistribution = await User.findAll({
      attributes: [
        'program',
        [fn('COUNT', col('id')), 'count']
      ],
      where: userWhere,
      group: ['program']
    });

    // Get monthly progress - แบบง่าย
    const monthlyProgress = await SerialHistory.findAll({
      attributes: [
        [fn('YEAR', col('redeemed_at')), 'year'],
        [fn('MONTH', col('redeemed_at')), 'month'],
        [fn('SUM', col('hours_earned')), 'totalHours']
      ],
      include: [{
        model: User,
        as: 'user',
        where: userWhere,
        attributes: []
      }],
      where: serialWhere,
      group: ['year', 'month'],
      order: [['year', 'ASC'], ['month', 'ASC']]
    });

    // Get unique programs and enrollment years for filters
    const programs = await User.findAll({
      attributes: ['program'],
      where: { role: 'STUDENT', program: { [Op.ne]: null } },
      group: ['program']
    });

    const enrollmentYears = await User.findAll({
      attributes: ['enrollment_year'],
      where: { role: 'STUDENT', enrollment_year: { [Op.ne]: null } },
      group: ['enrollment_year'],
      order: [['enrollment_year', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalMembers,
          totalHours,
          averageHours,
          topStudentHours
        },
        topStudents,
        hoursDistribution: Object.entries(distributionData).map(([range, count]) => ({ range, count })),
        programDistribution,
        monthlyProgress: monthlyProgress.map(item => ({
          month: `${item.dataValues.year}-${String(item.dataValues.month).padStart(2, '0')}`,
          totalHours: item.dataValues.totalHours
        })),
        programs: programs.map(p => p.program),
        enrollmentYears: enrollmentYears.map(y => y.enrollment_year)
      }
    });
  } catch (error) {
    console.error('Error fetching member reports:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch member reports',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Activity Reports
router.get('/activities', requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate, status, category } = req.query;
    
    // Build where conditions
    const activityWhere = getActivityDateRange(startDate, endDate);
    if (status) activityWhere.status = status;
    // Note: Activity model doesn't have category column

    // Get summary data
    const totalActivities = await Activity.count({ where: activityWhere });
    const completedActivities = await Activity.count({ 
      where: { ...activityWhere, status: 'CLOSED' } 
    });

    // Get total participants - ใช้ checkins table
    let totalWhereClause = 'WHERE 1=1';
    const totalParams = [];
    
    if (activityWhere.start_date && activityWhere.start_date[Op.between]) {
      totalWhereClause += ' AND a.start_date BETWEEN ? AND ?';
      totalParams.push(new Date(activityWhere.start_date[Op.between][0]).toISOString());
      totalParams.push(new Date(activityWhere.start_date[Op.between][1]).toISOString());
    }
    
    if (activityWhere.status) {
      totalWhereClause += ' AND a.status = ?';
      totalParams.push(activityWhere.status);
    }
    
    const totalParticipantsResult = await sequelize.query(`
      SELECT COUNT(c.id) as total
      FROM checkins c
      INNER JOIN activities a ON c.activity_id = a.id
      ${totalWhereClause}
    `, {
      type: QueryTypes.SELECT,
      replacements: totalParams
    });

    const totalParticipants = totalParticipantsResult[0]?.total || 0;

    // Get average rating
    const averageRatingResult = await ActivityReview.findOne({
      attributes: [
        [fn('AVG', col('overall_rating')), 'avg']
      ],
      include: [{
        model: Activity,
        as: 'activity',
        where: activityWhere,
        attributes: []
      }]
    });

    const averageRating = averageRatingResult?.dataValues?.avg || 0;

    // Get participation trend
    // Get participation trend - ใช้ checkins table
    let trendWhereClause = 'WHERE 1=1';
    const trendParams = [];
    
    if (activityWhere.start_date && activityWhere.start_date[Op.between]) {
      trendWhereClause += ' AND a.start_date BETWEEN ? AND ?';
      trendParams.push(new Date(activityWhere.start_date[Op.between][0]).toISOString());
      trendParams.push(new Date(activityWhere.start_date[Op.between][1]).toISOString());
    }
    
    if (activityWhere.status) {
      trendWhereClause += ' AND a.status = ?';
      trendParams.push(activityWhere.status);
    }
    
    const participationTrend = await sequelize.query(`
      SELECT 
        DATE_FORMAT(c.created_at, '%Y-%m') as month,
        COUNT(c.id) as participants
      FROM checkins c
      INNER JOIN activities a ON c.activity_id = a.id
      ${trendWhereClause}
      GROUP BY DATE_FORMAT(c.created_at, '%Y-%m')
      ORDER BY month ASC
    `, {
      type: QueryTypes.SELECT,
      replacements: trendParams
    });

    // Get activity status distribution
    const activityStatus = await Activity.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      where: activityWhere,
      group: ['status']
    });

    // Get top activities by participation - ใช้ raw query
    let activityWhereClause = 'WHERE 1=1';
    const activityParams = [];
    
    if (activityWhere.start_date && activityWhere.start_date[Op.between]) {
      activityWhereClause += ' AND a.start_date BETWEEN ? AND ?';
      activityParams.push(new Date(activityWhere.start_date[Op.between][0]).toISOString());
      activityParams.push(new Date(activityWhere.start_date[Op.between][1]).toISOString());
    }
    
    if (activityWhere.status) {
      activityWhereClause += ' AND a.status = ?';
      activityParams.push(activityWhere.status);
    }
    
    const topActivities = await sequelize.query(`
      SELECT 
        a.id,
        a.title,
        a.start_date,
        a.status,
        COUNT(c.id) as participantCount,
        AVG(ar.overall_rating) as averageRating
      FROM activities a
      LEFT JOIN checkins c ON a.id = c.activity_id
      LEFT JOIN activity_reviews ar ON a.id = ar.activity_id
      ${activityWhereClause}
      GROUP BY a.id, a.title, a.start_date, a.status
      ORDER BY participantCount DESC
      LIMIT 10
    `, {
      type: QueryTypes.SELECT,
      replacements: activityParams
    });

    // Get rating distribution
    // Get rating distribution - ใช้ raw query
    let ratingWhereClause = 'WHERE 1=1';
    const ratingParams = [];
    
    if (activityWhere.start_date && activityWhere.start_date[Op.between]) {
      ratingWhereClause += ' AND a.start_date BETWEEN ? AND ?';
      ratingParams.push(new Date(activityWhere.start_date[Op.between][0]).toISOString());
      ratingParams.push(new Date(activityWhere.start_date[Op.between][1]).toISOString());
    }
    
    if (activityWhere.status) {
      ratingWhereClause += ' AND a.status = ?';
      ratingParams.push(activityWhere.status);
    }
    
    const ratingDistribution = await sequelize.query(`
      SELECT 
        ar.overall_rating,
        COUNT(ar.id) as count
      FROM activity_reviews ar
      INNER JOIN activities a ON ar.activity_id = a.id
      ${ratingWhereClause}
      GROUP BY ar.overall_rating
      ORDER BY ar.overall_rating ASC
    `, {
      type: QueryTypes.SELECT,
      replacements: ratingParams
    });

    // Get unique statuses for filters (Activity doesn't have category)
    const statuses = await Activity.findAll({
      attributes: ['status'],
      where: { status: { [Op.ne]: null } },
      group: ['status']
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalActivities,
          completedActivities,
          totalParticipants,
          averageRating: parseFloat(averageRating) || 0
        },
        participationTrend: participationTrend.map(trend => ({
          month: trend.month,
          participants: parseInt(trend.participants) || 0
        })),
        activityStatus,
        topActivities: topActivities.map(activity => ({
          id: activity.id,
          title: activity.title,
          start_date: activity.start_date,
          status: activity.status,
          participantCount: parseInt(activity.participantCount) || 0,
          averageRating: parseFloat(activity.averageRating) || 0
        })),
        ratingDistribution: [1,2,3,4,5].map(rating => {
          const found = ratingDistribution.find(r => r.overall_rating === rating);
          return found ? parseInt(found.count) : 0;
        }),
        statuses: statuses.map(s => s.status)
      }
    });
  } catch (error) {
    console.error('Error fetching activity reports:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity reports',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Evaluation Reports
router.get('/evaluations', requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate, activityId, ratingRange } = req.query;
    
    // Build where conditions for ActivityReview (uses created_at)
    const reviewWhere = {};
    if (startDate && endDate) {
      reviewWhere.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      reviewWhere.created_at = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      reviewWhere.created_at = {
        [Op.lte]: new Date(endDate)
      };
    }
    if (activityId) reviewWhere.activity_id = activityId;
    
    if (ratingRange) {
      if (ratingRange === '1-2') {
        reviewWhere.overall_rating = { [Op.between]: [1, 2] };
      } else if (ratingRange === '3') {
        reviewWhere.overall_rating = 3;
      } else if (ratingRange === '4-5') {
        reviewWhere.overall_rating = { [Op.between]: [4, 5] };
      }
    }

    // Get summary data
    const totalEvaluations = await ActivityReview.count({ where: reviewWhere });
    
    const averageRatings = await ActivityReview.findOne({
      where: reviewWhere,
      attributes: [
        [fn('AVG', col('overall_rating')), 'overall'],
        [fn('AVG', col('fun_rating')), 'fun'],
        [fn('AVG', col('learning_rating')), 'learning']
      ]
    });

    // Get rating trend
    const ratingTrend = await ActivityReview.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'month'],
        [fn('AVG', col('overall_rating')), 'overallRating'],
        [fn('AVG', col('fun_rating')), 'funRating'],
        [fn('AVG', col('learning_rating')), 'learningRating']
      ],
      where: reviewWhere,
      group: ['month'],
      order: [['month', 'ASC']]
    });

    // Get rating distribution
    const ratingDistribution = await ActivityReview.findAll({
      attributes: [
        'overall_rating',
        [fn('COUNT', col('id')), 'count']
      ],
      where: reviewWhere,
      group: ['overall_rating'],
      order: [['overall_rating', 'ASC']]
    });

    // Get top rated activities - ใช้ raw query แทน
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (reviewWhere.created_at && reviewWhere.created_at[Op.between]) {
      whereClause += ' AND ar.created_at BETWEEN ? AND ?';
      params.push(new Date(reviewWhere.created_at[Op.between][0]).toISOString());
      params.push(new Date(reviewWhere.created_at[Op.between][1]).toISOString());
    }
    
    if (reviewWhere.activity_id) {
      whereClause += ' AND ar.activity_id = ?';
      params.push(reviewWhere.activity_id);
    }
    
    if (reviewWhere.overall_rating && reviewWhere.overall_rating[Op.gte]) {
      whereClause += ' AND ar.overall_rating >= ?';
      params.push(reviewWhere.overall_rating[Op.gte]);
    }
    
    const topRatedActivities = await sequelize.query(`
      SELECT 
        a.id,
        a.title,
        a.start_date,
        AVG(ar.overall_rating) as overallRating,
        AVG(ar.fun_rating) as funRating,
        AVG(ar.learning_rating) as learningRating,
        AVG(ar.organization_rating) as organizationRating,
        AVG(ar.venue_rating) as venueRating,
        COUNT(ar.id) as reviewCount
      FROM activities a
      INNER JOIN activity_reviews ar ON a.id = ar.activity_id
      ${whereClause}
      GROUP BY a.id, a.title, a.start_date
      ORDER BY overallRating DESC
      LIMIT 10
    `, {
      type: QueryTypes.SELECT,
      replacements: params
    });

    // Get recent reviews
    const recentReviews = await ActivityReview.findAll({
      include: [
        {
          model: Activity,
          as: 'activity',
          attributes: ['title']
        },
        {
          model: User,
          as: 'user',
          attributes: ['name']
        }
      ],
      where: reviewWhere,
      order: [['created_at', 'DESC']],
      limit: 20
    });

    // Get unique activities for filters
    const activities = await Activity.findAll({
      attributes: ['id', 'title'],
      order: [['title', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalEvaluations,
          averageOverallRating: parseFloat(averageRatings?.dataValues?.overall) || 0,
          averageFunRating: parseFloat(averageRatings?.dataValues?.fun) || 0,
          averageLearningRating: parseFloat(averageRatings?.dataValues?.learning) || 0
        },
        ratingTrend,
        ratingDistribution: [1,2,3,4,5].map(rating => {
          const found = ratingDistribution.find(r => r.overall_rating === rating);
          return found ? parseInt(found.count) : 0;
        }),
        topRatedActivities: topRatedActivities.map(activity => ({
          id: activity.id,
          title: activity.title,
          start_date: activity.start_date,
          overallRating: parseFloat(activity.overallRating) || 0,
          funRating: parseFloat(activity.funRating) || 0,
          learningRating: parseFloat(activity.learningRating) || 0,
          organizationRating: parseFloat(activity.organizationRating) || 0,
          venueRating: parseFloat(activity.venueRating) || 0,
          reviewCount: parseInt(activity.reviewCount) || 0
        })),
        recentReviews: recentReviews.map(review => ({
          id: review.id,
          activity: review.activity,
          user: review.user,
          overall_rating: review.overall_rating,
          fun_rating: review.fun_rating,
          learning_rating: review.learning_rating,
          organization_rating: review.organization_rating,
          venue_rating: review.venue_rating,
          comment: review.comment,
          created_at: review.created_at
        })),
        activities: activities.map(activity => ({
          id: activity.id,
          title: activity.title
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching evaluation reports:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluation reports',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Export functions
router.get('/members/export/excel', requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate, program, enrollmentYear } = req.query;
    
    // Get data (reuse the same logic as the main endpoint)
    const userWhere = { role: 'STUDENT' };
    if (program) userWhere.program = program;
    if (enrollmentYear) userWhere.enrollment_year = enrollmentYear;
    
    const serialWhere = getDateRange(startDate, endDate);
    serialWhere.is_reviewed = true;

    const topStudents = await SerialHistory.findAll({
      attributes: [
        'user_id',
        [fn('SUM', col('hours_earned')), 'total_hours'],
        [fn('COUNT', col('SerialHistory.id')), 'activity_count']
      ],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'student_code', 'program', 'enrollment_year'],
        where: userWhere
      }],
      where: serialWhere,
      group: ['user_id', 'user.id', 'user.name', 'user.student_code', 'user.program', 'user.enrollment_year'],
      order: [[literal('total_hours'), 'DESC']]
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงานสมาชิก');

    // Add headers
    worksheet.columns = [
      { header: 'อันดับ', key: 'rank', width: 10 },
      { header: 'ชื่อ-นามสกุล', key: 'name', width: 30 },
      { header: 'รหัสนักเรียน', key: 'student_code', width: 15 },
      { header: 'สาขาวิชา', key: 'program', width: 25 },
      { header: 'ปีที่เข้าเรียน', key: 'enrollment_year', width: 15 },
      { header: 'ชั่วโมงสะสม', key: 'total_hours', width: 15 },
      { header: 'จำนวนกิจกรรม', key: 'activity_count', width: 15 }
    ];

    // Add data
    topStudents.forEach((student, index) => {
      worksheet.addRow({
        rank: index + 1,
        name: student.user?.name,
        student_code: student.user?.student_code,
        program: student.user?.program,
        enrollment_year: student.user?.enrollment_year,
        total_hours: student.dataValues.total_hours,
        activity_count: student.dataValues.activity_count
      });
    });

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="member-report-${new Date().toISOString().split('T')[0]}.xlsx"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(500).json({ message: 'Failed to export Excel' });
  }
});

router.get('/activities/export/excel', requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate, status, category } = req.query;
    
    const activityWhere = getActivityDateRange(startDate, endDate);
    if (status) activityWhere.status = status;
    if (category) activityWhere.category = category;

    // ใช้ raw query สำหรับ Excel export
    let exportWhereClause = 'WHERE 1=1';
    const exportParams = [];
    
    if (activityWhere.start_date && activityWhere.start_date[Op.between]) {
      exportWhereClause += ' AND a.start_date BETWEEN ? AND ?';
      exportParams.push(new Date(activityWhere.start_date[Op.between][0]).toISOString());
      exportParams.push(new Date(activityWhere.start_date[Op.between][1]).toISOString());
    }
    
    if (activityWhere.status) {
      exportWhereClause += ' AND a.status = ?';
      exportParams.push(activityWhere.status);
    }
    
    const topActivities = await sequelize.query(`
      SELECT 
        a.id,
        a.title,
        a.start_date,
        a.status,
        COUNT(c.id) as participantCount,
        AVG(ar.overall_rating) as averageRating
      FROM activities a
      LEFT JOIN checkins c ON a.id = c.activity_id
      LEFT JOIN activity_reviews ar ON a.id = ar.activity_id
      ${exportWhereClause}
      GROUP BY a.id, a.title, a.start_date, a.status
      ORDER BY participantCount DESC
    `, {
      type: QueryTypes.SELECT,
      replacements: exportParams
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงานกิจกรรม');

    // Add headers
    worksheet.columns = [
      { header: 'อันดับ', key: 'rank', width: 10 },
      { header: 'ชื่อกิจกรรม', key: 'title', width: 40 },
      { header: 'วันที่จัด', key: 'start_date', width: 15 },
      { header: 'ประเภท', key: 'category', width: 20 },
      { header: 'สถานะ', key: 'status', width: 15 },
      { header: 'จำนวนผู้เข้าร่วม', key: 'participantCount', width: 20 },
      { header: 'คะแนนเฉลี่ย', key: 'averageRating', width: 15 }
    ];

    // Add data
    topActivities.forEach((activity, index) => {
      worksheet.addRow({
        rank: index + 1,
        title: activity.title,
        start_date: new Date(activity.start_date).toLocaleDateString('th-TH'),
        category: 'N/A', // Activity model doesn't have category
        status: activity.status === 'CLOSED' ? 'เสร็จสิ้น' :
                activity.status === 'OPEN' ? 'กำลังดำเนินการ' :
                activity.status === 'DRAFT' ? 'ร่าง' : 'ไม่ระบุ',
        participantCount: parseInt(activity.participantCount) || 0,
        averageRating: parseFloat(activity.averageRating) || 0
      });
    });

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="activity-report-${new Date().toISOString().split('T')[0]}.xlsx"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(500).json({ message: 'Failed to export Excel' });
  }
});

router.get('/evaluations/export/excel', requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate, activityId, ratingRange } = req.query;
    
    const reviewWhere = getDateRange(startDate, endDate);
    if (activityId) reviewWhere.activity_id = activityId;
    
    if (ratingRange) {
      if (ratingRange === '1-2') {
        reviewWhere.overall_rating = { [Op.between]: [1, 2] };
      } else if (ratingRange === '3') {
        reviewWhere.overall_rating = 3;
      } else if (ratingRange === '4-5') {
        reviewWhere.overall_rating = { [Op.between]: [4, 5] };
      }
    }

    const topRatedActivities = await ActivityReview.findAll({
      attributes: [
        'activity_id',
        [fn('AVG', col('overall_rating')), 'overallRating'],
        [fn('AVG', col('fun_rating')), 'funRating'],
        [fn('AVG', col('learning_rating')), 'learningRating'],
        [fn('AVG', col('organization_rating')), 'organizationRating'],
        [fn('AVG', col('venue_rating')), 'venueRating'],
        [fn('COUNT', col('ActivityReview.id')), 'reviewCount']
      ],
      include: [{
        model: Activity,
        as: 'activity',
        attributes: ['id', 'title', 'start_date']
      }],
      where: reviewWhere,
      group: ['activity_id', 'activity.id', 'activity.title', 'activity.start_date'],
      order: [[literal('overallRating'), 'DESC']]
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงานประเมิน');

    // Add headers
    worksheet.columns = [
      { header: 'อันดับ', key: 'rank', width: 10 },
      { header: 'ชื่อกิจกรรม', key: 'title', width: 40 },
      { header: 'วันที่จัด', key: 'start_date', width: 15 },
      { header: 'คะแนนรวม', key: 'overallRating', width: 15 },
      { header: 'ความสนุก', key: 'funRating', width: 15 },
      { header: 'การเรียนรู้', key: 'learningRating', width: 15 },
      { header: 'การจัดระเบียบ', key: 'organizationRating', width: 15 },
      { header: 'สถานที่', key: 'venueRating', width: 15 },
      { header: 'จำนวนการประเมิน', key: 'reviewCount', width: 20 }
    ];

    // Add data
    topRatedActivities.forEach((activity, index) => {
      worksheet.addRow({
        rank: index + 1,
        title: activity.activity?.title,
        start_date: new Date(activity.activity?.start_date).toLocaleDateString('th-TH'),
        overallRating: activity.dataValues.overallRating?.toFixed(1) || 'N/A',
        funRating: activity.dataValues.funRating?.toFixed(1) || 'N/A',
        learningRating: activity.dataValues.learningRating?.toFixed(1) || 'N/A',
        organizationRating: activity.dataValues.organizationRating?.toFixed(1) || 'N/A',
        venueRating: activity.dataValues.venueRating?.toFixed(1) || 'N/A',
        reviewCount: activity.dataValues.reviewCount
      });
    });

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="evaluation-report-${new Date().toISOString().split('T')[0]}.xlsx"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(500).json({ message: 'Failed to export Excel' });
  }
});

// PDF export functions (simplified version)
router.get('/members/export/pdf', requireRole('ADMIN'), async (req, res) => {
  try {
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="member-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    
    doc.pipe(res);
    doc.fontSize(20).text('รายงานสมาชิกและการสะสมเวลา', 100, 100);
    doc.fontSize(12).text(`วันที่สร้างรายงาน: ${new Date().toLocaleDateString('th-TH')}`, 100, 150);
    doc.text('รายงานนี้แสดงข้อมูลการสะสมชั่วโมงของสมาชิกในระบบ', 100, 200);
    doc.end();
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({ message: 'Failed to export PDF' });
  }
});

router.get('/activities/export/pdf', requireRole('ADMIN'), async (req, res) => {
  try {
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="activity-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    
    doc.pipe(res);
    doc.fontSize(20).text('รายงานกิจกรรม', 100, 100);
    doc.fontSize(12).text(`วันที่สร้างรายงาน: ${new Date().toLocaleDateString('th-TH')}`, 100, 150);
    doc.text('รายงานนี้แสดงข้อมูลกิจกรรมและการเข้าร่วม', 100, 200);
    doc.end();
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({ message: 'Failed to export PDF' });
  }
});

router.get('/evaluations/export/pdf', requireRole('ADMIN'), async (req, res) => {
  try {
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="evaluation-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    
    doc.pipe(res);
    doc.fontSize(20).text('รายงานผลประเมินกิจกรรม', 100, 100);
    doc.fontSize(12).text(`วันที่สร้างรายงาน: ${new Date().toLocaleDateString('th-TH')}`, 100, 150);
    doc.text('รายงานนี้แสดงข้อมูลการประเมินกิจกรรม', 100, 200);
    doc.end();
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({ message: 'Failed to export PDF' });
  }
});

module.exports = router;
