import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Activities = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, hasRole } = useAuth()

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await api.get('/activities')
      if (response.data.success) {
        setActivities(response.data.data.activities)
      } else {
        setError('Failed to fetch activities')
      }
    } catch (error) {
      setError('Failed to fetch activities')
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) {
      return
    }

    try {
      const response = await api.delete(`/activities/${id}`)
      if (response.data.success) {
        setActivities(activities.filter(activity => activity.id !== id))
      } else {
        setError('Failed to delete activity')
      }
    } catch (error) {
      setError('Failed to delete activity')
      console.error('Error deleting activity:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="text-center">
          <div>Loading activities...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Activities</h1>
        {hasRole('staff') && (
          <Link to="/activities/create" className="btn btn-primary">
            Create New Activity
          </Link>
        )}
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

      {activities.length === 0 ? (
        <div className="card text-center">
          <div style={{ padding: '40px' }}>
            <h3>No activities found</h3>
            <p style={{ color: '#666' }}>
              {hasRole('staff') 
                ? 'Create your first activity to get started!'
                : 'Check back later for new activities.'
              }
            </p>
            {hasRole('staff') && (
              <Link to="/activities/create" className="btn btn-primary">
                Create Activity
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {activities.map((activity) => (
            <div key={activity.id} className="card">
              <div className="d-flex justify-content-between align-items-start">
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginBottom: '10px' }}>{activity.title}</h3>
                  {activity.description && (
                    <p style={{ color: '#666', marginBottom: '15px' }}>
                      {activity.description}
                    </p>
                  )}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <strong>Start Date:</strong><br />
                      <span style={{ color: '#666' }}>{formatDate(activity.start_date)}</span>
                    </div>
                    <div>
                      <strong>End Date:</strong><br />
                      <span style={{ color: '#666' }}>{formatDate(activity.end_date)}</span>
                    </div>
                    <div>
                      <strong>Hours Awarded:</strong><br />
                      <span style={{ color: '#666' }}>{activity.hours_awarded} hours</span>
                    </div>
                    {activity.public_slug && (
                      <div>
                        <strong>Public Link:</strong><br />
                        <a href={`/checkin/${activity.public_slug}`} style={{ color: '#007bff' }}>
                          /checkin/{activity.public_slug}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className={`badge ${activity.status === 'OPEN' ? 'badge-success' : 'badge-secondary'}`} style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: activity.status === 'OPEN' ? '#28a745' : '#6c757d',
                      color: 'white'
                    }}>
                      {activity.status}
                    </span>
                    <span style={{ color: '#666', fontSize: '14px' }}>
                      Created by {activity.creator?.name}
                    </span>
                  </div>
                </div>
                
                {hasRole('staff') && (
                  <div className="d-flex gap-2">
                    <Link 
                      to={`/activities/${activity.id}/edit`}
                      className="btn btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                    >
                      Edit
                    </Link>
                    {hasRole('admin') && (
                      <button
                        onClick={() => handleDelete(activity.id)}
                        className="btn btn-danger"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Activities
