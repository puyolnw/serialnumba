import { useState, useEffect } from 'react'
import api from '../services/api'

const SerialSending = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [participants, setParticipants] = useState([])
  const [sendingSerials, setSendingSerials] = useState(new Set())
  const [filter, setFilter] = useState('pending')

  useEffect(() => {
    fetchActivitiesWithParticipants()
  }, [])

  const fetchActivitiesWithParticipants = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/activities')
      console.log('Activities response:', response.data)
      if (response.data.success) {
        const activitiesData = response.data.data.activities || []
        console.log('Activities data:', activitiesData)
        
        // Fetch participants for each activity
        const activitiesWithParticipants = await Promise.all(
          activitiesData.map(async (activity) => {
            try {
              const participantsResponse = await api.get(`/admin/activities/${activity.id}/participants`)
              console.log(`Participants for activity ${activity.id}:`, participantsResponse.data)
              const participants = participantsResponse.data.success ? 
                participantsResponse.data.data.participants || [] : []
              
              console.log(`🔍 [FRONTEND] Raw participants data for activity ${activity.id}:`, participants.map(p => ({
                id: p.id,
                identifier_value: p.identifier_value,
                serial_sent: p.serial_sent,
                serial_sent_at: p.serial_sent_at,
                fullData: p
              })));
              
              // Use serial_sent status from checkin data
              const participantsWithSerials = participants.map(participant => ({
                ...participant,
                hasSerial: participant.serial_sent || false
              }))
              
              console.log(`✅ [FRONTEND] Processed participants for activity ${activity.id}:`, participantsWithSerials.map(p => ({
                id: p.id,
                identifier_value: p.identifier_value,
                hasSerial: p.hasSerial,
                serial_sent: p.serial_sent
              })));
              
              return {
                ...activity,
                participants: participantsWithSerials,
                pendingCount: participantsWithSerials.filter(p => !p.hasSerial).length
              }
            } catch (error) {
              return {
                ...activity,
                participants: [],
                pendingCount: 0
              }
            }
          })
        )
        
        setActivities(activitiesWithParticipants)
        console.log('Final activities with participants:', activitiesWithParticipants)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      setError('ไม่สามารถโหลดข้อมูลกิจกรรมได้')
    } finally {
      setLoading(false)
    }
  }

  const sendSerialToParticipant = async (activityId, participantId, method = 'email') => {
    try {
      console.log('🔵 [FRONTEND] Sending serial request to /serials/send:', {
        activity_id: activityId,
        participant_id: participantId,
        method: method,
        timestamp: new Date().toISOString()
      });
      
      setSendingSerials(prev => new Set([...prev, `${activityId}-${participantId}`]))
      
      const response = await api.post('/serials/send', {
        activity_id: activityId,
        participant_id: participantId,
        method: method
      })
      
      console.log('📥 [FRONTEND] Received response:', response.data);
      
      if (response.data.success) {
        console.log('✅ [FRONTEND] Success response data:', response.data.data);
        const serialCode = response.data.data?.code || 'N/A'
        const emailSent = response.data.data?.email_sent
        
        console.log('📊 [FRONTEND] Extracted data:', {
          serialCode,
          emailSent,
          fullData: response.data.data
        });
        
        setSuccess(`✅ ส่งซีเรียลสำเร็จ! รหัส: ${serialCode}${emailSent ? ' (อีเมลส่งแล้ว)' : ''}`)
        await fetchActivitiesWithParticipants() // Refresh data
        // Update selectedActivity with fresh data
        if (selectedActivity) {
          const updatedActivity = activities.find(a => a.id === selectedActivity.id)
          if (updatedActivity) {
            setSelectedActivity(updatedActivity)
          }
        }
      } else {
        console.log('❌ [FRONTEND] Error response:', response.data);
        setError(response.data.message || 'ไม่สามารถส่งซีเรียลได้')
      }
    } catch (error) {
      console.error('Error sending serial:', error)
      const errorMessage = error.response?.data?.message || 'ไม่สามารถส่งซีเรียลได้'
      
      // If serial already exists, refresh data to update status
      if (errorMessage.includes('Serial already exists')) {
        console.log('🔄 [FRONTEND] Serial already exists - refreshing data to update status')
        await fetchActivitiesWithParticipants() // Refresh data to show updated status
        // Update selectedActivity with fresh data
        if (selectedActivity) {
          const updatedActivity = activities.find(a => a.id === selectedActivity.id)
          if (updatedActivity) {
            setSelectedActivity(updatedActivity)
          }
        }
        setSuccess('✅ ซีเรียลมีอยู่แล้ว - อัปเดตสถานะแล้ว')
      } else {
        setError(errorMessage)
      }
    } finally {
      setSendingSerials(prev => {
        const newSet = new Set(prev)
        newSet.delete(`${activityId}-${participantId}`)
        return newSet
      })
    }
  }

  const sendSerialsToAll = async (activityId, method = 'email') => {
    const activity = activities.find(a => a.id === activityId)
    if (!activity) return
    
    const pendingParticipants = activity.participants.filter(p => !p.hasSerial)
    
    try {
      setSendingSerials(prev => new Set([...prev, `all-${activityId}`]))
      
      const promises = pendingParticipants.map(participant =>
        api.post('/serials/generate', {
          activity_id: activityId,
          participant_id: participant.id,
          method: method
        })
      )
      
      const results = await Promise.allSettled(promises)
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.data.success).length
      const failedCount = pendingParticipants.length - successCount
      
      if (successCount > 0) {
        const successResults = results.filter(r => r.status === 'fulfilled' && r.value.data.success)
        const serialCodes = successResults.map(r => r.value.data.data?.code).filter(Boolean).slice(0, 3)
        const codesText = serialCodes.length > 0 ? ` รหัส: ${serialCodes.join(', ')}${serialCodes.length < successCount ? '...' : ''}` : ''
        setSuccess(`✅ ส่งซีเรียลสำเร็จ ${successCount}/${pendingParticipants.length} คน${codesText}${failedCount > 0 ? ` (ล้มเหลว ${failedCount} คน)` : ''}`)
      } else {
        setError(`❌ ส่งซีเรียลล้มเหลวทั้งหมด ${pendingParticipants.length} คน`)
      }
      await fetchActivitiesWithParticipants() // Refresh data
      // Update selectedActivity with fresh data
      if (selectedActivity) {
        const updatedActivity = activities.find(a => a.id === selectedActivity.id)
        if (updatedActivity) {
          setSelectedActivity(updatedActivity)
        }
      }
    } catch (error) {
      console.error('Error sending serials to all:', error)
      setError('ไม่สามารถส่งซีเรียลให้ทุกคนได้')
    } finally {
      setSendingSerials(prev => {
        const newSet = new Set(prev)
        newSet.delete(`all-${activityId}`)
        return newSet
      })
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      'OPEN': 'badge-success',
      'DRAFT': 'badge-warning',
      'CANCELLED': 'badge-danger',
      'COMPLETED': 'badge-info'
    }
    return badges[status] || 'badge-secondary'
  }

  const getStatusText = (status) => {
    const texts = {
      'OPEN': 'เปิดรับสมัคร',
      'DRAFT': 'ร่าง',
      'CANCELLED': 'ยกเลิก',
      'COMPLETED': 'เสร็จสิ้น'
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
    if (filter === 'pending') {
      return activity.pendingCount > 0
    } else if (filter === 'completed') {
      return activity.pendingCount === 0 && activity.participants.length > 0
    }
    return true
  })

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
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
              <h1 className="h3 mb-1">ส่งซีเรียล</h1>
              <p className="text-muted mb-0">ส่งรหัสซีเรียลให้ผู้เข้าร่วมกิจกรรม</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError('')}
            ></button>
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert">
            <i className="fas fa-check-circle me-2"></i>
            {success}
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccess('')}
            ></button>
          </div>
        )}

        <div className="content-card">
          <div className="table-header">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="mb-1">📧 จัดการส่งซีเรียล</h5>
                <p className="text-muted mb-0">ส่งรหัสซีเรียลให้ผู้เข้าร่วมกิจกรรม</p>
              </div>
              <div className="d-flex gap-2">
                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '150px' }}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="pending">🔔 รอส่งซีเรียล</option>
                  <option value="completed">✅ ส่งครบแล้ว</option>
                  <option value="all">📋 ทั้งหมด</option>
                </select>
              </div>
            </div>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="empty-state text-center py-5">
              <i className="fas fa-check-circle fa-4x text-success mb-4"></i>
              <h4 className="text-success">🎉 ไม่มีกิจกรรมที่ต้องส่งซีเรียล</h4>
              <p className="text-muted fs-5">ทุกกิจกรรมได้ส่งซีเรียลครบแล้ว</p>
            </div>
          ) : (
            <div className="row g-4">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="col-lg-6 col-xl-4">
                  <div className="card h-100 shadow-sm border-0" style={{
                    borderRadius: '15px',
                    transition: 'all 0.3s ease',
                    border: activity.pendingCount > 0 ? '2px solid #ffc107' : '2px solid #28a745'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                  }}>
                    <div className="card-header bg-gradient text-white" style={{
                      background: activity.pendingCount > 0 
                        ? 'linear-gradient(135deg, #ffc107 0%, #ff8c00 100%)' 
                        : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                      borderRadius: '15px 15px 0 0',
                      border: 'none'
                    }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 fw-bold text-truncate" style={{ maxWidth: '200px' }}>
                          {activity.title}
                        </h6>
                        <span className={`badge ${getStatusBadge(activity.status)} px-2 py-1`}>
                          {getStatusText(activity.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="card-body p-4">
                      {/* Activity Info */}
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-calendar-alt text-primary me-2"></i>
                          <small className="text-muted">{formatDate(activity.start_date)}</small>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-clock text-info me-2"></i>
                          <small className="text-muted">{activity.hours_awarded} ชั่วโมง</small>
                        </div>
                      </div>
                      
                      {/* Statistics */}
                      <div className="mb-4">
                        <div className="row g-2 text-center">
                          <div className="col-4">
                            <div className="p-2 rounded" style={{ backgroundColor: '#e3f2fd' }}>
                              <div className="h5 mb-0 text-primary fw-bold">{activity.participants.length}</div>
                              <small className="text-muted d-block">ลงทะเบียน</small>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="p-2 rounded" style={{ backgroundColor: '#e8f5e8' }}>
                              <div className="h5 mb-0 text-success fw-bold">{activity.participants.filter(p => p.hasSerial).length}</div>
                              <small className="text-muted d-block">ส่งแล้ว</small>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="p-2 rounded" style={{ backgroundColor: '#fff3cd' }}>
                              <div className="h5 mb-0 text-warning fw-bold">{activity.pendingCount}</div>
                              <small className="text-muted d-block">รอส่ง</small>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small className="text-muted">ความคืบหน้า</small>
                          <small className="text-muted">
                            {activity.participants.length > 0 
                              ? Math.round((activity.participants.filter(p => p.hasSerial).length / activity.participants.length) * 100)
                              : 0}%
                          </small>
                        </div>
                        <div className="progress" style={{ height: '8px', borderRadius: '10px' }}>
                          <div 
                            className="progress-bar bg-success" 
                            style={{ 
                              width: `${activity.participants.length > 0 
                                ? (activity.participants.filter(p => p.hasSerial).length / activity.participants.length) * 100
                                : 0}%`,
                              borderRadius: '10px'
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {activity.pendingCount > 0 ? (
                        <div className="d-grid gap-2">
                          <button
                            className="btn btn-warning btn-sm fw-bold"
                            onClick={() => sendSerialsToAll(activity.id, 'email')}
                            disabled={sendingSerials.has(`all-${activity.id}`)}
                            style={{ borderRadius: '10px' }}
                          >
                            {sendingSerials.has(`all-${activity.id}`) ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                กำลังส่ง...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-paper-plane me-2"></i>
                                ส่งให้ทุกคน ({activity.pendingCount} คน)
                              </>
                            )}
                          </button>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => setSelectedActivity(activity)}
                            style={{ borderRadius: '10px' }}
                          >
                            <i className="fas fa-list me-2"></i>
                            ดูรายละเอียด
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="badge bg-success fs-6 px-3 py-2">
                            <i className="fas fa-check-circle me-2"></i>
                            ส่งครบแล้ว
                          </div>
                          <button
                            className="btn btn-outline-secondary btn-sm mt-2 w-100"
                            onClick={() => setSelectedActivity(activity)}
                            style={{ borderRadius: '10px' }}
                          >
                            <i className="fas fa-eye me-2"></i>
                            ดูรายละเอียด
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Participant Details Modal */}
        {selectedActivity && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl">
              <div className="modal-content" style={{ borderRadius: '15px', border: 'none' }}>
                <div className="modal-header bg-gradient text-white" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '15px 15px 0 0',
                  border: 'none'
                }}>
                  <div className="flex-grow-1">
                    <h4 className="modal-title fw-bold">
                      <i className="fas fa-users me-2"></i>
                      รายชื่อผู้เข้าร่วม
                    </h4>
                    <h6 className="mb-0 opacity-75">{selectedActivity.title}</h6>
                    <div className="d-flex gap-3 mt-3">
                      <span className="badge bg-primary px-3 py-2">
                        <i className="fas fa-user-plus me-1"></i>
                        ลงทะเบียน {selectedActivity.participants.length} คน
                      </span>
                      <span className="badge bg-success px-3 py-2">
                        <i className="fas fa-check me-1"></i>
                        ส่งแล้ว {selectedActivity.participants.filter(p => p.hasSerial).length} คน
                      </span>
                      <span className="badge bg-warning px-3 py-2">
                        <i className="fas fa-clock me-1"></i>
                        รอส่ง {selectedActivity.pendingCount} คน
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setSelectedActivity(null)}
                    style={{ fontSize: '1.2rem' }}
                  ></button>
                </div>
                <div className="modal-body p-4">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th className="fw-bold">👤 ชื่อ-นามสกุล</th>
                          <th className="fw-bold">🎓 รหัสนิสิต</th>
                          <th className="fw-bold">📧 อีเมล</th>
                          <th className="fw-bold text-center">📊 สถานะ</th>
                          <th className="fw-bold text-center">📅 วันที่ส่ง</th>
                          <th className="fw-bold text-center">⚡ จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedActivity.participants.map((participant, index) => (
                          <tr key={participant.id} className={index % 2 === 0 ? 'table-light' : ''}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '35px', height: '35px', fontSize: '14px' }}>
                                  {participant.name ? participant.name.charAt(0).toUpperCase() : participant.identifier_value.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="fw-bold">{participant.name || participant.identifier_value}</div>
                                  {participant.identifier_type !== 'EMAIL' && (
                                    <small className="text-muted">
                                      ({participant.identifier_type === 'USERNAME' ? 'Username' : 'Student Code'})
                                    </small>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-info text-dark">
                                {participant.student_code || '-'}
                              </span>
                            </td>
                            <td>
                              <small className="text-muted">{participant.email || participant.identifier_value}</small>
                            </td>
                            <td className="text-center">
                              {participant.hasSerial ? (
                                <span className="badge bg-success px-3 py-2">
                                  <i className="fas fa-check me-1"></i>ส่งแล้ว
                                </span>
                              ) : (
                                <span className="badge bg-warning px-3 py-2">
                                  <i className="fas fa-clock me-1"></i>รอส่ง
                                </span>
                              )}
                            </td>
                            <td className="text-center">
                              {participant.serial_sent_at ? (
                                <small className="text-success fw-bold">
                                  {formatDate(participant.serial_sent_at)}
                                </small>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="text-center">
                              {!participant.hasSerial ? (
                                <button
                                  className="btn btn-warning btn-sm px-3"
                                  onClick={() => sendSerialToParticipant(selectedActivity.id, participant.id, 'email')}
                                  disabled={sendingSerials.has(`${selectedActivity.id}-${participant.id}`)}
                                  style={{ borderRadius: '20px' }}
                                >
                                  {sendingSerials.has(`${selectedActivity.id}-${participant.id}`) ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                      กำลังส่ง...
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-paper-plane me-2"></i>
                                      ส่งซีเรียล
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span className="text-success">
                                  <i className="fas fa-check-circle"></i>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedActivity(null)}
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        <div className="content-card mt-4">
          <div className="table-header">
            <h5 className="mb-4">
              <i className="fas fa-chart-pie me-2 text-primary"></i>
              📊 สรุปสถิติการส่งซีเรียล
            </h5>
          </div>
          <div className="row g-4">
            <div className="col-md-3">
              <div className="text-center p-4 rounded" style={{ backgroundColor: '#e3f2fd', borderRadius: '15px' }}>
                <div className="display-6 mb-2 text-primary">
                  <i className="fas fa-users"></i>
                </div>
                <div className="h3 mb-1 text-primary fw-bold">
                  {activities.reduce((sum, activity) => sum + activity.participants.length, 0)}
                </div>
                <small className="text-muted fw-bold">ผู้ลงทะเบียนทั้งหมด</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center p-4 rounded" style={{ backgroundColor: '#e8f5e8', borderRadius: '15px' }}>
                <div className="display-6 mb-2 text-success">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="h3 mb-1 text-success fw-bold">
                  {activities.reduce((sum, activity) => sum + activity.participants.filter(p => p.hasSerial).length, 0)}
                </div>
                <small className="text-muted fw-bold">ส่งซีเรียลแล้ว</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center p-4 rounded" style={{ backgroundColor: '#fff3cd', borderRadius: '15px' }}>
                <div className="display-6 mb-2 text-warning">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="h3 mb-1 text-warning fw-bold">
                  {activities.reduce((sum, activity) => sum + activity.pendingCount, 0)}
                </div>
                <small className="text-muted fw-bold">รอส่งซีเรียล</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center p-4 rounded" style={{ backgroundColor: '#f0f8ff', borderRadius: '15px' }}>
                <div className="display-6 mb-2 text-info">
                  <i className="fas fa-calendar-alt"></i>
                </div>
                <div className="h3 mb-1 text-info fw-bold">
                  {activities.length}
                </div>
                <small className="text-muted fw-bold">กิจกรรมทั้งหมด</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SerialSending
