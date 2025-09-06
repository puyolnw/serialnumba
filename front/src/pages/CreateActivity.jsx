import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const CreateActivity = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    activity_date: '',
    start_time: '',
    end_time: '',
    hours_awarded: '',
    location: '',
    max_participants: '',
    status: 'OPEN'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [createdActivity, setCreatedActivity] = useState(null)
  const [checkinUrl, setCheckinUrl] = useState('')
  
  const navigate = useNavigate()


  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
    if (success) setSuccess('')

    // Validate time range when time fields change
    if (name === 'start_time' || name === 'end_time') {
      setTimeout(() => {
        validateTimeRange()
      }, 100)
    }
  }

  // Validate time range
  const validateTimeRange = () => {
    // ตรวจสอบชั่วโมงเริ่มต้น (00-23)
    if (formData.start_time) {
      const startHour = parseInt(formData.start_time.split(':')[0])
      if (startHour < 0 || startHour > 23) {
        setError('ชั่วโมงเริ่มต้นต้องอยู่ระหว่าง 00-23')
        return false
      }
    }

    // ตรวจสอบนาทีเริ่มต้น (00-59)
    if (formData.start_time) {
      const startMinute = parseInt(formData.start_time.split(':')[1])
      if (startMinute < 0 || startMinute > 59) {
        setError('นาทีเริ่มต้นต้องอยู่ระหว่าง 00-59')
        return false
      }
    }

    // ตรวจสอบชั่วโมงสิ้นสุด (00-23)
    if (formData.end_time) {
      const endHour = parseInt(formData.end_time.split(':')[0])
      if (endHour < 0 || endHour > 23) {
        setError('ชั่วโมงสิ้นสุดต้องอยู่ระหว่าง 00-23')
        return false
      }
    }

    // ตรวจสอบนาทีสิ้นสุด (00-59)
    if (formData.end_time) {
      const endMinute = parseInt(formData.end_time.split(':')[1])
      if (endMinute < 0 || endMinute > 59) {
        setError('นาทีสิ้นสุดต้องอยู่ระหว่าง 00-59')
        return false
      }
    }

    // ตรวจสอบเวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น
    if (formData.start_time && formData.end_time) {
      const startTime = new Date(`2000-01-01T${formData.start_time}`)
      const endTime = new Date(`2000-01-01T${formData.end_time}`)
      
      if (endTime <= startTime) {
        setError('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น')
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validate time range before submitting
    if (!validateTimeRange()) {
      setLoading(false)
      return
    }

    try {
      // Combine date and time into datetime strings
      const startDateTime = `${formData.activity_date}T${formData.start_time}:00`
      const endDateTime = `${formData.activity_date}T${formData.end_time}:00`
      
      console.log('Creating activity with:', {
        title: formData.title,
        start_date: startDateTime,
        end_date: endDateTime,
        status: formData.status
      });
      
      // Create data object with combined datetime
      const submitData = {
        title: formData.title,
        description: formData.description,
        start_date: startDateTime,
        end_date: endDateTime,
        hours_awarded: parseFloat(formData.hours_awarded),
        location: formData.location,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        status: formData.status
      }

      const response = await api.post('/activities', submitData)
      
      if (response.data.success) {
        const activity = response.data.data.activity;
        const url = `${window.location.origin}/checkin/${activity.public_slug}`;
        
        setCreatedActivity(activity);
        setCheckinUrl(url);
        setSuccess('สร้างกิจกรรมสำเร็จ!')
        
        // Show QR code and URL
        console.log('Activity created:', activity);
        console.log('Checkin URL:', url);
        
        // Don't navigate immediately, show QR code first
      } else {
        setError(response.data.message || 'ไม่สามารถสร้างกิจกรรมได้')
      }
    } catch (error) {
      console.error('Create activity error:', error)
      setError(error.response?.data?.message || 'ไม่สามารถสร้างกิจกรรมได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>สร้างกิจกรรมใหม่</h1>
          <p>กรอกข้อมูลเพื่อสร้างกิจกรรมใหม่</p>
        </div>

          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {success}
              <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
            </div>
          )}

        <div className="form-container">
          <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-8">
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label">
                        <i className="fas fa-heading me-2"></i>ชื่อกิจกรรม *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="กรอกชื่อกิจกรรม"
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">
                        <i className="fas fa-align-left me-2"></i>รายละเอียด *
                      </label>
                      <textarea
                        className="form-control"
                        id="description"
                        name="description"
                        rows="4"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        placeholder="อธิบายรายละเอียดของกิจกรรม"
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label htmlFor="activity_date" className="form-label">
                            <i className="fas fa-calendar-alt me-2"></i>วันที่จัดกิจกรรม *
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            id="activity_date"
                            name="activity_date"
                            value={formData.activity_date}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label htmlFor="start_time" className="form-label">
                            <i className="fas fa-clock me-2"></i>เวลาเริ่มต้น *
                          </label>
                          <div className="time-input-group">
                            <input
                              type="text"
                              className="form-control time-hour"
                              placeholder="09"
                              maxLength="2"
                              value={formData.start_time ? formData.start_time.split(':')[0] || '' : ''}
                              onChange={(e) => {
                                const hour = e.target.value;
                                const minute = formData.start_time ? formData.start_time.split(':')[1] || '00' : '00';
                                
                                // อนุญาตให้กรอกได้แค่ตัวเลข และไม่เกิน 2 หลัก
                                if (hour === '' || /^[0-9]{1,2}$/.test(hour)) {
                                  setFormData(prev => ({
                                    ...prev,
                                    start_time: hour === '' ? `00:${minute}` : `${hour}:${minute}`
                                  }));
                                }
                              }}
                              required
                            />
                            <span className="time-separator">:</span>
                            <input
                              type="text"
                              className="form-control time-minute"
                              placeholder="00"
                              maxLength="2"
                              value={formData.start_time ? formData.start_time.split(':')[1] || '' : ''}
                              onChange={(e) => {
                                const minute = e.target.value;
                                const hour = formData.start_time ? formData.start_time.split(':')[0] || '00' : '00';
                                
                                // อนุญาตให้กรอกได้แค่ตัวเลข และไม่เกิน 2 หลัก
                                if (minute === '' || /^[0-9]{1,2}$/.test(minute)) {
                                  setFormData(prev => ({
                                    ...prev,
                                    start_time: minute === '' ? `${hour}:00` : `${hour}:${minute}`
                                  }));
                                }
                              }}
                              required
                            />
                          </div>
                          <div className="form-text">รูปแบบ 24 ชั่วโมง (เช่น 09:00, 14:30)</div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label htmlFor="end_time" className="form-label">
                            <i className="fas fa-clock me-2"></i>เวลาสิ้นสุด *
                          </label>
                          <div className="time-input-group">
                            <input
                              type="text"
                              className="form-control time-hour"
                              placeholder="17"
                              maxLength="2"
                              value={formData.end_time ? formData.end_time.split(':')[0] || '' : ''}
                              onChange={(e) => {
                                const hour = e.target.value;
                                const minute = formData.end_time ? formData.end_time.split(':')[1] || '00' : '00';
                                
                                // อนุญาตให้กรอกได้แค่ตัวเลข และไม่เกิน 2 หลัก
                                if (hour === '' || /^[0-9]{1,2}$/.test(hour)) {
                                  setFormData(prev => ({
                                    ...prev,
                                    end_time: hour === '' ? `00:${minute}` : `${hour}:${minute}`
                                  }));
                                }
                              }}
                              required
                            />
                            <span className="time-separator">:</span>
                            <input
                              type="text"
                              className="form-control time-minute"
                              placeholder="00"
                              maxLength="2"
                              value={formData.end_time ? formData.end_time.split(':')[1] || '' : ''}
                              onChange={(e) => {
                                const minute = e.target.value;
                                const hour = formData.end_time ? formData.end_time.split(':')[0] || '00' : '00';
                                
                                // อนุญาตให้กรอกได้แค่ตัวเลข และไม่เกิน 2 หลัก
                                if (minute === '' || /^[0-9]{1,2}$/.test(minute)) {
                                  setFormData(prev => ({
                                    ...prev,
                                    end_time: minute === '' ? `${hour}:00` : `${hour}:${minute}`
                                  }));
                                }
                              }}
                              required
                            />
                          </div>
                          <div className="form-text">รูปแบบ 24 ชั่วโมง (เช่น 12:00, 17:30)</div>
                        </div>
                      </div>
                    </div>

                    <div className="alert alert-info">
                      <small>
                        <i className="fas fa-info-circle me-1"></i>
                        <strong>หมายเหตุ:</strong> กิจกรรมจะจัดในวันเดียว โดยระบุเวลาเริ่มต้นและสิ้นสุด
                      </small>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="hours_awarded" className="form-label">
                            <i className="fas fa-clock me-2"></i>ชั่วโมงที่ได้รับ *
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            id="hours_awarded"
                            name="hours_awarded"
                            value={formData.hours_awarded}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.5"
                            placeholder="เช่น 2.5"
                          />
                          <div className="form-text">
                            จำนวนชั่วโมงที่นักเรียนจะได้รับเมื่อเข้าร่วมกิจกรรมนี้
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="max_participants" className="form-label">
                            <i className="fas fa-users me-2"></i>จำนวนผู้เข้าร่วมสูงสุด
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            id="max_participants"
                            name="max_participants"
                            value={formData.max_participants}
                            onChange={handleChange}
                            min="1"
                            placeholder="ปล่อยว่างไว้สำหรับไม่จำกัด"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="location" className="form-label">
                        <i className="fas fa-map-marker-alt me-2"></i>สถานที่
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="กรอกสถานที่จัดกิจกรรม"
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="card bg-light">
                      <div className="card-header">
                        <h6 className="mb-0">
                          <i className="fas fa-cog me-2"></i>การตั้งค่ากิจกรรม
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <label htmlFor="status" className="form-label">สถานะ</label>
                          <select
                            className="form-select"
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                          >
                            <option value="OPEN">เปิดใช้งานได้ตลอด</option>
                            <option value="DRAFT">ร่าง</option>
                            <option value="CANCELLED">ยกเลิก</option>
                          </select>
                        </div>

                        <div className="alert alert-success">
                          <small>
                            <i className="fas fa-check-circle me-1"></i>
                            <strong>เปิดใช้งานได้ตลอด:</strong> นักเรียนสามารถเช็คอินได้ตลอดเวลา<br/>
                            <strong>ร่าง:</strong> กิจกรรมยังไม่แสดงให้นักเรียนเห็น<br/>
                            <strong>ยกเลิก:</strong> กิจกรรมถูกยกเลิก
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate('/activities/my')}
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    กำลังสร้าง...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus me-2"></i>
                    สร้างกิจกรรม
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Success Section - Show QR Code and URL */}
        {createdActivity && checkinUrl && (
          <div className="content-card mt-4" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '20px',
            padding: '2rem'
          }}>
            <div className="row">
              <div className="col-md-8">
                <h3 className="mb-3">
                  <i className="fas fa-check-circle me-2"></i>
                  กิจกรรมสร้างสำเร็จ!
                </h3>
                <h4 className="mb-3">{createdActivity.title}</h4>
                <p className="mb-3">{createdActivity.description}</p>
                
                <div className="row">
                  <div className="col-md-6">
                    <strong>วันที่จัด:</strong><br />
                    <span>{new Date(createdActivity.start_date).toLocaleDateString('th-TH')}</span>
                  </div>
                  <div className="col-md-6">
                    <strong>ชั่วโมงที่ได้รับ:</strong><br />
                    <span>{createdActivity.hours_awarded} ชั่วโมง</span>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4 text-center">
                <h5 className="mb-3">
                  <i className="fas fa-qrcode me-2"></i>
                  QR Code สำหรับลงทะเบียน
                </h5>
                
                <div style={{
                  background: 'white',
                  borderRadius: '15px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  display: 'inline-block'
                }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(checkinUrl)}`}
                    alt="QR Code" 
                    style={{ 
                      maxWidth: '200px',
                      width: '100%',
                      height: 'auto'
                    }} 
                  />
                </div>
                
                <div className="mb-3" style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '1rem',
                  fontSize: '0.8rem',
                  wordBreak: 'break-all'
                }}>
                  <strong>ลิงก์ลงทะเบียน:</strong><br />
                  <code style={{ color: '#fff' }}>{checkinUrl}</code>
                </div>
                
                <div className="d-grid gap-2">
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(checkinUrl)}`}
                    download={`qr-${createdActivity.title.replace(/[^a-zA-Z0-9]/g, '-')}.png`}
                    className="btn btn-light btn-sm"
                    style={{ borderRadius: '10px' }}
                  >
                    <i className="fas fa-download me-2"></i>ดาวน์โหลด QR Code
                  </a>
                  
                  <button
                    className="btn btn-outline-light btn-sm"
                    style={{ borderRadius: '10px' }}
                    onClick={() => {
                      navigator.clipboard.writeText(checkinUrl);
                      setSuccess('คัดลอกลิงก์ลงทะเบียนแล้ว!');
                      setTimeout(() => setSuccess(''), 3000);
                    }}
                  >
                    <i className="fas fa-copy me-2"></i>คัดลอกลิงก์
                  </button>
                  
                  <button
                    className="btn btn-outline-light btn-sm"
                    style={{ borderRadius: '10px' }}
                    onClick={() => {
                      setCreatedActivity(null);
                      setCheckinUrl('');
                      setSuccess('');
                      // Reset form
                      setFormData({
                        title: '',
                        description: '',
                        activity_date: '',
                        start_time: '',
                        end_time: '',
                        hours_awarded: '',
                        location: '',
                        max_participants: '',
                        status: 'OPEN'
                      });
                    }}
                  >
                    <i className="fas fa-plus me-2"></i>สร้างกิจกรรมใหม่
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateActivity
