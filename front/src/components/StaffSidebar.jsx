import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

const StaffSidebar = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState({})

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
    return [
      { 
        path: '/staff', 
        label: 'แดชบอร์ด', 
        icon: '🏠',
        type: 'single'
      },
      {
        key: 'activity-management',
        label: 'จัดการกิจกรรม',
        icon: '📅',
        type: 'submenu',
        children: [
          { path: '/staff/activities', label: 'กิจกรรม', icon: '📋', type: 'single' },
          { path: '/staff/activities/create', label: 'สร้างกิจกรรม', icon: '➕', type: 'single' }
        ]
      },
      { 
        path: '/staff/serials/send', 
        label: 'ส่งเมลซีเรียล', 
        icon: '📤',
        type: 'single'
      },
      { 
        path: '/staff/profile', 
        label: 'โปรไฟล์', 
        icon: '👤',
        type: 'single'
      },
      {
        key: 'reports',
        label: 'รายงาน',
        icon: '📊',
        type: 'submenu',
        children: [
          { path: '/staff/reports/activities', label: 'รายงานกิจกรรม', icon: '📅', type: 'single' }
        ]
      }
    ]
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
            แผงควบคุมเจ้าหน้าที่
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

export default StaffSidebar
