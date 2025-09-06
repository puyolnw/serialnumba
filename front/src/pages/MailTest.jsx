import { useState } from 'react'
import api from '../services/api'

const MailTest = () => {
  const [formData, setFormData] = useState({
    to: 'midnmega@gmail.com',
    subject: '🎉 ทดสอบส่งอีเมลจากระบบ Workflow',
    message: 'สวัสดี! นี่คือการทดสอบส่งอีเมลจากระบบ workflow ผ่าน Gmail SMTP'
  })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState('')
  const [resultType, setResultType] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setResult('')
    setResultType('')

    try {
      const response = await api.post('/test-email', {
        to: formData.to,
        subject: formData.subject,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🎉 ทดสอบส่งอีเมลสำเร็จ!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">ระบบ Workflow Mail Testing</p>
            </div>
            <div style="padding: 30px;">
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
                <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">📧 ข้อมูลการส่งอีเมล</h3>
                <p style="margin: 5px 0; color: #495057;"><strong>ผู้รับ:</strong> ${formData.to}</p>
                <p style="margin: 5px 0; color: #495057;"><strong>หัวข้อ:</strong> ${formData.subject}</p>
                <p style="margin: 5px 0; color: #495057;"><strong>เวลา:</strong> ${new Date().toLocaleString('th-TH')}</p>
                <p style="margin: 5px 0; color: #495057;"><strong>SMTP:</strong> Gmail (smtp.gmail.com:587)</p>
              </div>
              <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
                <h3 style="color: #1565c0; margin: 0 0 15px 0; font-size: 18px;">💬 ข้อความ</h3>
                <p style="margin: 0; color: #424242; line-height: 1.6; white-space: pre-wrap;">${formData.message}</p>
              </div>
              <div style="text-align: center; margin-top: 25px; padding: 20px; background: #f1f8e9; border-radius: 8px; border-left: 4px solid #4caf50;">
                <p style="margin: 0; color: #2e7d32; font-weight: 600; font-size: 16px;">✅ การตั้งค่า SMTP ทำงานได้ปกติ!</p>
                <p style="margin: 5px 0 0 0; color: #388e3c; font-size: 14px;">ระบบพร้อมสำหรับการส่งอีเมลแจ้งเตือน</p>
              </div>
            </div>
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">ส่งจากระบบ Workflow Management System</p>
            </div>
          </div>
        `,
        text: formData.message
      })
      
      if (response.data.ok) {
        setResult(`✅ ส่งอีเมลสำเร็จ! Message ID: ${response.data.messageId}`)
        setResultType('success')
      } else {
        setResult('❌ ส่งอีเมลไม่สำเร็จ: ' + response.data.error)
        setResultType('error')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      setResult('❌ ส่งอีเมลไม่สำเร็จ: ' + (error.response?.data?.error || error.message || 'เกิดข้อผิดพลาด'))
      setResultType('error')
    } finally {
      setSending(false)
    }
  }

  const quickTemplates = [
    {
      name: 'ทดสอบระบบ',
      subject: '🎉 ทดสอบส่งอีเมลจากระบบ Workflow',
      message: 'สวัสดี! นี่คือการทดสอบส่งอีเมลจากระบบ workflow ผ่าน Gmail SMTP'
    },
    {
      name: 'แจ้งเตือนกิจกรรม',
      subject: '📅 แจ้งเตือนกิจกรรมใหม่',
      message: 'มีกิจกรรมใหม่ที่คุณอาจสนใจ กรุณาตรวจสอบในระบบ'
    },
    {
      name: 'ยืนยันการเข้าร่วม',
      subject: '✅ ยืนยันการเข้าร่วมกิจกรรม',
      message: 'ขอบคุณสำหรับการลงทะเบียนเข้าร่วมกิจกรรม เราจะติดต่อกลับในเร็วๆ นี้'
    }
  ]

  const applyTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      subject: template.subject,
      message: template.message
    }))
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>📧 ทดสอบส่งอีเมล</h1>
          <p>ทดสอบการส่งอีเมลผ่าน Gmail SMTP</p>
        </div>

        {result && (
          <div className={`alert ${resultType === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`} role="alert">
            {result}
            <button type="button" className="btn-close" onClick={() => setResult('')}></button>
          </div>
        )}

        <div className="row">
          {/* Quick Templates */}
          <div className="col-md-4">
            <div className="content-card">
              <h3>📝 เทมเพลตด่วน</h3>
              <p className="text-muted">เลือกเทมเพลตเพื่อกรอกข้อมูลอัตโนมัติ</p>
              <div className="d-grid gap-2">
                {quickTemplates.map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => applyTemplate(template)}
                    disabled={sending}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            {/* SMTP Status */}
            <div className="content-card mt-3">
              <h3>🔧 สถานะระบบ</h3>
              <div className="d-flex align-items-center mb-2">
                <span className="badge bg-success me-2">✅</span>
                <span>Gmail SMTP พร้อมใช้งาน</span>
              </div>
              <div className="d-flex align-items-center mb-2">
                <span className="badge bg-info me-2">📡</span>
                <span>smtp.gmail.com:587</span>
              </div>
              <div className="d-flex align-items-center">
                <span className="badge bg-warning me-2">🔐</span>
                <span>App Password Authentication</span>
              </div>
            </div>
          </div>

          {/* Mail Form */}
          <div className="col-md-8">
            <div className="content-card">
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <label htmlFor="to" className="form-label">
                    <i className="fas fa-envelope me-2"></i>ผู้รับ *
                  </label>
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    id="to"
                    name="to"
                    value={formData.to}
                    onChange={handleChange}
                    required
                    placeholder="example@gmail.com"
                  />
                </div>

                <div className="form-group mb-3">
                  <label htmlFor="subject" className="form-label">
                    <i className="fas fa-tag me-2"></i>หัวข้อ *
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="หัวข้ออีเมล"
                  />
                </div>

                <div className="form-group mb-4">
                  <label htmlFor="message" className="form-label">
                    <i className="fas fa-comment me-2"></i>ข้อความ *
                  </label>
                  <textarea
                    className="form-control"
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="พิมพ์ข้อความที่ต้องการส่ง..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted">
                    <small>
                      <i className="fas fa-info-circle me-1"></i>
                      อีเมลจะถูกส่งผ่าน Gmail SMTP
                    </small>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg px-4"
                    disabled={sending}
                  >
                    {sending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        กำลังส่ง...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        ส่งอีเมล
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="content-card mt-4">
          <h3>💡 คำแนะนำ</h3>
          <div className="row">
            <div className="col-md-6">
              <div className="card bg-light h-100">
                <div className="card-body">
                  <h6 className="card-title">
                    <i className="fas fa-check-circle text-success me-2"></i>การใช้งาน
                  </h6>
                  <ul className="mb-0">
                    <li>กรอกอีเมลผู้รับที่ถูกต้อง</li>
                    <li>เลือกเทมเพลตหรือพิมพ์ข้อความเอง</li>
                    <li>กดปุ่ม "ส่งอีเมล" เพื่อทดสอบ</li>
                    <li>ตรวจสอบกล่องจดหมายของผู้รับ</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card bg-light h-100">
                <div className="card-body">
                  <h6 className="card-title">
                    <i className="fas fa-cog text-info me-2"></i>การตั้งค่า
                  </h6>
                  <ul className="mb-0">
                    <li>ใช้ Gmail App Password</li>
                    <li>SMTP: smtp.gmail.com:587</li>
                    <li>รองรับ HTML และ Text</li>
                    <li>แสดงผลแบบ Responsive</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MailTest
