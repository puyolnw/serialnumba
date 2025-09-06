import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const StudentHome = () => {
  const [stats, setStats] = useState({
    totalActivities: 0,
    upcomingActivities: 0,
    completedActivities: 0,
    totalHours: 0,
    recentActivities: []
  })
  const [requiredHours, setRequiredHours] = useState(50)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch activities and required hours in parallel
      const [activitiesResponse, requiredHoursResponse] = await Promise.all([
        api.get('/activities'),
        api.get('/admin/required-hours')
      ])
      
      const activities = activitiesResponse.data.data?.activities || []
      const requiredHoursData = requiredHoursResponse.data.success ? 
        requiredHoursResponse.data.data.required_hours : 50
      
      setRequiredHours(requiredHoursData)
      
      // Filter upcoming activities (start date in the future)
      const now = new Date()
      const upcomingActivities = activities.filter(a => new Date(a.start_date) > now)
      
      // Fetch user's serial history for real data
      let completedActivities = 0
      let totalHours = 0
      
      try {
        const historyResponse = await api.get('/student/serial-history')
        if (historyResponse.data.success) {
          const history = historyResponse.data.data.history || []
          completedActivities = history.length
          totalHours = history.reduce((sum, item) => sum + (item.hours_earned || 0), 0)
        }
      } catch (historyError) {
        console.log('No serial history found, using default values')
      }
      
      setStats({
        totalActivities: activities.length,
        upcomingActivities: upcomingActivities.length,
        completedActivities,
        totalHours,
        recentActivities: activities.slice(0, 5)
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date()
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <p className="mt-3">กำลังโหลดแดชบอร์ด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      {/* Welcome Section */}
      <div style={{
        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(0,123,255,0.3)'
      }}>
        <div className="row align-items-center">
          <div className="col-md-6">
            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', fontWeight: 'bold' }}>
              สวัสดี, {user?.name}! 👋
            </h1>
            <p style={{ fontSize: '1.2rem', margin: 0, opacity: 0.9 }}>
              ยินดีต้อนรับสู่ระบบจัดการกิจกรรม มาดูกิจกรรมที่น่าสนใจกันเถอะ!
            </p>
          </div>
          <div className="col-md-3 text-center">
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '20px',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⏱️</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '5px' }}>
                {stats.totalHours}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>
                ชั่วโมงที่เก็บได้
              </div>
            </div>
          </div>
          <div className="col-md-3 text-end">
            <div style={{ fontSize: '4rem', opacity: 0.8 }}>🎓</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="card text-center" style={{ 
          border: 'none', 
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ fontSize: '3rem', marginBottom: '15px', color: '#007bff' }}>📅</div>
          <h2 style={{ marginBottom: '10px', color: '#333', fontWeight: 'bold' }}>{stats.totalActivities}</h2>
          <p style={{ color: '#666', margin: 0, fontSize: '1.1rem' }}>กิจกรรมทั้งหมด</p>
        </div>
        
        <div className="card text-center" style={{ 
          border: 'none', 
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ fontSize: '3rem', marginBottom: '15px', color: '#28a745' }}>⏰</div>
          <h2 style={{ marginBottom: '10px', color: '#333', fontWeight: 'bold' }}>{stats.upcomingActivities}</h2>
          <p style={{ color: '#666', margin: 0, fontSize: '1.1rem' }}>กิจกรรมที่กำลังจะมาถึง</p>
        </div>
        
        <div className="card text-center" style={{ 
          border: 'none', 
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ fontSize: '3rem', marginBottom: '15px', color: '#ffc107' }}>✅</div>
          <h2 style={{ marginBottom: '10px', color: '#333', fontWeight: 'bold' }}>{stats.completedActivities}</h2>
          <p style={{ color: '#666', margin: 0, fontSize: '1.1rem' }}>กิจกรรมที่เสร็จสิ้น</p>
        </div>
        
        <div className="card text-center" style={{ 
          border: '3px solid #ffc107',
          boxShadow: '0 5px 15px rgba(255,193,7,0.3)',
          transition: 'transform 0.3s ease',
          background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ fontSize: '3rem', marginBottom: '15px', color: '#856404' }}>🏆</div>
          <h2 style={{ marginBottom: '10px', color: '#856404', fontWeight: 'bold', fontSize: '2.5rem' }}>{stats.totalHours}</h2>
          <p style={{ color: '#856404', margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>ชั่วโมงที่เก็บได้</p>
          <div style={{ 
            marginTop: '10px', 
            padding: '5px 10px', 
            backgroundColor: '#856404', 
            color: 'white', 
            borderRadius: '15px',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}>
            🎯 เป้าหมาย: เก็บให้ได้มากที่สุด!
          </div>
        </div>
      </div>

      {/* Hours Progress Section */}
      <div className="card mb-4" style={{ 
        border: 'none', 
        boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h3 className="mb-2" style={{ fontWeight: 'bold' }}>
                🏆 ความคืบหน้าการเก็บชั่วโมง
              </h3>
              <p className="mb-3" style={{ opacity: 0.9 }}>
                คุณได้เข้าร่วมกิจกรรมและเก็บชั่วโมงไปแล้ว <strong>{stats.totalHours} ชั่วโมง</strong> จากกิจกรรมทั้งหมด <strong>{stats.completedActivities} กิจกรรม</strong>
              </p>
              <div className="progress" style={{ height: '20px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <div 
                  className="progress-bar bg-warning" 
                  style={{ 
                    width: `${Math.min((stats.totalHours / requiredHours) * 100, 100)}%`,
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    lineHeight: '20px'
                  }}
                >
                  {stats.totalHours >= requiredHours ? '🎉 เป้าหมายสำเร็จ!' : `${stats.totalHours}/${requiredHours} ชั่วโมง`}
                </div>
              </div>
            </div>
            <div className="col-md-4 text-center">
              <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🎯</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {stats.totalHours >= requiredHours ? '100%' : `${Math.round((stats.totalHours / requiredHours) * 100)}%`}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>
                ของเป้าหมาย {requiredHours} ชั่วโมง
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mb-4" style={{ border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
        <div className="card-header" style={{ backgroundColor: '#f8f9fa', border: 'none' }}>
          <h4 style={{ margin: 0, color: '#333' }}>🚀 การดำเนินการด่วน</h4>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <Link to="/activities" className="btn btn-primary" style={{ padding: '15px', fontSize: '1.1rem' }}>
              📅 ดูปฏิทินกิจกรรม
            </Link>
            <Link to="/student/progress" className="btn btn-success" style={{ padding: '15px', fontSize: '1.1rem' }}>
              📊 ความก้าวหน้าของฉัน
            </Link>
            <Link to="/student/serials" className="btn btn-warning" style={{ padding: '15px', fontSize: '1.1rem' }}>
              🎫 แลก Serial
            </Link>
            <Link to="/student/profile" className="btn btn-info" style={{ padding: '15px', fontSize: '1.1rem' }}>
              👤 โปรไฟล์ของฉัน
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Activities */}
      <div className="card" style={{ border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
        <div className="card-header" style={{ backgroundColor: '#f8f9fa', border: 'none' }}>
          <div className="d-flex justify-content-between align-items-center">
            <h4 style={{ margin: 0, color: '#333' }}>⭐ กิจกรรมแนะนำ</h4>
            <Link to="/activities" className="btn btn-outline-primary">
              ดูทั้งหมด
            </Link>
          </div>
        </div>
        
        <div className="card-body">
          {stats.recentActivities.length === 0 ? (
            <div className="text-center" style={{ padding: '40px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}>📅</div>
              <h5 style={{ color: '#666', marginBottom: '10px' }}>ยังไม่มีกิจกรรมในขณะนี้</h5>
              <p style={{ color: '#999', fontSize: '14px' }}>
                กลับมาดูใหม่ในภายหลังเพื่อกิจกรรมใหม่ๆ!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {stats.recentActivities.map((activity) => (
                <div key={activity.id} style={{
                  padding: '25px',
                  border: '1px solid #e9ecef',
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 5px 20px rgba(0,0,0,0.1)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}>
                  <div className="row align-items-start">
                    <div className="col-md-8">
                      <h5 style={{ marginBottom: '15px', color: '#333', fontWeight: 'bold' }}>
                        {activity.title}
                      </h5>
                      {activity.description && (
                        <p style={{ color: '#666', marginBottom: '20px', fontSize: '15px', lineHeight: '1.6' }}>
                          {activity.description.length > 150 
                            ? `${activity.description.substring(0, 150)}...` 
                            : activity.description
                          }
                        </p>
                      )}
                      
                      <div className="row" style={{ marginBottom: '15px' }}>
                        <div className="col-md-4">
                          <div style={{ marginBottom: '10px' }}>
                            <strong style={{ fontSize: '12px', color: '#007bff', textTransform: 'uppercase' }}>วันที่เริ่ม</strong><br />
                            <span style={{ fontSize: '14px', color: '#333' }}>{formatDate(activity.start_date)}</span>
                          </div>
                        </div>
                        {activity.location && (
                          <div className="col-md-4">
                            <div style={{ marginBottom: '10px' }}>
                              <strong style={{ fontSize: '12px', color: '#007bff', textTransform: 'uppercase' }}>สถานที่</strong><br />
                              <span style={{ fontSize: '14px', color: '#333' }}>{activity.location}</span>
                            </div>
                          </div>
                        )}
                        {activity.max_participants && (
                          <div className="col-md-4">
                            <div style={{ marginBottom: '10px' }}>
                              <strong style={{ fontSize: '12px', color: '#007bff', textTransform: 'uppercase' }}>ผู้เข้าร่วม</strong><br />
                              <span style={{ fontSize: '14px', color: '#333' }}>
                                {activity.current_participants || 0} / {activity.max_participants}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#666' }}>
                          โดย {activity.creator?.name || 'ผู้ดูแลระบบ'}
                        </span>
                        {isUpcoming(activity.start_date) && (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            fontWeight: 'bold'
                          }}>
                            กำลังจะมาถึง
                          </span>
                        )}
                        {activity.hours_awarded && (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            backgroundColor: '#ffc107',
                            color: '#333',
                            fontWeight: 'bold'
                          }}>
                            {activity.hours_awarded} ชั่วโมง
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-md-4 text-end">
                      <div style={{ 
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '10px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>📅</div>
                          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                            กิจกรรมที่น่าสนใจ
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Student Tips */}
      <div className="card" style={{ border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
        <div className="card-header" style={{ backgroundColor: '#f8f9fa', border: 'none' }}>
          <h4 style={{ margin: 0, color: '#333' }}>💡 เคล็ดลับสำหรับนักเรียน</h4>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#e7f3ff', 
              borderRadius: '10px',
              border: '1px solid #b3d9ff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>📅</span>
                <strong style={{ color: '#0056b3' }}>ติดตามกิจกรรมใหม่</strong>
              </div>
              <p style={{ margin: 0, color: '#333', lineHeight: '1.6' }}>
                ตรวจสอบหน้าปฏิทินกิจกรรมเป็นประจำเพื่อหาโอกาสใหม่ๆ และกิจกรรมที่น่าสนใจ
              </p>
            </div>
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f0f8e7', 
              borderRadius: '10px',
              border: '1px solid #c3e6cb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>⏰</span>
                <strong style={{ color: '#155724' }}>วางแผนล่วงหน้า</strong>
              </div>
              <p style={{ margin: 0, color: '#333', lineHeight: '1.6' }}>
                ลงทะเบียนกิจกรรมที่มีจำนวนจำกัดแต่เนิ่นๆ เพื่อให้แน่ใจว่าคุณจะได้เข้าร่วม
              </p>
            </div>
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#fff3cd', 
              borderRadius: '10px',
              border: '1px solid #ffeaa7'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>🤝</span>
                <strong style={{ color: '#856404' }}>มีส่วนร่วม</strong>
              </div>
              <p style={{ margin: 0, color: '#333', lineHeight: '1.6' }}>
                การเข้าร่วมกิจกรรมเป็นวิธีที่ดีในการพบปะผู้คนใหม่ๆ และพัฒนาทักษะใหม่ๆ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentHome
