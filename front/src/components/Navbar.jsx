import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Navbar = ({ pageTitle }) => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
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
            {isAuthenticated ? (
              <>
                <div className="d-flex align-items-center gap-3">
                  <span style={{ 
                    fontSize: '14px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    padding: '5px 10px',
                    borderRadius: '15px'
                  }}>
                    {user.name}
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
              </>
            ) : (
              <>
                <Link to="/activities" style={{ color: 'white', textDecoration: 'none' }}>
                  📅 ปฏิทินกิจกรรม
                </Link>
                <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>
                  เข้าสู่ระบบ
                </Link>
                <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>
                  สมัครสมาชิก
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
