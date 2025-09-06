import { Outlet } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar'
import StaffSidebar from '../components/StaffSidebar'

const StaffLayout = () => {
  return (
    <div className="dashboard-layout">
      <StaffSidebar />
      <div className="main-content-wrapper" style={{
        marginLeft: '250px',
        minHeight: '100vh'
      }}>
        <DashboardNavbar />
        <main className="main-content" style={{
          padding: '20px',
          backgroundColor: '#f5f5f5',
          minHeight: 'calc(100vh - 70px)'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default StaffLayout
