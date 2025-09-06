import { useState, useEffect } from 'react'
import api from '../services/api'

const StaffSerialSending = () => {
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
      <div className="staff-dashboard">
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
    <div className="staff-dashboard">
      <div className="container">
        <div className="staff-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">ส่งเมลซีเรียล</h1>
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
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">กิจกรรมที่รอส่งซีเรียล</h5>
              <div className="d-flex gap-2">
                <select
                  className="form-select"
                  style={{ width: 'auto' }}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="pending">รอส่งซีเรียล</option>
                  <option value="completed">ส่งครบแล้ว</option>
                  <option value="all">ทั้งหมด</option>
                </select>
              </div>
            </div>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
              <h5>ไม่มีกิจกรรมที่ต้องส่งซีเรียล</h5>
              <p className="text-muted">ทุกกิจกรรมได้ส่งซีเรียลครบแล้ว</p>
            </div>
          ) : (
            <div className="row">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">{activity.title}</h6>
                      <span className={`badge ${getStatusBadge(activity.status)}`}>
                        {getStatusText(activity.status)}
                      </span>
                    </div>
                    <div className="card-body">
                      <div className="mb-2">
                        <small className="text-muted">
                          <i className="fas fa-calendar me-1"></i>
                          {formatDate(activity.start_date)}
                        </small>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">
                          <i className="fas fa-map-marker-alt me-1"></i>
                          {activity.location || 'ไม่ระบุสถานที่'}
                        </small>
                      </div>
                      <div className="mb-3">
                        <small className="text-muted">
                          <i className="fas fa-clock me-1"></i>
                          {activity.hours_awarded} ชั่วโมง
                        </small>
                      </div>
                      
                      <div className="mb-3">
                        <div className="row text-center">
                          <div className="col-4">
                            <div className="border-end">
                              <div className="h6 mb-0 text-primary">{activity.participants.length}</div>
                              <small className="text-muted">ลงทะเบียน</small>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="border-end">
                              <div className="h6 mb-0 text-success">{activity.participants.filter(p => p.hasSerial).length}</div>
                              <small className="text-muted">ส่งแล้ว</small>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="h6 mb-0 text-warning">{activity.pendingCount}</div>
                            <small className="text-muted">รอส่ง</small>
                          </div>
                        </div>
                      </div>

                      {activity.pendingCount > 0 && (
                        <div className="d-grid gap-2">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => sendSerialsToAll(activity.id, 'email')}
                            disabled={sendingSerials.has(`all-${activity.id}`)}
                          >
                            {sendingSerials.has(`all-${activity.id}`) ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                กำลังส่ง...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-envelope me-2"></i>
                                ส่งให้ทุกคน (อีเมล)
                              </>
                            )}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setSelectedActivity(activity)}
                          >
                            <i className="fas fa-list me-2"></i>
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
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title">
                      <i className="fas fa-users me-2"></i>
                      รายชื่อผู้เข้าร่วม - {selectedActivity.title}
                    </h5>
                    <div className="d-flex gap-3 mt-2">
                      <span className="badge bg-primary">
                        <i className="fas fa-user-plus me-1"></i>
                        ลงทะเบียน {selectedActivity.participants.length} คน
                      </span>
                      <span className="badge bg-success">
                        <i className="fas fa-check me-1"></i>
                        ส่งแล้ว {selectedActivity.participants.filter(p => p.hasSerial).length} คน
                      </span>
                      <span className="badge bg-warning">
                        <i className="fas fa-clock me-1"></i>
                        รอส่ง {selectedActivity.pendingCount} คน
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setSelectedActivity(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>ชื่อ</th>
                          <th>รหัสนักเรียน</th>
                          <th>อีเมล</th>
                          <th>สถานะซีเรียล</th>
                          <th>วันที่ส่ง</th>
                          <th>จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedActivity.participants.map((participant) => (
                          <tr key={participant.id}>
                            <td>
                              {participant.name || participant.identifier_value}
                              {participant.identifier_type !== 'EMAIL' && (
                                <small className="text-muted d-block">
                                  ({participant.identifier_type === 'USERNAME' ? 'Username' : 'Student Code'})
                                </small>
                              )}
                            </td>
                            <td>{participant.student_code || '-'}</td>
                            <td>{participant.email || participant.identifier_value}</td>
                            <td>
                              {participant.hasSerial ? (
                                <span className="badge badge-success">ส่งแล้ว</span>
                              ) : (
                                <span className="badge badge-warning">รอส่ง</span>
                              )}
                            </td>
                            <td>
                              {participant.serial_sent_at ? (
                                <small className="text-muted">
                                  {formatDate(participant.serial_sent_at)}
                                </small>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {!participant.hasSerial && (
                                <div className="btn-group" role="group">
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => sendSerialToParticipant(selectedActivity.id, participant.id, 'email')}
                                    disabled={sendingSerials.has(`${selectedActivity.id}-${participant.id}`)}
                                    title="ส่งทางอีเมล"
                                  >
                                    {sendingSerials.has(`${selectedActivity.id}-${participant.id}`) ? (
                                      <span className="spinner-border spinner-border-sm" role="status"></span>
                                    ) : (
                                      <>
                                        <i className="fas fa-envelope"></i> อีเมล
                                      </>
                                    )}
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => sendSerialToParticipant(selectedActivity.id, participant.id, 'account')}
                                    disabled={sendingSerials.has(`${selectedActivity.id}-${participant.id}`)}
                                    title="ส่งไปบัญชี"
                                  >
                                    <i className="fas fa-user"></i> บัญชี
                                  </button>
                                </div>
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
            <h5 className="mb-3">
              <i className="fas fa-chart-bar me-2"></i>
              สรุปสถิติการส่งซีเรียล
            </h5>
          </div>
          <div className="row text-center">
            <div className="col-md-3">
              <div className="border-end">
                <div className="h4 mb-0 text-primary">
                  {activities.reduce((sum, activity) => sum + activity.participants.length, 0)}
                </div>
                <small className="text-muted">ผู้ลงทะเบียนทั้งหมด</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border-end">
                <div className="h4 mb-0 text-success">
                  {activities.reduce((sum, activity) => sum + activity.participants.filter(p => p.hasSerial).length, 0)}
                </div>
                <small className="text-muted">ส่งซีเรียลแล้ว</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border-end">
                <div className="h4 mb-0 text-warning">
                  {activities.reduce((sum, activity) => sum + activity.pendingCount, 0)}
                </div>
                <small className="text-muted">รอส่งซีเรียล</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="h4 mb-0 text-info">
                {activities.length}
              </div>
              <small className="text-muted">กิจกรรมทั้งหมด</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffSerialSending
