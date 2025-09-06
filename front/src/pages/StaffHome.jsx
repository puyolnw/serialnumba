import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const StaffHome = () => {
  const [stats, setStats] = useState({
    myActivities: 0,
    publishedActivities: 0,
    recentActivities: []
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch activities for stats
      const activitiesResponse = await api.get('/activities?limit=100')
      const activities = activitiesResponse.data.activities
      
      // Filter activities created by current user
      const myActivities = activities.filter(a => a.createdBy === user.id)
      
      setStats({
        myActivities: myActivities.length,
        publishedActivities: myActivities.filter(a => a.status === 'published').length,
        recentActivities: myActivities.slice(0, 5)
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="text-center">
          <div>Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Staff Dashboard</h1>
        <Link to="/activities/create" className="btn btn-primary">
          Create Activity
        </Link>
      </div>

      <div className="mb-3">
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Welcome back, {user?.firstName}! Manage your activities and engage with students.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="card text-center">
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📅</div>
          <h3 style={{ marginBottom: '5px' }}>{stats.myActivities}</h3>
          <p style={{ color: '#666', margin: 0 }}>My Activities</p>
        </div>
        
        <div className="card text-center">
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✅</div>
          <h3 style={{ marginBottom: '5px' }}>{stats.publishedActivities}</h3>
          <p style={{ color: '#666', margin: 0 }}>Published</p>
        </div>
        
        <div className="card text-center">
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📝</div>
          <h3 style={{ marginBottom: '5px' }}>{stats.myActivities - stats.publishedActivities}</h3>
          <p style={{ color: '#666', margin: 0 }}>Drafts</p>
        </div>
        
        <div className="card text-center">
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
          <h3 style={{ marginBottom: '5px' }}>
            {stats.myActivities > 0 ? Math.round((stats.publishedActivities / stats.myActivities) * 100) : 0}%
          </h3>
          <p style={{ color: '#666', margin: 0 }}>Published Rate</p>
        </div>
      </div>

      {/* My Recent Activities */}
      <div className="card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>My Recent Activities</h3>
          <Link to="/activities" className="btn btn-outline-primary">
            View All
          </Link>
        </div>
        
        {stats.recentActivities.length === 0 ? (
          <div className="text-center" style={{ padding: '40px' }}>
            <p style={{ color: '#666' }}>You haven't created any activities yet</p>
            <Link to="/activities/create" className="btn btn-primary">
              Create Your First Activity
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {stats.recentActivities.map((activity) => (
              <div key={activity.id} style={{
                padding: '15px',
                border: '1px solid #e9ecef',
                borderRadius: '5px',
                backgroundColor: '#f8f9fa'
              }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 style={{ marginBottom: '5px' }}>{activity.title}</h5>
                    <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                      Created {formatDate(activity.createdAt)}
                      {activity.location && ` • ${activity.location}`}
                    </p>
                    {activity.description && (
                      <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '14px' }}>
                        {activity.description.length > 100 
                          ? `${activity.description.substring(0, 100)}...` 
                          : activity.description
                        }
                      </p>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${activity.status === 'published' ? 'badge-success' : 'badge-warning'}`} style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: activity.status === 'published' ? '#28a745' : '#ffc107',
                      color: activity.status === 'published' ? 'white' : '#212529'
                    }}>
                      {activity.status}
                    </span>
                    <Link 
                      to={`/activities/${activity.id}/edit`}
                      className="btn btn-sm btn-outline-primary"
                      style={{ padding: '2px 8px', fontSize: '12px' }}
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <Link to="/activities/create" className="btn btn-primary">
            Create New Activity
          </Link>
          <Link to="/activities" className="btn btn-secondary">
            View All Activities
          </Link>
          <Link to="/activities?status=draft" className="btn btn-secondary">
            My Drafts
          </Link>
          <Link to="/activities?status=published" className="btn btn-secondary">
            My Published
          </Link>
        </div>
      </div>

      {/* Tips Section */}
      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>💡 Tips for Staff</h3>
        <div style={{ display: 'grid', gap: '15px' }}>
          <div style={{ padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '5px' }}>
            <strong>Creating Engaging Activities:</strong> Make sure to include clear descriptions, specific dates, and location information to help students plan their participation.
          </div>
          <div style={{ padding: '15px', backgroundColor: '#f0f8e7', borderRadius: '5px' }}>
            <strong>Managing Participants:</strong> Set appropriate participant limits and monitor registration to ensure a good experience for everyone.
          </div>
          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
            <strong>Publishing Guidelines:</strong> Review all details before publishing. Once published, activities become visible to all users.
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffHome
