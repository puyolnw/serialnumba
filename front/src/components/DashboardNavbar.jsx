import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import api from '../services/api'
import ActivityNotificationModal from './ActivityNotificationModal'

const DashboardNavbar = ({ pageTitle }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [pendingSerials, setPendingSerials] = useState(0)
  const [upcomingActivities, setUpcomingActivities] = useState([])
  const [showActivityModal, setShowActivityModal] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Fetch pending serial count for admin and staff
  useEffect(() => {
    const fetchPendingSerials = async () => {
      if (user && (user.role === 'ADMIN' || user.role === 'STAFF')) {
        try {
          const response = await api.get('/serials/pending-count')
          if (response.data.success) {
            setPendingSerials(response.data.data.pending_serials)
          }
        } catch (error) {
          console.error('Failed to fetch pending serials:', error)
        }
      }
    }

    fetchPendingSerials()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingSerials, 30000)
    return () => clearInterval(interval)
  }, [user])

  // Fetch upcoming activities for students
  useEffect(() => {
    const fetchUpcomingActivities = async () => {
      if (user && user.role === 'STUDENT') {
        try {
          const response = await api.get('/student/upcoming-activities')
          if (response.data.success) {
            setUpcomingActivities(response.data.data.upcomingActivities)
          }
        } catch (error) {
          console.error('Failed to fetch upcoming activities:', error)
        }
      }
    }

    fetchUpcomingActivities()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchUpcomingActivities, 300000)
    return () => clearInterval(interval)
  }, [user])

  const handleNotificationClick = () => {
    if (user.role === 'ADMIN') {
      navigate('/admin/serials/send')
    } else if (user.role === 'STAFF') {
      navigate('/staff/serials/send')
    } else if (user.role === 'STUDENT') {
      console.log('Student notification clicked, upcoming activities:', upcomingActivities)
      if (upcomingActivities.length > 0) {
        console.log('Opening activity modal')
        setShowActivityModal(true)
      } else {
        console.log('No upcoming activities, navigating to activities page')
        navigate('/activities')
      }
    }
  }

  // Get page title based on current route
  const getPageTitle = () => {
    if (pageTitle) return pageTitle
    
    const path = location.pathname
    if (path.includes('/admin')) return 'แดชบอร์ดผู้ดูแลระบบ'
    if (path.includes('/staff')) return 'แดชบอร์ดเจ้าหน้าที่'
    if (path.includes('/student')) return 'แดชบอร์ดนักเรียน'
    if (path.includes('/activities')) return 'ปฏิทินกิจกรรม'
    if (path.includes('/login')) return 'เข้าสู่ระบบ'
    if (path.includes('/register')) return 'สมัครสมาชิก'
    return 'ระบบจัดการกิจกรรม'
  }

  return (
    <nav className="navbar" style={{
      backgroundColor: '#007bff',
      color: 'white',
      padding: '1rem 0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center">
          <h1 style={{ 
            color: 'white', 
            fontSize: '1.5rem', 
            fontWeight: 'bold',
            margin: 0
          }}>
            {getPageTitle()}
          </h1>
          
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center gap-3">
              {/* Notification Icon for Admin, Staff, and Students */}
              {((user.role === 'ADMIN' || user.role === 'STAFF') || user.role === 'STUDENT') && (
                <div 
                  className="position-relative"
                  style={{ 
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    backgroundColor: (pendingSerials > 0 || upcomingActivities.length > 0) ? 'rgba(220, 53, 69, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.3s ease',
                    border: (pendingSerials > 0 || upcomingActivities.length > 0) ? '2px solid #dc3545' : '2px solid transparent'
                  }}
                  onClick={handleNotificationClick}
                  title={
                    user.role === 'STUDENT' 
                      ? (upcomingActivities.length > 0 ? `มี ${upcomingActivities.length} กิจกรรมที่ใกล้เข้ามา` : 'ไม่มีกิจกรรมที่ใกล้เข้ามา')
                      : (pendingSerials > 0 ? `มี ${pendingSerials} รายการที่รอส่งซีเรียล` : 'ไม่มีซีเรียลที่รอส่ง')
                  }
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = (pendingSerials > 0 || upcomingActivities.length > 0) ? 'rgba(220, 53, 69, 0.3)' : 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = (pendingSerials > 0 || upcomingActivities.length > 0) ? 'rgba(220, 53, 69, 0.2)' : 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  <i 
                    className="fas fa-bell" 
                    style={{ 
                      fontSize: '20px',
                      color: (pendingSerials > 0 || upcomingActivities.length > 0) ? '#ff6b6b' : 'white',
                      transition: 'color 0.3s ease'
                    }}
                  ></i>
                  {(pendingSerials > 0 || upcomingActivities.length > 0) && (
                    <span 
                      className="badge bg-danger position-absolute"
                      style={{
                        top: '-5px',
                        right: '-5px',
                        fontSize: '10px',
                        minWidth: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        animation: (pendingSerials > 0 || upcomingActivities.length > 0) ? 'pulse 2s infinite' : 'none'
                      }}
                    >
                      {user.role === 'STUDENT' 
                        ? (upcomingActivities.length > 99 ? '99+' : upcomingActivities.length)
                        : (pendingSerials > 99 ? '99+' : pendingSerials)
                      }
                    </span>
                  )}
                </div>
              )}
              
              <span style={{ 
                fontSize: '14px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '5px 10px',
                borderRadius: '15px'
              }}>
                {user.role === 'ADMIN' ? 'สวัสดีแอดมิน' : 
                 user.role === 'STAFF' ? 'สวัสดีสตาฟ' : 
                 'สวัสดีนักศึกษา'} {user.name}
              </span>
              <button 
                onClick={handleLogout}
                className="btn btn-outline-light"
                style={{ 
                  padding: '5px 15px', 
                  fontSize: '12px',
                  border: '1px solid rgba(255,255,255,0.5)',
                  backgroundColor: 'transparent',
                  color: 'white'
                }}
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Activity Notification Modal for Students */}
      {user.role === 'STUDENT' && (
        <ActivityNotificationModal
          isOpen={showActivityModal}
          onClose={() => setShowActivityModal(false)}
          activities={upcomingActivities}
        />
      )}
    </nav>
  )
}

export default DashboardNavbar
