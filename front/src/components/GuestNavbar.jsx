import { Link, useLocation } from 'react-router-dom'

const GuestNavbar = ({ pageTitle }) => {
  const location = useLocation()

  // Get page title based on current route
  const getPageTitle = () => {
    if (pageTitle) return pageTitle
    
    const path = location.pathname
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
          {/* ชื่อเว็บ - ด้านซ้าย */}
          <div className="d-flex align-items-center">
            <Link 
              to="/" 
              style={{ 
                color: 'white', 
                textDecoration: 'none',
                fontSize: '1.8rem',
                fontWeight: 'bold',
                marginRight: '30px'
              }}
            >
              🎯 ActivityHub
            </Link>
            <h1 style={{ 
              color: 'white', 
              fontSize: '1.5rem', 
              fontWeight: 'bold',
              margin: 0
            }}>
              {getPageTitle()}
            </h1>
          </div>
          
          {/* เมนู - ด้านขวา */}
          <div className="d-flex align-items-center gap-3">
            <Link 
              to="/activities" 
              style={{ 
                color: 'white', 
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '5px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              📅 ปฏิทินกิจกรรม
            </Link>
            <Link 
              to="/login" 
              style={{ 
                color: 'white', 
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '5px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              เข้าสู่ระบบ
            </Link>
            <Link 
              to="/register" 
              className="btn btn-outline-light"
              style={{ 
                padding: '8px 16px', 
                fontSize: '14px',
                border: '1px solid rgba(255,255,255,0.5)',
                backgroundColor: 'transparent',
                color: 'white',
                borderRadius: '5px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'white'
                e.target.style.color = '#007bff'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent'
                e.target.style.color = 'white'
              }}
            >
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default GuestNavbar
