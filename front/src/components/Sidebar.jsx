import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import api from '../services/api'

const Sidebar = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState({})
  const [isEligibleForCertificate, setIsEligibleForCertificate] = useState(false)

  // Check certificate eligibility for students
  useEffect(() => {
    const checkCertificateEligibility = async () => {
      if (user && user.role === 'STUDENT') {
        try {
          const response = await api.get('/certificate/check-eligibility')
          if (response.data.success) {
            setIsEligibleForCertificate(response.data.data.isEligible)
          }
        } catch (error) {
          console.error('Failed to check certificate eligibility:', error)
        }
      }
    }

    checkCertificateEligibility()
  }, [user])

  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => {
      const newState = {}
      // Close all other menus and toggle the clicked one
      Object.keys(prev).forEach(key => {
        if (key !== menuKey) {
          newState[key] = false
        }
      })
      newState[menuKey] = !prev[menuKey]
      return newState
    })
  }

  const getMenuItems = () => {
    if (!user) return []

    const baseItems = [
      { 
        path: `/${user.role}`, 
        label: 'แดชบอร์ด', 
        icon: '🏠',
        type: 'single'
      },
    ]

    if (user.role.toLowerCase() === 'admin') {
      baseItems.push(
        {
          key: 'activity-management',
          label: 'จัดการกิจกรรม',
          icon: '📅',
          type: 'submenu',
          children: [
            { path: '/admin/activities', label: 'กิจกรรม', icon: '📋', type: 'single' },
            { path: '/admin/activities/create', label: 'สร้างกิจกรรม', icon: '➕', type: 'single' },
            { path: '/admin/serials/send', label: 'ส่งซีเรียล', icon: '📤', type: 'single' }
          ]
        },
        {
          key: 'user-management',
          label: 'จัดการบัญชีผู้ใช้',
          icon: '👥',
          type: 'submenu',
          children: [
            { path: '/admin/users/students', label: 'บัญชีนักเรียน', icon: '🎓', type: 'single' },
            { path: '/admin/users/staff', label: 'บัญชีสตาฟ', icon: '👨‍💼', type: 'single' },
            { path: '/admin/users/admins', label: 'บัญชีแอดมิน', icon: '👑', type: 'single' }
          ]
        },
        {
          key: 'reports',
          label: 'รายงาน',
          icon: '📊',
          type: 'submenu',
          children: [
            { path: '/admin/reports/members', label: 'รายงานสมาชิก', icon: '👥', type: 'single' },
            { path: '/admin/reports/activities', label: 'รายงานกิจกรรม', icon: '📅', type: 'single' },
            { path: '/admin/reports/evaluations', label: 'รายงานประเมิน', icon: '⭐', type: 'single' }
          ]
        },
        {
          key: 'system-settings',
          label: 'ตั้งค่าระบบ',
          icon: '⚙️',
          type: 'submenu',
          children: [
            { path: '/admin/settings', label: 'ตั้งค่าระบบ', icon: '🔧', type: 'single' },
            { path: '/admin/mail-settings', label: 'ตั้งค่าอีเมล', icon: '📧', type: 'single' },
            { path: '/admin/mail-test', label: 'ทดสอบส่งอีเมล', icon: '📤', type: 'single' }
          ]
        }
      )
    }

    if (user.role.toLowerCase() === 'staff') {
      baseItems.push(
        { path: '/staff/attendance', label: 'ยืนยันการเข้าร่วม', icon: '✅', type: 'single' },
        { path: '/staff/serials', label: 'จัดการ Serial', icon: '🎫', type: 'single' },
        { path: '/staff/qr-generator', label: 'สร้าง QR Code', icon: '📱', type: 'single' },
        {
          key: 'reports',
          label: 'รายงาน',
          icon: '📈',
          type: 'submenu',
          children: [
            { path: '/staff/participants', label: 'ผู้เข้าร่วม', icon: '👥', type: 'single' },
            { path: '/staff/analytics', label: 'การวิเคราะห์', icon: '📊', type: 'single' }
          ]
        }
      )
    }

    if (user.role.toLowerCase() === 'student') {
      baseItems.push(
        { path: '/activities', label: 'ปฏิทินกิจกรรม', icon: '📅', type: 'single' },
        { path: '/student/progress', label: 'ความก้าวหน้าของฉัน', icon: '📊', type: 'single' },
        { path: '/student/serials', label: 'แลก Serial', icon: '🎫', type: 'single' },
        { path: '/student/history', label: 'ประวัติ Serial', icon: '📚', type: 'single' },
        { path: '/student/profile', label: 'โปรไฟล์ของฉัน', icon: '👤', type: 'single' }
      )
      
      // Add certificate menu item only if student is eligible
      if (isEligibleForCertificate) {
        baseItems.push(
          { path: '/student/certificate', label: 'ใบประกาศนียบัตร', icon: '🏆', type: 'single' }
        )
      }
    }

    return baseItems
  }

  const menuItems = getMenuItems()

  const renderMenuItem = (item, level = 0) => {
    if (item.type === 'single') {
      return (
        <Link
          key={item.path}
          to={item.path}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 20px',
            paddingLeft: `${20 + level * 20}px`,
            color: 'white',
            textDecoration: 'none',
            backgroundColor: location.pathname === item.path ? '#007bff' : 'transparent',
            transition: 'all 0.3s ease',
            borderLeft: location.pathname === item.path ? '3px solid #007bff' : '3px solid transparent'
          }}
          onMouseEnter={(e) => {
            if (location.pathname !== item.path) {
              e.currentTarget.style.backgroundColor = '#495057'
            }
          }}
          onMouseLeave={(e) => {
            if (location.pathname !== item.path) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          <span style={{ marginRight: '10px', fontSize: '1.2rem' }}>
            {item.icon}
          </span>
          {item.label}
        </Link>
      )
    }

    if (item.type === 'submenu') {
      const isExpanded = expandedMenus[item.key] || false
      const hasActiveChild = item.children.some(child => location.pathname === child.path)

      return (
        <div key={item.key}>
          <div
            onClick={() => toggleMenu(item.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              color: 'white',
              cursor: 'pointer',
              backgroundColor: hasActiveChild ? '#495057' : 'transparent',
              transition: 'all 0.3s ease',
              borderLeft: hasActiveChild ? '3px solid #007bff' : '3px solid transparent'
            }}
            onMouseEnter={(e) => {
              if (!hasActiveChild) {
                e.currentTarget.style.backgroundColor = '#495057'
              }
            }}
            onMouseLeave={(e) => {
              if (!hasActiveChild) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px', fontSize: '1.2rem' }}>
                {item.icon}
              </span>
              {item.label}
            </div>
            <span style={{ 
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
              fontSize: '12px'
            }}>
              ▶
            </span>
          </div>
          
          {isExpanded && (
            <div style={{ 
              backgroundColor: '#2c3034',
              borderLeft: '3px solid #007bff',
              marginLeft: '10px'
            }}>
              {item.children.map(child => renderMenuItem(child, 1))}
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <aside className="sidebar" style={{
      width: '250px',
      backgroundColor: '#343a40',
      color: 'white',
      minHeight: '100vh',
      padding: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 999
    }}>
      <div className="sidebar-content">
        {/* Website Title */}
        <div style={{ 
          padding: '20px',
          backgroundColor: '#343a40',
          borderBottom: '1px solid #495057'
        }}>
          <h2 style={{ 
            fontSize: '1.3rem', 
            fontWeight: 'bold',
            margin: 0,
            textAlign: 'center',
            color: 'white'
          }}>
            ระบบจัดการกิจกรรม
          </h2>
          <p style={{ 
            fontSize: '0.9rem',
            margin: '5px 0 0 0',
            textAlign: 'center',
            opacity: 0.9,
            color: 'white'
          }}>
            แผงควบคุม{user?.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : user?.role === 'STAFF' ? 'เจ้าหน้าที่' : 'นักเรียน'}
          </p>
        </div>
        
        {/* Navigation Menu */}
        <nav style={{ paddingTop: '20px' }}>
          {menuItems.map(item => renderMenuItem(item))}
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar