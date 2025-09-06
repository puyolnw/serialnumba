import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const from = location.state?.from?.pathname || '/'

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Clear previous error when starting new login attempt
      if (error) setError('')
      
      console.log('Login form submitted:', formData)
      const result = await login(formData.identifier, formData.password)
      console.log('Login result:', result)
      
      if (result.success) {
        // Redirect based on user role
        const user = result.user
        console.log('User role:', user.role)
        
        const roleRoutes = {
          ADMIN: '/admin',
          STAFF: '/staff',
          STUDENT: '/student'
        }
        
        const redirectPath = roleRoutes[user.role] || from
        console.log('Redirecting to:', redirectPath)
        navigate(redirectPath, { replace: true })
      } else {
        console.log('Login failed:', result.message)
        setError(result.message || 'Login failed. Please check your credentials.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center mb-3">
          <h2>Login</h2>
          <p style={{ color: '#666' }}>Sign in to your account</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="identifier" className="form-label">Email, Username, or Student Code</label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              className="form-control"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="Enter your email, username, or student code"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '20px' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="text-center">
          <p style={{ color: '#666' }}>
            Don't have an account? <Link to="/register" style={{ color: '#007bff' }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
