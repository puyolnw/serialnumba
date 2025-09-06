import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const StaffDashboard = () => {
  const [stats, setStats] = useState({
    totalActivities: 0,
    publishedActivities: 0,
    recentActivities: []
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
      
      setStats({
        totalActivities: activities.length,
        publishedActivities: activities.filter(a => a.status === 'OPEN').length,
        recentActivities: activities.slice(0, 5)
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
    <div className="staff-dashboard">
      <div className="container">
        <div className="staff-header">
          <h1>แดชบอร์ดเจ้าหน้าที่</h1>
          <p>ยินดีต้อนรับสู่ระบบจัดการกิจกรรม</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
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
          
          <div className="stat-card">
            <span className="stat-icon">🎯</span>
            <div className="stat-number">{stats.recentActivities.length}</div>
            <div className="stat-label">กิจกรรมล่าสุด</div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="content-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>กิจกรรมล่าสุด</h3>
            <Link to="/staff/activities" className="btn btn-outline-primary">
              ดูทั้งหมด
            </Link>
          </div>
        
          {stats.recentActivities.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-times"></i>
              <h5>ไม่พบกิจกรรม</h5>
              <p>คุณยังไม่ได้สร้างกิจกรรมใดๆ</p>
              <Link to="/staff/activities/create" className="btn btn-primary">
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
                          to="/staff/activities"
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

        {/* Quick Actions */}
        <div className="content-card">
          <h3>การดำเนินการด่วน</h3>
          <div className="quick-actions">
            <Link to="/staff/activities/create" className="quick-action-card">
              <span className="quick-action-icon">➕</span>
              <h6 className="quick-action-title">สร้างกิจกรรมใหม่</h6>
            </Link>
            <Link to="/staff/activities" className="quick-action-card">
              <span className="quick-action-icon">📅</span>
              <h6 className="quick-action-title">จัดการกิจกรรม</h6>
            </Link>
            <Link to="/staff/serials/send" className="quick-action-card">
              <span className="quick-action-icon">📤</span>
              <h6 className="quick-action-title">ส่งซีเรียล</h6>
            </Link>
            <Link to="/staff/reports/activities" className="quick-action-card">
              <span className="quick-action-icon">📊</span>
              <h6 className="quick-action-title">รายงานกิจกรรม</h6>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard
