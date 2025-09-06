import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    student_code: '',
    birth_date: '',
    gender: '',
    phone: '',
    address: '',
    enrollment_year: '',
    program: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }

    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }

    if (!formData.student_code.trim()) {
      setError('กรุณากรอกรหัสนักศึกษา')
      return
    }

    if (!formData.name.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุล')
      return
    }

    if (!formData.birth_date) {
      setError('กรุณาเลือกวันเกิด')
      return
    }

    if (!formData.gender) {
      setError('กรุณาเลือกเพศ')
      return
    }

    if (!formData.phone.trim()) {
      setError('กรุณากรอกเบอร์โทรศัพท์')
      return
    }

    if (!formData.address.trim()) {
      setError('กรุณากรอกที่อยู่')
      return
    }

    if (!formData.enrollment_year) {
      setError('กรุณากรอกปีที่เข้าศึกษา')
      return
    }

    if (!formData.program.trim()) {
      setError('กรุณากรอกหลักสูตรที่เรียน')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('รูปแบบอีเมลไม่ถูกต้อง')
      return
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    if (!usernameRegex.test(formData.username)) {
      setError('ชื่อผู้ใช้ต้องเป็นตัวอักษร ตัวเลข และ _ เท่านั้น (3-50 ตัวอักษร)')
      return
    }

    setLoading(true)

    try {
      // Clear previous error when starting new registration attempt
      if (error) setError('')
      
      const { confirmPassword, ...userData } = formData
      const result = await register(userData)
      
      if (result.success) {
        // Redirect to student dashboard (only students can register)
        navigate('/student', { replace: true })
      } else {
        setError(result.message || 'การลงทะเบียนล้มเหลว กรุณาลองใหม่')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('การลงทะเบียนล้มเหลว กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
        <div className="text-center mb-3">
          <h2>สมัครสมาชิก</h2>
          <p style={{ color: '#666' }}>สร้างบัญชีนักศึกษาใหม่</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ข้อมูลพื้นฐาน */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#007bff', marginBottom: '15px' }}>📋 ข้อมูลพื้นฐาน</h4>
            
            <div className="form-group">
              <label htmlFor="student_code" className="form-label">รหัสนักศึกษา *</label>
              <input
                type="text"
                id="student_code"
                name="student_code"
                className="form-control"
                value={formData.student_code}
                onChange={handleChange}
                placeholder="เช่น ST001"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="name" className="form-label">ชื่อ-นามสกุล *</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                placeholder="ชื่อ-นามสกุล"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label htmlFor="birth_date" className="form-label">วันเกิด *</label>
                <input
                  type="date"
                  id="birth_date"
                  name="birth_date"
                  className="form-control"
                  value={formData.birth_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender" className="form-label">เพศ *</label>
                <select
                  id="gender"
                  name="gender"
                  className="form-control"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">เลือกเพศ</option>
                  <option value="MALE">ชาย</option>
                  <option value="FEMALE">หญิง</option>
                  <option value="OTHER">อื่นๆ</option>
                </select>
              </div>
            </div>
          </div>

          {/* ข้อมูลติดต่อ */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#007bff', marginBottom: '15px' }}>📞 ข้อมูลติดต่อ</h4>
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">อีเมล *</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">เบอร์โทรศัพท์ *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0812345678"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address" className="form-label">ที่อยู่ *</label>
              <textarea
                id="address"
                name="address"
                className="form-control"
                value={formData.address}
                onChange={handleChange}
                placeholder="กรอกที่อยู่ที่สามารถติดต่อได้"
                rows="3"
                required
              />
            </div>
          </div>

          {/* ข้อมูลการศึกษา */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#007bff', marginBottom: '15px' }}>🎓 ข้อมูลการศึกษา</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label htmlFor="enrollment_year" className="form-label">ปีที่เข้าศึกษา *</label>
                <input
                  type="number"
                  id="enrollment_year"
                  name="enrollment_year"
                  className="form-control"
                  value={formData.enrollment_year}
                  onChange={handleChange}
                  placeholder="2567"
                  min="2500"
                  max="2600"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="program" className="form-label">หลักสูตรที่เรียน *</label>
                <input
                  type="text"
                  id="program"
                  name="program"
                  className="form-control"
                  value={formData.program}
                  onChange={handleChange}
                  placeholder="เช่น วิศวกรรมคอมพิวเตอร์"
                  required
                />
              </div>
            </div>
          </div>

          {/* ข้อมูลบัญชี */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#007bff', marginBottom: '15px' }}>🔐 ข้อมูลบัญชี</h4>
            
            <div className="form-group">
              <label htmlFor="username" className="form-label">ชื่อผู้ใช้ *</label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-control"
                value={formData.username}
                onChange={handleChange}
                placeholder="เลือกชื่อผู้ใช้ที่ไม่ซ้ำ"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">รหัสผ่าน *</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">ยืนยันรหัสผ่าน *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="ยืนยันรหัสผ่าน"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '20px', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <div className="text-center">
          <p style={{ color: '#666' }}>
            มีบัญชีแล้ว? <Link to="/login" style={{ color: '#007bff' }}>เข้าสู่ระบบที่นี่</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
