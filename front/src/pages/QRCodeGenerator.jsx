import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'

const QRCodeGenerator = () => {
  const [searchParams] = useSearchParams()
  const [activities, setActivities] = useState([])
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchActivities()
    
    // Check if activity ID is provided in URL
    const activityId = searchParams.get('activity')
    if (activityId) {
      setSelectedActivity(activityId)
    }
  }, [searchParams])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/activities')
      if (response.data.success) {
        setActivities(response.data.data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      setError('ไม่สามารถโหลดกิจกรรมได้')
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = async () => {
    if (!selectedActivity) {
      setError('กรุณาเลือกกิจกรรม')
      return
    }

    try {
      setGenerating(true)
      setError('')
      
      const response = await api.post('/admin/qr-generate', {
        activity_id: selectedActivity
      })
      
      if (response.data.success) {
        setQrCodeUrl(response.data.data.qr_code_url)
      } else {
        setError(response.data.message || 'ไม่สามารถสร้าง QR Code ได้')
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
      setError(error.response?.data?.message || 'ไม่สามารถสร้าง QR Code ได้')
    } finally {
      setGenerating(false)
    }
  }

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.href = qrCodeUrl
      link.download = `qr-code-activity-${selectedActivity}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const copyToClipboard = () => {
    if (qrCodeUrl) {
      navigator.clipboard.writeText(qrCodeUrl).then(() => {
        alert('คัดลอกลิงก์แล้ว!')
      }).catch(() => {
        alert('ไม่สามารถคัดลอกได้')
      })
    }
  }

  const getActivityById = (id) => {
    return activities.find(activity => activity.id === parseInt(id))
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="text-center" style={{ padding: '40px 20px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">กำลังโหลด...</span>
            </div>
            <div className="mt-3">กำลังโหลดกิจกรรม...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>สร้าง QR Code</h1>
          <p>สร้าง QR Code สำหรับกิจกรรมเพื่อให้ผู้เข้าร่วมเช็คอิน</p>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        <div className="row">
          <div className="col-md-6">
            <div className="form-container">
              <div className="form-header">
                <h2>เลือกกิจกรรม</h2>
                <p>เลือกกิจกรรมที่ต้องการสร้าง QR Code</p>
              </div>

              <div className="form-group">
                <label htmlFor="activity" className="form-label">
                  <i className="fas fa-calendar-alt me-2"></i>กิจกรรม *
                </label>
                <select
                  className="form-select"
                  id="activity"
                  value={selectedActivity || ''}
                  onChange={(e) => setSelectedActivity(e.target.value)}
                  required
                >
                  <option value="">เลือกกิจกรรม</option>
                  {activities
                    .filter(activity => activity.status === 'OPEN')
                    .map(activity => (
                      <option key={activity.id} value={activity.id}>
                        {activity.title} - {activity.hours_awarded} ชั่วโมง
                      </option>
                    ))
                  }
                </select>
              </div>

              {selectedActivity && getActivityById(selectedActivity) && (
                <div className="card bg-light">
                  <div className="card-body">
                    <h6 className="card-title">ข้อมูลกิจกรรม</h6>
                    <p className="card-text">
                      <strong>ชื่อ:</strong> {getActivityById(selectedActivity).title}<br/>
                      <strong>ชั่วโมง:</strong> {getActivityById(selectedActivity).hours_awarded} ชั่วโมง<br/>
                      <strong>สถานะ:</strong> <span className="badge bg-success">เปิดรับสมัคร</span><br/>
                      <strong>ผู้เข้าร่วม:</strong> {getActivityById(selectedActivity).participant_count || 0} คน
                    </p>
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={generateQRCode}
                  disabled={!selectedActivity || generating}
                >
                  {generating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      กำลังสร้าง...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-qrcode me-2"></i>
                      สร้าง QR Code
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            {qrCodeUrl ? (
              <div className="content-card">
                <h3>QR Code ที่สร้างแล้ว</h3>
                <div className="text-center">
                  <div className="mb-3">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="img-fluid border rounded"
                      style={{ maxWidth: '300px' }}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-muted small">
                      ลิงก์เช็คอิน: <br/>
                      <code className="bg-light p-2 rounded d-block mt-2">
                        {qrCodeUrl}
                      </code>
                    </p>
                  </div>

                  <div className="d-flex gap-2 justify-content-center">
                    <button
                      className="btn btn-outline-primary"
                      onClick={copyToClipboard}
                    >
                      <i className="fas fa-copy me-2"></i>
                      คัดลอกลิงก์
                    </button>
                    <button
                      className="btn btn-outline-success"
                      onClick={downloadQRCode}
                    >
                      <i className="fas fa-download me-2"></i>
                      ดาวน์โหลด
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="content-card">
                <div className="empty-state">
                  <i className="fas fa-qrcode"></i>
                  <h5>ยังไม่มี QR Code</h5>
                  <p>เลือกกิจกรรมและกดปุ่ม "สร้าง QR Code" เพื่อเริ่มต้น</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="content-card">
          <h3>วิธีใช้งาน QR Code</h3>
          <div className="row">
            <div className="col-md-4">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <i className="fas fa-mobile-alt fa-2x text-primary mb-3"></i>
                  <h6>1. แสกน QR Code</h6>
                  <p className="small text-muted">
                    ผู้เข้าร่วมใช้มือถือแสกน QR Code เพื่อเข้าสู่หน้าจอเช็คอิน
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <i className="fas fa-user-check fa-2x text-success mb-3"></i>
                  <h6>2. กรอกข้อมูล</h6>
                  <p className="small text-muted">
                    กรอกชื่อและรหัสนักเรียนเพื่อยืนยันตัวตน
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <i className="fas fa-check-circle fa-2x text-info mb-3"></i>
                  <h6>3. เช็คอินสำเร็จ</h6>
                  <p className="small text-muted">
                    ระบบจะบันทึกการเข้าร่วมและแสดงผลการเช็คอิน
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRCodeGenerator