import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const AdminHome = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalActivities: 0,
    publishedActivities: 0,
    recentActivities: []
  })
  const [dashboardStats, setDashboardStats] = useState({
    topRatedActivities: [],
    topStudents: [],
    recentReviews: [],
    reviewStats: {}
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all activities
      const activitiesResponse = await api.get('/activities')
      const activities = activitiesResponse.data.data.activities || []
      
      // Fetch all users
      const usersResponse = await api.get('/admin/users')
      const users = usersResponse.data.data.users || []
      
      // Fetch dashboard statistics
      const dashboardResponse = await api.get('/admin/dashboard-stats')
      const dashboardData = dashboardResponse.data.data || {}
      
      setStats({
        totalUsers: users.length,
        totalActivities: activities.length,
        publishedActivities: activities.filter(a => a.status === 'OPEN').length,
        recentActivities: activities.slice(0, 5)
      })
      
      setDashboardStats({
        topRatedActivities: dashboardData.topRatedActivities || [],
        topStudents: dashboardData.topStudents || [],
        recentReviews: dashboardData.recentReviews || [],
        reviewStats: dashboardData.reviewStats || {}
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="text-center">
          <div>Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>แดชบอร์ดผู้ดูแลระบบ</h1>
          <p>ยินดีต้อนรับสู่ระบบจัดการกิจกรรม</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">👥</span>
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-label">ผู้ใช้ทั้งหมด</div>
          </div>
          
          <div className="stat-card">
            <span className="stat-icon">📅</span>
            <div className="stat-number">{stats.totalActivities}</div>
            <div className="stat-label">กิจกรรมทั้งหมด</div>
          </div>
          
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div className="stat-number">{stats.publishedActivities}</div>
            <div className="stat-label">กิจกรรมที่เปิด</div>
          </div>
          
          <div className="stat-card">
            <span className="stat-icon">📊</span>
            <div className="stat-number">
              {stats.totalActivities > 0 ? Math.round((stats.publishedActivities / stats.totalActivities) * 100) : 0}%
            </div>
            <div className="stat-label">อัตราการเปิด</div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="content-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>กิจกรรมล่าสุด</h3>
            <Link to="/admin/activities" className="btn btn-outline-primary">
              ดูทั้งหมด
            </Link>
          </div>
        
          {stats.recentActivities.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-times"></i>
              <h5>ไม่พบกิจกรรม</h5>
              <p>คุณยังไม่ได้สร้างกิจกรรมใดๆ</p>
              <Link to="/activities/create" className="btn btn-primary">
                สร้างกิจกรรมแรก
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ชื่อกิจกรรม</th>
                    <th>ผู้สร้าง</th>
                    <th>สถานะ</th>
                    <th>วันที่สร้าง</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td>
                        <strong>{activity.title}</strong>
                        {activity.description && (
                          <div className="text-muted small">
                            {activity.description.length > 50 
                              ? `${activity.description.substring(0, 50)}...` 
                              : activity.description
                            }
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar-sm bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-2">
                            {activity.creator?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div>{activity.creator?.name || 'ไม่ทราบ'}</div>
                            <small className="text-muted">{activity.creator?.role}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-${activity.status === 'OPEN' ? 'success' : 'secondary'}`}>
                          {activity.status}
                        </span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {formatDate(activity.id)}
                        </small>
                      </td>
                      <td>
                        <Link 
                          to="/admin/activities"
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="fas fa-eye"></i>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Review Statistics */}
        <div className="row">
          <div className="col-md-6">
            <div className="content-card">
              <h3>⭐ กิจกรรมที่รีวิวดีที่สุด</h3>
              {dashboardStats.topRatedActivities.length === 0 ? (
                <div className="empty-state">
                  <p>ยังไม่มีรีวิวกิจกรรม</p>
                </div>
              ) : (
                <div className="list-group">
                  {dashboardStats.topRatedActivities.map((item, index) => (
                    <div key={item.activity_id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">#{index + 1} {item.activity?.title}</h6>
                          <p className="mb-1 text-muted small">
                            {item.activity?.description?.substring(0, 60)}...
                          </p>
                          <small className="text-muted">
                            {item.review_count} รีวิว
                          </small>
                        </div>
                        <div className="text-end">
                          <div className="h5 mb-0 text-warning">
                            {parseFloat(item.avg_rating).toFixed(1)} ⭐
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="content-card">
              <h3>🏆 นักเรียนที่ได้ชั่วโมงเยอะที่สุด</h3>
              {dashboardStats.topStudents.length === 0 ? (
                <div className="empty-state">
                  <p>ยังไม่มีข้อมูลชั่วโมงกิจกรรม</p>
                </div>
              ) : (
                <div className="list-group">
                  {dashboardStats.topStudents.map((item, index) => (
                    <div key={item.user_id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">#{index + 1} {item.user?.name}</h6>
                          <p className="mb-1 text-muted small">
                            รหัสนักศึกษา: {item.user?.student_code}
                          </p>
                          <small className="text-muted">
                            {item.activity_count} กิจกรรม
                          </small>
                        </div>
                        <div className="text-end">
                          <div className="h5 mb-0 text-success">
                            {item.total_hours} ชม.
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Review Statistics Summary */}
        {dashboardStats.reviewStats.total_reviews > 0 && (
          <div className="content-card">
            <h3>📊 สถิติการรีวิวโดยรวม</h3>
            <div className="row">
              <div className="col-md-2">
                <div className="text-center">
                  <div className="h4 text-primary">{dashboardStats.reviewStats.total_reviews}</div>
                  <small className="text-muted">รีวิวทั้งหมด</small>
                </div>
              </div>
              <div className="col-md-2">
                <div className="text-center">
                  <div className="h4 text-warning">
                    {parseFloat(dashboardStats.reviewStats.avg_overall || 0).toFixed(1)} ⭐
                  </div>
                  <small className="text-muted">คะแนนรวม</small>
                </div>
              </div>
              <div className="col-md-2">
                <div className="text-center">
                  <div className="h4 text-info">
                    {parseFloat(dashboardStats.reviewStats.avg_fun || 0).toFixed(1)} ⭐
                  </div>
                  <small className="text-muted">ความสนุก</small>
                </div>
              </div>
              <div className="col-md-2">
                <div className="text-center">
                  <div className="h4 text-success">
                    {parseFloat(dashboardStats.reviewStats.avg_learning || 0).toFixed(1)} ⭐
                  </div>
                  <small className="text-muted">การเรียนรู้</small>
                </div>
              </div>
              <div className="col-md-2">
                <div className="text-center">
                  <div className="h4 text-warning">
                    {parseFloat(dashboardStats.reviewStats.avg_organization || 0).toFixed(1)} ⭐
                  </div>
                  <small className="text-muted">การจัดงาน</small>
                </div>
              </div>
              <div className="col-md-2">
                <div className="text-center">
                  <div className="h4 text-secondary">
                    {parseFloat(dashboardStats.reviewStats.avg_venue || 0).toFixed(1)} ⭐
                  </div>
                  <small className="text-muted">สถานที่</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Reviews */}
        {dashboardStats.recentReviews.length > 0 && (
          <div className="content-card">
            <h3>💬 รีวิวล่าสุด</h3>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>นักเรียน</th>
                    <th>กิจกรรม</th>
                    <th>คะแนนรวม</th>
                    <th>วันที่รีวิว</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardStats.recentReviews.map((review) => (
                    <tr key={review.id}>
                      <td>
                        <div>
                          <strong>{review.user?.name}</strong>
                          <br />
                          <small className="text-muted">{review.user?.student_code}</small>
                        </div>
                      </td>
                      <td>{review.activity?.title}</td>
                      <td>
                        <span className="badge bg-warning">
                          {review.overall_rating} ⭐
                        </span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {formatDate(review.created_at)}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="content-card">
          <h3>การดำเนินการด่วน</h3>
          <div className="quick-actions">
            <Link to="/admin/activities/create" className="quick-action-card">
              <span className="quick-action-icon">➕</span>
              <h6 className="quick-action-title">สร้างกิจกรรมใหม่</h6>
            </Link>
            <Link to="/admin/activities" className="quick-action-card">
              <span className="quick-action-icon">📅</span>
              <h6 className="quick-action-title">จัดการกิจกรรม</h6>
            </Link>
            <Link to="/admin/serials/send" className="quick-action-card">
              <span className="quick-action-icon">📤</span>
              <h6 className="quick-action-title">ส่งซีเรียล</h6>
            </Link>
            <Link to="/admin/users/students" className="quick-action-card">
              <span className="quick-action-icon">👥</span>
              <h6 className="quick-action-title">จัดการผู้ใช้</h6>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminHome
