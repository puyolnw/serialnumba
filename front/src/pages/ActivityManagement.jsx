import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const safeLower = (v) => (typeof v === 'string' ? v.toLowerCase() : '')
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return '-'
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

const getStatusBadge = (status) => {
  // Bootstrap 5 ใช้ bg-*
  const map = {
    OPEN: 'bg-success',
    DRAFT: 'bg-warning text-dark',
    CANCELLED: 'bg-danger',
    COMPLETED: 'bg-info text-dark',
  }
  return map[status] || 'bg-secondary'
}

const getStatusText = (status) => {
  const texts = {
    OPEN: 'เปิดรับสมัคร',
    DRAFT: 'ร่าง',
    CANCELLED: 'ยกเลิก',
    COMPLETED: 'เสร็จสิ้น',
  }
  return texts[status] || status
}

const ActivityManagement = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [participants, setParticipants] = useState([])
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    fetchActivities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await api.get('/admin/activities')
      console.log('🔍 [FRONTEND] Activities API response:', res.data)
      if (res?.data?.success) {
        const activitiesData = res.data.data?.activities || []
        console.log('📊 [FRONTEND] Activities data:', activitiesData.map(a => ({
          id: a.id,
          title: a.title,
          participant_count: a.participant_count,
          checkins: a.checkins
        })))
        setActivities(activitiesData)
      } else {
        setActivities([])
      }
    } catch (e) {
      console.error('Error fetching activities:', e)
      setError('ไม่สามารถโหลดข้อมูลกิจกรรมได้')
    } finally {
      setLoading(false)
    }
  }

  const fetchActivityDetails = async (activityId) => {
    try {
      setError('')
      const response = await api.get(`/activities/${activityId}`)
      if (response?.data?.success) {
        const activity = response.data.data?.activity
        setSelectedActivity(activity || null)

        // Participants
        try {
          const participantsResponse = await api.get(`/admin/activities/${activityId}/participants`)
          if (participantsResponse?.data?.success) {
            setParticipants(participantsResponse.data.data?.participants || [])
          } else {
            setParticipants([])
          }
        } catch (e) {
          console.warn('Fetch participants failed:', e)
          setParticipants([])
        }

        // QR
        if (activity?.public_slug) {
          const checkinUrl = `${window.location.origin}/checkin/${activity.public_slug}`
          setQrCode(checkinUrl)
        } else {
          setQrCode('')
        }

        setShowDetails(true)
      }
    } catch (e) {
      console.error('Error fetching activity details:', e)
      setError('ไม่สามารถโหลดรายละเอียดกิจกรรมได้')
    }
  }

  const toggleActivityStatus = async (activityId, currentStatus) => {
    try {
      setError('')
      const newStatus = currentStatus === 'OPEN' ? 'DRAFT' : 'OPEN'
      const response = await api.put(`/activities/${activityId}`, { status: newStatus })
      if (response?.data?.success) {
        setActivities((prev) =>
          prev.map((a) => (a.id === activityId ? { ...a, status: newStatus } : a))
        )
        if (selectedActivity?.id === activityId) {
          setSelectedActivity((prev) => (prev ? { ...prev, status: newStatus } : prev))
        }
        setFilter('all')
        setSuccess(`กิจกรรม${newStatus === 'DRAFT' ? 'ปิดรับสมัคร' : 'เปิดรับสมัคร'}แล้ว`)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('ไม่สามารถอัปเดตสถานะกิจกรรมได้')
      }
    } catch (e) {
      console.error('Error updating activity status:', e)
      setError('ไม่สามารถอัปเดตสถานะกิจกรรมได้')
    }
  }

  const filteredActivities = useMemo(() => {
    const term = safeLower(searchTerm)
    return (activities || []).filter((activity) => {
      const statusOk = filter === 'all' || activity?.status === filter
      const title = safeLower(activity?.title)
      const desc = safeLower(activity?.description)
      const textOk = title.includes(term) || desc.includes(term)
      return statusOk && textOk
    })
  }, [activities, filter, searchTerm])

  const countsByStatus = useMemo(() => {
    return (activities || []).reduce((acc, a) => {
      const k = a?.status || 'UNKNOWN'
      acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})
  }, [activities])

  const closeModal = () => {
    setShowDetails(false)
    setSelectedActivity(null)
    setParticipants([])
    setQrCode('')
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">กำลังโหลด...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">จัดการกิจกรรม</h1>
              <p className="text-muted mb-0">จัดการกิจกรรมทั้งหมดในระบบ</p>
            </div>
            <Link to="/admin/activities/create" className="btn btn-primary">
              <i className="fas fa-plus me-2" />สร้างกิจกรรมใหม่
            </Link>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-triangle me-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert">
            <i className="fas fa-check-circle me-2" />
            {success}
          </div>
        )}

        <div className="mb-2 d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowDebug((v) => !v)}
          >
            <i className="fas fa-bug me-2" />
            {showDebug ? 'ซ่อน Debug' : 'แสดง Debug'}
          </button>
        </div>

        {showDebug && (
          <div className="alert alert-info" role="alert">
            <strong>Debug Info:</strong><br />
            Total Activities: {activities.length}<br />
            Current Filter: {filter}<br />
            Filtered Count: {filteredActivities.length}<br />
            Activities by Status: {JSON.stringify(countsByStatus)}
          </div>
        )}

        <div className="content-card">
          <div className="table-header">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">รายการกิจกรรม</h5>
              <div className="d-flex gap-2">
                <select
                  className="form-select"
                  style={{ width: 'auto' }}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">ทั้งหมด ({activities.length})</option>
                  <option value="OPEN">เปิดรับสมัคร ({countsByStatus.OPEN || 0})</option>
                  <option value="DRAFT">ร่าง ({countsByStatus.DRAFT || 0})</option>
                  <option value="CANCELLED">ยกเลิก ({countsByStatus.CANCELLED || 0})</option>
                  <option value="COMPLETED">เสร็จสิ้น ({countsByStatus.COMPLETED || 0})</option>
                </select>
                <input
                  type="text"
                  className="form-control"
                  placeholder="ค้นหากิจกรรม..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 250 }}
                />
              </div>
            </div>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="empty-state text-center py-5">
              <i className="fas fa-calendar-times fa-3x text-muted mb-3" />
              <h5>ไม่มีกิจกรรม</h5>
              <p className="text-muted">ยังไม่มีกิจกรรมที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ชื่อกิจกรรม</th>
                    <th>วันที่จัด</th>
                    <th>ชั่วโมง</th>
                    <th>ผู้เข้าร่วม</th>
                    <th>สถานะ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td><strong>{activity?.title || '-'}</strong></td>
                      <td>{formatDate(activity?.start_date)}</td>
                      <td>
                        <span className="badge bg-info text-dark">
                          {activity?.hours_awarded ?? 0} ชม.
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-primary">
                          {activity?.participant_count ?? 0} คน
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(activity?.status)}`}>
                          {getStatusText(activity?.status)}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => fetchActivityDetails(activity.id)}
                            title="ดูรายละเอียด"
                          >
                            <i className="fas fa-eye" /> ดู
                          </button>
                          <button
                            className={`btn btn-sm ${activity?.status === 'OPEN' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => toggleActivityStatus(activity.id, activity?.status)}
                            title={activity?.status === 'OPEN' ? 'ปิดรับสมัคร' : 'เปิดรับสมัคร'}
                          >
                            <i className={`fas ${activity?.status === 'OPEN' ? 'fa-pause' : 'fa-play'}`} />{' '}
                            {activity?.status === 'OPEN' ? 'ปิด' : 'เปิด'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Activity Details Modal */}
        {showDetails && selectedActivity && (
          <>
            <div className="modal-backdrop show" onClick={closeModal} />
            <div className="modal show" tabIndex={-1} role="dialog" style={{ display: 'block' }}>
              <div className="modal-dialog modal-xl" role="document" onClick={(e) => e.stopPropagation()}>
                <div
                  className="modal-content"
                  style={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
                >
                  <div
                    className="modal-header"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      borderRadius: '20px 20px 0 0',
                      border: 'none',
                      padding: '1.5rem 2rem',
                    }}
                  >
                    <h4 className="mb-0">
                      <i className="fas fa-calendar-alt me-3" />
                      รายละเอียดกิจกรรม
                    </h4>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={closeModal}
                      style={{ fontSize: '1.2rem' }}
                    />
                  </div>

                  <div className="modal-body" style={{ padding: '2rem' }}>
                    <div className="row">
                      {/* Left */}
                      <div className="col-lg-8">
                        <div
                          className="activity-info-card"
                          style={{
                            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                            borderRadius: '15px',
                            padding: '2rem',
                            marginBottom: '2rem',
                          }}
                        >
                          <h2 className="mb-3" style={{ color: '#2c3e50', fontWeight: 700, fontSize: '2rem' }}>
                            {selectedActivity?.title || '-'}
                          </h2>

                          <p className="text-muted mb-4" style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                            {selectedActivity?.description || '-'}
                          </p>

                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <div className="info-item">
                                <i className="fas fa-calendar text-primary me-2" />
                                <strong>วันที่จัด:</strong>
                                <br />
                                <span className="text-muted">
                                  {formatDate(selectedActivity?.start_date)} - {formatDate(selectedActivity?.end_date)}
                                </span>
                              </div>
                            </div>
                            <div className="col-md-6 mb-3">
                              <div className="info-item">
                                <i className="fas fa-map-marker-alt text-success me-2" />
                                <strong>สถานที่:</strong>
                                <br />
                                <span className="text-muted">{selectedActivity?.location || '-'}</span>
                              </div>
                            </div>
                            <div className="col-md-6 mb-3">
                              <div className="info-item">
                                <i className="fas fa-clock text-warning me-2" />
                                <strong>ชั่วโมงที่ได้รับ:</strong>
                                <br />
                                <span className="badge bg-info text-dark" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                                  {selectedActivity?.hours_awarded ?? 0} ชั่วโมง
                                </span>
                              </div>
                            </div>
                            <div className="col-md-6 mb-3">
                              <div className="info-item">
                                <i className="fas fa-info-circle text-info me-2" />
                                <strong>สถานะ:</strong>
                                <br />
                                <span
                                  className={`badge ${getStatusBadge(selectedActivity?.status)}`}
                                  style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}
                                >
                                  {getStatusText(selectedActivity?.status)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Participants */}
                        <div className="participants-section">
                          <h5 className="mb-3" style={{ color: '#2c3e50' }}>
                            <i className="fas fa-users me-2" />
                            ผู้เข้าร่วม ({participants?.length || 0} คน)
                          </h5>
                          <div className="table-responsive">
                            <table
                              className="table table-hover"
                              style={{ borderRadius: '10px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}
                            >
                              <thead
                                style={{
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                }}
                              >
                                <tr>
                                  <th><i className="fas fa-user me-1" />ชื่อ</th>
                                  <th><i className="fas fa-id-card me-1" />รหัสนักเรียน</th>
                                  <th><i className="fas fa-envelope me-1" />อีเมล</th>
                                  <th><i className="fas fa-calendar me-1" />วันที่ลงทะเบียน</th>
                                </tr>
                              </thead>
                              <tbody>
                                {participants && participants.length > 0 ? (
                                  participants.map((p) => {
                                    // สมมุติรูปแบบข้อมูล: มี name/email/student_code หรือใช้ identifier_type/value
                                    const name = p.name || p.full_name || (p.identifier_type === 'NAME' ? p.identifier_value : '-') || '-'
                                    const studentCode =
                                      p.student_code ||
                                      (p.identifier_type === 'STUDENT_CODE' ? p.identifier_value : '-') ||
                                      '-'
                                    const email =
                                      p.email || (p.identifier_type === 'EMAIL' ? p.identifier_value : '-') || '-'
                                    return (
                                      <tr key={p.id ?? `${p.identifier_type}-${p.identifier_value}-${p.created_at}`}>
                                        <td>{name}</td>
                                        <td>{studentCode}</td>
                                        <td>{email}</td>
                                        <td>{formatDate(p.created_at)}</td>
                                      </tr>
                                    )
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={4} className="text-center text-muted py-4">
                                      <i className="fas fa-users fa-2x mb-2" />
                                      <br />
                                      ยังไม่มีผู้เข้าร่วม
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Right */}
                      <div className="col-lg-4">
                        <div
                          className="qr-section"
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '20px',
                            padding: '2rem',
                            color: 'white',
                            textAlign: 'center',
                            position: 'sticky',
                            top: '2rem',
                          }}
                        >
                          <h5 className="mb-4">
                            <i className="fas fa-qrcode me-2" />
                            QR Code สำหรับลงทะเบียน
                          </h5>

                          {qrCode ? (
                            <div>
                              <div
                                style={{
                                  background: 'white',
                                  borderRadius: '15px',
                                  padding: '1.5rem',
                                  marginBottom: '1.5rem',
                                  display: 'inline-block',
                                }}
                              >
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`}
                                  alt="QR Code"
                                  style={{ maxWidth: 200, width: '100%', height: 'auto' }}
                                />
                              </div>

                              <p className="mb-3" style={{ fontSize: '0.9rem' }}>
                                <i className="fas fa-mobile-alt me-1" />
                                สแกน QR Code เพื่อลงทะเบียนกิจกรรม
                              </p>

                              <div
                                className="mb-3"
                                style={{
                                  background: 'rgba(255,255,255,0.1)',
                                  borderRadius: '10px',
                                  padding: '1rem',
                                  fontSize: '0.8rem',
                                  wordBreak: 'break-all',
                                }}
                              >
                                <strong>ลิงก์ลงทะเบียน:</strong>
                                <br />
                                <code style={{ color: '#fff' }}>{qrCode}</code>
                              </div>

                              <div className="d-grid gap-2">
                                <a
                                  href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrCode)}`}
                                  download={`qr-${(selectedActivity?.title || 'activity').replace(/[^a-zA-Z0-9ก-๙]/g, '-')}.png`}
                                  className="btn btn-light btn-sm"
                                  style={{ borderRadius: '10px' }}
                                >
                                  <i className="fas fa-download me-2" />
                                  ดาวน์โหลด QR Code
                                </a>

                                <button
                                  className="btn btn-outline-light btn-sm"
                                  style={{ borderRadius: '10px' }}
                                  onClick={() => {
                                    navigator.clipboard.writeText(qrCode)
                                    setSuccess('คัดลอกลิงก์ลงทะเบียนแล้ว!')
                                    setTimeout(() => setSuccess(''), 3000)
                                  }}
                                >
                                  <i className="fas fa-copy me-2" />
                                  คัดลอกลิงก์
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <i className="fas fa-qrcode fa-3x mb-3" style={{ opacity: 0.5 }} />
                              <p>กำลังสร้าง QR Code...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="modal-footer"
                    style={{ background: '#f8f9fa', borderRadius: '0 0 20px 20px', border: 'none', padding: '1.5rem 2rem' }}
                  >
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={closeModal}
                      style={{ borderRadius: '10px', padding: '0.5rem 1.5rem' }}
                    >
                      <i className="fas fa-times me-2" />
                      ปิด
                    </button>
                    <button
                      type="button"
                      className={`btn ${selectedActivity?.status === 'OPEN' ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => toggleActivityStatus(selectedActivity.id, selectedActivity.status)}
                      style={{ borderRadius: '10px', padding: '0.5rem 1.5rem' }}
                    >
                      <i className={`fas ${selectedActivity?.status === 'OPEN' ? 'fa-pause' : 'fa-play'} me-2`} />
                      {selectedActivity?.status === 'OPEN' ? 'ปิดรับสมัคร' : 'เปิดรับสมัคร'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ActivityManagement
