import { Outlet } from 'react-router-dom'
import GuestNavbar from '../components/GuestNavbar'

const GuestLayout = () => {
  return (
    <div className="guest-layout">
      <GuestNavbar />
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default GuestLayout
