import { useState, useEffect } from 'react'
import api from '../services/api'

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    required_hours: 40
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/settings')
      if (response.data.success) {
        setSettings(response.data.data || { required_hours: 40 })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setError('ไม่สามารถโหลดการตั้งค่าได้')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await api.put('/admin/settings', settings)
      if (response.data.success) {
        setSuccess('บันทึกการตั้งค่าสำเร็จ!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(response.data.message || 'ไม่สามารถบันทึกการตั้งค่าได้')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setError(error.response?.data?.message || 'ไม่สามารถบันทึกการตั้งค่าได้')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }))
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="text-center" style={{ padding: '40px 20px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">กำลังโหลด...</span>
            </div>
            <div className="mt-3">กำลังโหลดการตั้งค่า...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>ตั้งค่าระบบ</h1>
          <p>จัดการการตั้งค่าระบบสำหรับนักเรียน</p>
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
            <div className="form-header">
              <h2>การตั้งค่าชั่วโมงกิจกรรม</h2>
              <p>กำหนดจำนวนชั่วโมงที่นักเรียนต้องเข้าร่วมเพื่อผ่านเกณฑ์</p>
            </div>

            <div className="row">
              <div className="col-md-8">
                <div className="form-group">
                  <label htmlFor="required_hours" className="form-label">
                    <i className="fas fa-clock me-2"></i>จำนวนชั่วโมงที่ต้องการ *
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="required_hours"
                    name="required_hours"
                    value={settings.required_hours}
                    onChange={handleChange}
                    required
                    min="1"
                    max="1000"
                    step="0.5"
                    placeholder="เช่น 40"
                  />
                  <div className="form-text">
                    จำนวนชั่วโมงที่นักเรียนต้องเข้าร่วมกิจกรรมเพื่อผ่านเกณฑ์
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card bg-light">
                  <div className="card-header">
                    <h6 className="mb-0">
                      <i className="fas fa-info-circle me-2"></i>ข้อมูลเพิ่มเติม
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="alert alert-info">
                      <small>
                        <i className="fas fa-lightbulb me-1"></i>
                        <strong>คำแนะนำ:</strong><br/>
                        • กำหนดจำนวนชั่วโมงที่เหมาะสมกับหลักสูตร<br/>
                        • นักเรียนจะเห็นความก้าวหน้าของตนเอง<br/>
                        • สามารถปรับเปลี่ยนได้ตลอดเวลา
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
                onClick={() => fetchSettings()}
                disabled={saving}
              >
                รีเซ็ต
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    บันทึกการตั้งค่า
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* System Information */}
        <div className="content-card">
          <h3>ข้อมูลระบบ</h3>
          <div className="row">
            <div className="col-md-6">
              <div className="card bg-light">
                <div className="card-body">
                  <h6 className="card-title">
                    <i className="fas fa-database me-2"></i>ฐานข้อมูล
                  </h6>
                  <p className="card-text">
                    <strong>สถานะ:</strong> <span className="badge bg-success">เชื่อมต่อแล้ว</span><br/>
                    <strong>ประเภท:</strong> MySQL<br/>
                    <strong>เวอร์ชัน:</strong> 8.0+
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card bg-light">
                <div className="card-body">
                  <h6 className="card-title">
                    <i className="fas fa-server me-2"></i>เซิร์ฟเวอร์
                  </h6>
                  <p className="card-text">
                    <strong>สถานะ:</strong> <span className="badge bg-success">ทำงานปกติ</span><br/>
                    <strong>Node.js:</strong> v18+<br/>
                    <strong>Express:</strong> v4.18+
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

export default AdminSettings