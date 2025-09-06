import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const SerialManagement = () => {
  const [serials, setSerials] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [serialsResponse, activitiesResponse] = await Promise.all([
        api.get('/admin/serials'),
        api.get('/admin/activities')
      ])
      
      if (serialsResponse.data.success) {
        setSerials(serialsResponse.data.data.serials || [])
      }
      
      if (activitiesResponse.data.success) {
        setActivities(activitiesResponse.data.data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  const filteredSerials = serials.filter(serial => {
    const matchesFilter = filter === 'all' || serial.status === filter
    const matchesSearch = searchTerm === '' || 
      serial.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serial.activity?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serial.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'REDEEMED': return 'info'
      case 'EXPIRED': return 'warning'
      case 'CANCELLED': return 'danger'
      default: return 'secondary'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE': return 'ใช้งานได้'
      case 'REDEEMED': return 'ใช้แล้ว'
      case 'EXPIRED': return 'หมดอายุ'
      case 'CANCELLED': return 'ยกเลิก'
      default: return status
    }
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

  const handleGenerateSerials = async (activityId, count) => {
    try {
      setLoading(true)
      const response = await api.post('/admin/serials/generate', {
        activity_id: activityId,
        count: count
      })
      
      if (response.data.success) {
        await fetchData() // Refresh data
        setError('')
      } else {
        setError(response.data.message || 'ไม่สามารถสร้าง Serial ได้')
      }
    } catch (error) {
      console.error('Error generating serials:', error)
      setError(error.response?.data?.message || 'ไม่สามารถสร้าง Serial ได้')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="text-center" style={{ padding: '40px 20px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">กำลังโหลด...</span>
            </div>
            <div className="mt-3">กำลังโหลดข้อมูล Serial...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>จัดการ Serial</h1>
          <p>จัดการรหัส Serial สำหรับกิจกรรม</p>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="content-card">
          <h3>สร้าง Serial ใหม่</h3>
          <div className="row">
            {activities.filter(activity => activity.status === 'OPEN').map(activity => (
              <div key={activity.id} className="col-md-4 mb-3">
                <div className="card bg-light">
                  <div className="card-body">
                    <h6 className="card-title">{activity.title}</h6>
                    <p className="card-text small text-muted">
                      {activity.hours_awarded} ชั่วโมง • {activity.participant_count || 0} ผู้เข้าร่วม
                    </p>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleGenerateSerials(activity.id, 10)}
                        disabled={loading}
                      >
                        สร้าง 10 ตัว
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleGenerateSerials(activity.id, 50)}
                        disabled={loading}
                      >
                        สร้าง 50 ตัว
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="table-container">
          <div className="table-header">
            <div className="d-flex justify-content-between align-items-center w-100">
              <h5>
                <i className="fas fa-ticket-alt me-2"></i>
                Serial ทั้งหมด ({filteredSerials.length})
              </h5>
              <div className="d-flex gap-2">
                <div className="input-group input-group-sm" style={{ width: '200px' }}>
                  <span className="input-group-text">
                    <i className="fas fa-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ค้นหา Serial..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="form-select form-select-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="ACTIVE">ใช้งานได้</option>
                  <option value="REDEEMED">ใช้แล้ว</option>
                  <option value="EXPIRED">หมดอายุ</option>
                  <option value="CANCELLED">ยกเลิก</option>
                </select>
              </div>
            </div>
          </div>

          {filteredSerials.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-ticket-alt"></i>
              <h5>ไม่พบ Serial</h5>
              <p>
                {searchTerm 
                  ? `ไม่พบ Serial ที่ตรงกับ "${searchTerm}"` 
                  : "ยังไม่มี Serial ในระบบ"
                }
              </p>
              <p>สร้าง Serial ใหม่โดยเลือกกิจกรรมด้านบน</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>รหัส Serial</th>
                    <th>กิจกรรม</th>
                    <th>ชั่วโมง</th>
                    <th>สถานะ</th>
                    <th>ผู้ใช้</th>
                    <th>วันที่สร้าง</th>
                    <th>วันที่ใช้</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSerials.map((serial) => (
                    <tr key={serial.id}>
                      <td>
                        <code className="bg-light p-2 rounded">
                          {serial.code}
                        </code>
                      </td>
                      <td>
                        <div>
                          <strong>{serial.activity?.title || 'ไม่ทราบ'}</strong>
                          {serial.activity?.description && (
                            <div className="text-muted small">
                              {serial.activity.description.length > 30 
                                ? `${serial.activity.description.substring(0, 30)}...` 
                                : serial.activity.description
                              }
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-info">
                          {serial.hours_awarded}h
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${getStatusBadge(serial.status)}`}>
                          {getStatusText(serial.status)}
                        </span>
                      </td>
                      <td>
                        {serial.user ? (
                          <div className="d-flex align-items-center">
                            <div className="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2">
                              {serial.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div>{serial.user.name}</div>
                              <small className="text-muted">{serial.user.student_code}</small>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <small className="text-muted">
                          {formatDate(serial.id)}
                        </small>
                      </td>
                      <td>
                        <small className="text-muted">
                          {serial.redeemed_at ? formatDate(serial.redeemed_at) : '-'}
                        </small>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            className="btn btn-outline-primary"
                            title="ดูรายละเอียด"
                            onClick={() => {
                              // TODO: Implement view details
                              console.log('View serial details:', serial.id)
                            }}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          {serial.status === 'ACTIVE' && (
                            <button
                              className="btn btn-outline-warning"
                              title="ยกเลิก Serial"
                              onClick={() => {
                                // TODO: Implement cancel serial
                                console.log('Cancel serial:', serial.id)
                              }}
                            >
                              <i className="fas fa-ban"></i>
                            </button>
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

export default SerialManagement