import { useState, useEffect } from 'react'
import api from '../services/api'

const MailSettings = () => {
  const [settings, setSettings] = useState({
    provider: 'gmail',
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: false,
    username: '',
    password: '',
    from_email: '',
    from_name: '',
    client_id: '',
    client_secret: '',
    refresh_token: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [testResult, setTestResult] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [smtpStatus, setSmtpStatus] = useState('')

  useEffect(() => {
    fetchSettings()
    checkSmtpStatus()
  }, [])

  const checkSmtpStatus = async () => {
    try {
      const response = await api.get('/health')
      if (response.data.status === 'ok') {
        setSmtpStatus('✅ เซิร์ฟเวอร์พร้อมใช้งาน')
      }
    } catch (error) {
      setSmtpStatus('❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    }
  }

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/mail/settings')
      if (response.data.success) {
        setSettings(response.data.data || settings)
      }
    } catch (error) {
      console.error('Error fetching mail settings:', error)
      setError('ไม่สามารถโหลดการตั้งค่าอีเมลได้')
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
      const response = await api.put('/mail/settings', settings)
      if (response.data.success) {
        setSuccess('บันทึกการตั้งค่าอีเมลสำเร็จ!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(response.data.message || 'ไม่สามารถบันทึกการตั้งค่าได้')
      }
    } catch (error) {
      console.error('Error saving mail settings:', error)
      setError(error.response?.data?.message || 'ไม่สามารถบันทึกการตั้งค่าได้')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult('')
    setError('')

    try {
      // ใช้ endpoint ใหม่ที่เราสร้างใน server.js
      const response = await api.post('/test-email', {
        to: testEmail || settings.from_email || 'midnmega@gmail.com',
        subject: '🎉 ทดสอบส่งอีเมลจากระบบ Workflow',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">🎉 ทดสอบส่งอีเมลสำเร็จ!</h2>
            <p>สวัสดี! นี่คือการทดสอบส่งอีเมลจากระบบ workflow ผ่าน Gmail SMTP</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>เวลา:</strong> ${new Date().toLocaleString('th-TH')}</p>
              <p><strong>ระบบ:</strong> Mail Test Server</p>
              <p><strong>SMTP:</strong> Gmail (smtp.gmail.com)</p>
            </div>
            <p style="color: #27ae60;">✅ การตั้งค่า SMTP ทำงานได้ปกติ!</p>
          </div>
        `,
        text: 'สวัสดี! นี่คือการทดสอบส่งอีเมลจากระบบ workflow ผ่าน Gmail SMTP'
      })
      
      if (response.data.ok) {
        setTestResult(`✅ ส่งอีเมลทดสอบสำเร็จ! Message ID: ${response.data.messageId}`)
      } else {
        setTestResult('❌ ส่งอีเมลทดสอบไม่สำเร็จ: ' + response.data.error)
      }
    } catch (error) {
      console.error('Error testing mail:', error)
      setTestResult('❌ ส่งอีเมลทดสอบไม่สำเร็จ: ' + (error.response?.data?.error || error.message || 'เกิดข้อผิดพลาด'))
    } finally {
      setTesting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
            <div className="mt-3">กำลังโหลดการตั้งค่าอีเมล...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>ตั้งค่าอีเมล</h1>
          <p>จัดการการตั้งค่าสำหรับส่งอีเมลแจ้งเตือน</p>
          {smtpStatus && (
            <div className={`alert ${smtpStatus.includes('✅') ? 'alert-success' : 'alert-danger'} mb-0`}>
              <i className="fas fa-info-circle me-2"></i>
              {smtpStatus}
            </div>
          )}
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

        {testResult && (
          <div className={`alert ${testResult.includes('สำเร็จ') ? 'alert-success' : 'alert-warning'} alert-dismissible fade show`} role="alert">
            {testResult}
            <button type="button" className="btn-close" onClick={() => setTestResult('')}></button>
          </div>
        )}

        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-header">
              <h2>การตั้งค่าผู้ให้บริการอีเมล</h2>
              <p>เลือกและกำหนดค่าผู้ให้บริการอีเมลสำหรับส่งการแจ้งเตือน</p>
            </div>

            <div className="form-group">
              <label htmlFor="provider" className="form-label">
                <i className="fas fa-envelope me-2"></i>ผู้ให้บริการ *
              </label>
              <select
                className="form-select"
                id="provider"
                name="provider"
                value={settings.provider}
                onChange={handleChange}
                required
              >
                <option value="gmail">Gmail (SMTP)</option>
                <option value="gmail-oauth">Gmail (OAuth2)</option>
                <option value="outlook">Outlook (SMTP)</option>
                <option value="custom">กำหนดเอง</option>
              </select>
            </div>

            {settings.provider === 'gmail' && (
              <>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="username" className="form-label">
                        <i className="fas fa-user me-2"></i>อีเมล *
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="username"
                        name="username"
                        value={settings.username}
                        onChange={handleChange}
                        required
                        placeholder="your-email@gmail.com"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="password" className="form-label">
                        <i className="fas fa-lock me-2"></i>รหัสผ่านแอป *
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        name="password"
                        value={settings.password}
                        onChange={handleChange}
                        required
                        placeholder="รหัสผ่านแอป (App Password)"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {settings.provider === 'gmail-oauth' && (
              <>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="client_id" className="form-label">
                        <i className="fas fa-key me-2"></i>Client ID *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="client_id"
                        name="client_id"
                        value={settings.client_id}
                        onChange={handleChange}
                        required
                        placeholder="Google OAuth2 Client ID"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="client_secret" className="form-label">
                        <i className="fas fa-key me-2"></i>Client Secret *
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="client_secret"
                        name="client_secret"
                        value={settings.client_secret}
                        onChange={handleChange}
                        required
                        placeholder="Google OAuth2 Client Secret"
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="refresh_token" className="form-label">
                    <i className="fas fa-refresh me-2"></i>Refresh Token *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="refresh_token"
                    name="refresh_token"
                    value={settings.refresh_token}
                    onChange={handleChange}
                    required
                    placeholder="OAuth2 Refresh Token"
                  />
                </div>
              </>
            )}

            {settings.provider === 'custom' && (
              <>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="smtp_host" className="form-label">
                        <i className="fas fa-server me-2"></i>SMTP Host *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="smtp_host"
                        name="smtp_host"
                        value={settings.smtp_host}
                        onChange={handleChange}
                        required
                        placeholder="smtp.example.com"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="smtp_port" className="form-label">
                        <i className="fas fa-plug me-2"></i>SMTP Port *
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="smtp_port"
                        name="smtp_port"
                        value={settings.smtp_port}
                        onChange={handleChange}
                        required
                        placeholder="587"
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="username" className="form-label">
                        <i className="fas fa-user me-2"></i>ชื่อผู้ใช้ *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="username"
                        name="username"
                        value={settings.username}
                        onChange={handleChange}
                        required
                        placeholder="username"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="password" className="form-label">
                        <i className="fas fa-lock me-2"></i>รหัสผ่าน *
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        name="password"
                        value={settings.password}
                        onChange={handleChange}
                        required
                        placeholder="password"
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="smtp_secure"
                      name="smtp_secure"
                      checked={settings.smtp_secure}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="smtp_secure">
                      ใช้การเชื่อมต่อที่ปลอดภัย (TLS/SSL)
                    </label>
                  </div>
                </div>
              </>
            )}

            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="from_email" className="form-label">
                    <i className="fas fa-at me-2"></i>อีเมลผู้ส่ง *
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="from_email"
                    name="from_email"
                    value={settings.from_email}
                    onChange={handleChange}
                    required
                    placeholder="noreply@example.com"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="from_name" className="form-label">
                    <i className="fas fa-user-tag me-2"></i>ชื่อผู้ส่ง *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="from_name"
                    name="from_name"
                    value={settings.from_name}
                    onChange={handleChange}
                    required
                    placeholder="ระบบจัดการกิจกรรม"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="test_email" className="form-label">
                <i className="fas fa-envelope-open me-2"></i>อีเมลสำหรับทดสอบ
              </label>
              <div className="input-group">
                <input
                  type="email"
                  className="form-control"
                  id="test_email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com (ถ้าไม่กรอกจะใช้อีเมลผู้ส่ง)"
                />
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handleTest}
                  disabled={testing || saving}
                >
                  {testing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      กำลังทดสอบ...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i>
                      ทดสอบส่งอีเมล
                    </>
                  )}
                </button>
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

        {/* Help Section */}
        <div className="content-card">
          <h3>คำแนะนำการตั้งค่า</h3>
          <div className="row">
            <div className="col-md-6">
              <div className="card bg-light">
                <div className="card-body">
                  <h6 className="card-title">
                    <i className="fab fa-google me-2"></i>Gmail SMTP
                  </h6>
                  <p className="card-text">
                    <strong>SMTP Host:</strong> smtp.gmail.com<br/>
                    <strong>Port:</strong> 587<br/>
                    <strong>Security:</strong> TLS<br/>
                    <strong>หมายเหตุ:</strong> ต้องใช้รหัสผ่านแอป (App Password)
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card bg-light">
                <div className="card-body">
                  <h6 className="card-title">
                    <i className="fab fa-microsoft me-2"></i>Outlook SMTP
                  </h6>
                  <p className="card-text">
                    <strong>SMTP Host:</strong> smtp-mail.outlook.com<br/>
                    <strong>Port:</strong> 587<br/>
                    <strong>Security:</strong> TLS<br/>
                    <strong>หมายเหตุ:</strong> ใช้รหัสผ่านปกติ
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

export default MailSettings