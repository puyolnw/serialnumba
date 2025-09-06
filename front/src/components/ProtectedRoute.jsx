import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If no specific role required, just check if user is authenticated
  if (!requiredRole) {
    return children
  }

  if (user.role.toLowerCase() !== requiredRole.toLowerCase()) {
    // Redirect to appropriate dashboard based on user role
    const roleRoutes = {
      admin: '/admin',
      staff: '/staff',
      student: '/student'
    }
    
    return <Navigate to={roleRoutes[user.role.toLowerCase()] || '/login'} replace />
  }

  return children
}

export default ProtectedRoute
