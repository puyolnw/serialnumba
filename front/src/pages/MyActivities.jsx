import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const MyActivities = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await api.get('/activities/my')
      
      if (response.data.success) {
        setActivities(response.data.data.activities || [])
      } else {
        setError(response.data.message || 'Failed to fetch activities')
      }
    } catch (error) {
      console.error('Fetch activities error:', error)
      setError(error.response?.data?.message || 'Failed to fetch activities')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      'DRAFT': 'secondary',
      'OPEN': 'success',
      'CANCELLED': 'danger',
      'COMPLETED': 'info'
    }
    return badges[status] || 'secondary'
  }

  const getStatusText = (status) => {
    const texts = {
      'DRAFT': 'Draft',
      'OPEN': 'Open',
      'CANCELLED': 'Cancelled',
      'COMPLETED': 'Completed'
    }
    return texts[status] || status
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true
    return activity.status === filter
  })

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading activities...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>กิจกรรมของฉัน</h1>
          <p>จัดการกิจกรรมที่คุณสร้างขึ้น</p>
        </div>

          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

        <div className="table-container">
          <div className="table-header">
            <div className="d-flex justify-content-between align-items-center w-100">
              <h5>
                <i className="fas fa-list me-2"></i>
                กิจกรรม ({filteredActivities.length})
              </h5>
              <div className="d-flex gap-2">
                <Link to="/activities/create" className="btn btn-outline-light btn-sm">
                  <i className="fas fa-plus me-1"></i>
                  สร้างใหม่
                </Link>
                <select
                  className="form-select form-select-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="DRAFT">ร่าง</option>
                  <option value="OPEN">เปิดรับสมัคร</option>
                  <option value="CANCELLED">ยกเลิก</option>
                  <option value="COMPLETED">เสร็จสิ้น</option>
                </select>
              </div>
            </div>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-times"></i>
              <h5>ไม่พบกิจกรรม</h5>
              <p>
                {filter === 'all' 
                  ? "คุณยังไม่ได้สร้างกิจกรรมใดๆ" 
                  : `ไม่พบกิจกรรมที่มีสถานะ "${getStatusText(filter)}"`
                }
              </p>
              <Link to="/activities/create" className="btn btn-primary">
                <i className="fas fa-plus me-2"></i>
                สร้างกิจกรรมแรกของคุณ
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ชื่อกิจกรรม</th>
                    <th>สถานะ</th>
                    <th>วันที่เริ่มต้น</th>
                    <th>วันที่สิ้นสุด</th>
                    <th>ชั่วโมง</th>
                    <th>ผู้เข้าร่วม</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td>
                        <div>
                          <strong>{activity.title}</strong>
                          {activity.description && (
                            <div className="text-muted small">
                              {activity.description.length > 50 
                                ? `${activity.description.substring(0, 50)}...` 
                                : activity.description
                              }
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-${getStatusBadge(activity.status)}`}>
                          {getStatusText(activity.status)}
                        </span>
                      </td>
                      <td>
                        <small>{formatDate(activity.start_date)}</small>
                      </td>
                      <td>
                        <small>{formatDate(activity.end_date)}</small>
                      </td>
                      <td>
                        <span className="badge bg-info">
                          {activity.hours_awarded}h
                        </span>
                      </td>
                      <td>
                        <span className="text-muted">
                          {activity.participant_count || 0}
                          {activity.max_participants && ` / ${activity.max_participants}`}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          <Link
                            to={`/activities/${activity.id}`}
                            className="btn btn-outline-primary"
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </Link>
                          <Link
                            to={`/activities/${activity.id}/edit`}
                            className="btn btn-outline-secondary"
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </Link>
                          {activity.public_slug && (
                            <Link
                              to={`/admin/qr-generator?activity=${activity.id}`}
                              className="btn btn-outline-success"
                              title="Generate QR Code"
                            >
                              <i className="fas fa-qrcode"></i>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyActivities
