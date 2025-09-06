import { useState, useEffect } from 'react'
import api from '../services/api'

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    required_hours: 0
  })
  const [originalSettings, setOriginalSettings] = useState({
    required_hours: 0
  })
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalActivities: 0,
    totalCheckins: 0
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchSettings()
    fetchStats()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/settings')
      console.log('🔧 [SETTINGS] API Response:', response.data)
      
      if (response.data.success) {
        // Fix: response.data.data is the settings object directly, not response.data.data.settings
        const settingsData = response.data.data || { required_hours: 0 }
        console.log('🔧 [SETTINGS] Parsed settings:', settingsData)
        
        setSettings(settingsData)
        setOriginalSettings(settingsData)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setError('ไม่สามารถโหลดการตั้งค่าได้')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats')
      console.log('Stats response:', response.data)
      if (response.data.success) {
        const statsData = response.data.data || {}
        setStats({
          totalUsers: statsData.totalUsers || 0,
          totalActivities: statsData.totalActivities || 0,
          totalCheckins: statsData.totalCheckins || 0
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Set default values if API fails
      setStats({
        totalUsers: 0,
        totalActivities: 0,
        totalCheckins: 0
      })
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
        setOriginalSettings(settings)
        setSuccess('บันทึกการตั้งค่าสำเร็จ')
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
      [name]: value
    }))
    if (error) setError('')
    if (success) setSuccess('')
  }

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
          <div>
            <h1 className="h3 mb-1">
              <i className="fas fa-cog me-2"></i>
              ตั้งค่าระบบ
            </h1>
            <p className="text-muted mb-0">จัดการการตั้งค่าระบบเบื้องต้น</p>
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

        <div className="row">
          <div className="col-md-8">
            <div className="content-card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-graduation-cap me-2"></i>
                  การตั้งค่าการเรียน
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="required_hours" className="form-label">
                      <i className="fas fa-clock me-2"></i>
                      จำนวนชั่วโมงที่นักเรียนต้องลงทะเบียน
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        id="required_hours"
                        name="required_hours"
                        value={settings.required_hours}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        placeholder="กรอกจำนวนชั่วโมง"
                        required
                      />
                      <span className="input-group-text">ชั่วโมง</span>
                    </div>
                    <div className="form-text">
                      จำนวนชั่วโมงที่นักเรียนต้องเข้าร่วมกิจกรรมเพื่อผ่านเกณฑ์
                    </div>
                    {originalSettings.required_hours !== settings.required_hours && (
                      <div className="form-text text-info">
                        <i className="fas fa-info-circle me-1"></i>
                        ค่าเดิม: {originalSettings.required_hours} ชั่วโมง
                      </div>
                    )}
                  </div>

                  <div className="d-flex justify-content-end">
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
            </div>
          </div>

          <div className="col-md-4">
            <div className="content-card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  ข้อมูลระบบ
                </h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <strong>เวอร์ชันระบบ:</strong><br />
                  <span className="text-muted">v1.0.0</span>
                </div>
                <div className="mb-3">
                  <strong>ฐานข้อมูล:</strong><br />
                  <span className="text-muted">MySQL</span>
                </div>
                <div className="mb-3">
                  <strong>สถานะ:</strong><br />
                  <span className="badge badge-success">ใช้งานได้</span>
                </div>
              </div>
            </div>

            <div className="content-card mt-3">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-chart-bar me-2"></i>
                  สถิติการใช้งาน
                </h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <small className="text-muted">จำนวนผู้ใช้ทั้งหมด</small><br />
                  <strong className="text-primary" style={{ fontSize: '1.2rem' }}>
                    {(stats.totalUsers || 0).toLocaleString()} คน
                  </strong>
                </div>
                <div className="mb-3">
                  <small className="text-muted">กิจกรรมทั้งหมด</small><br />
                  <strong className="text-success" style={{ fontSize: '1.2rem' }}>
                    {(stats.totalActivities || 0).toLocaleString()} กิจกรรม
                  </strong>
                </div>
                <div className="mb-3">
                  <small className="text-muted">การเช็คอินทั้งหมด</small><br />
                  <strong className="text-info" style={{ fontSize: '1.2rem' }}>
                    {(stats.totalCheckins || 0).toLocaleString()} ครั้ง
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemSettings
