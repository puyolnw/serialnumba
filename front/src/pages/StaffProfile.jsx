import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const StaffProfile = () => {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    username: '',
    phone: '',
    address: '',
    department: '',
    position: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        phone: user.phone || '',
        address: user.address || '',
        department: user.department || '',
        position: user.position || ''
      })
    }
  }, [user])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await api.put('/auth/profile', profileData)
      if (response.data.success) {
        setSuccess('อัปเดตข้อมูลโปรไฟล์สำเร็จ')
        // อัปเดตข้อมูลใน context
        window.location.reload() // รีเฟรชเพื่ออัปเดตข้อมูลผู้ใช้
      } else {
        setError(response.data.message || 'ไม่สามารถอัปเดตข้อมูลได้')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError(error.response?.data?.message || 'ไม่สามารถอัปเดตข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('รหัสผ่านใหม่ไม่ตรงกัน')
      setLoading(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร')
      setLoading(false)
      return
    }

    try {
      const response = await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      if (response.data.success) {
        setSuccess('เปลี่ยนรหัสผ่านสำเร็จ')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        setError(response.data.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setError(error.response?.data?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      {/* Header Section */}
      <div style={{
        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(40,167,69,0.3)'
      }}>
        <div className="row align-items-center">
          <div className="col-md-8">
            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', fontWeight: 'bold' }}>
              👨‍💼 โปรไฟล์เจ้าหน้าที่
            </h1>
            <p style={{ fontSize: '1.2rem', margin: 0, opacity: 0.9 }}>
              สวัสดี {user?.name}! จัดการข้อมูลส่วนตัวและรหัสผ่านของคุณ
            </p>
          </div>
          <div className="col-md-4 text-end">
            <div style={{ fontSize: '4rem', opacity: 0.8 }}>⚙️</div>
          </div>
        </div>
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

      {success && (
        <div className="alert alert-success" style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #c3e6cb'
        }}>
          {success}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="card mb-4" style={{ border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
        <div className="card-header" style={{ backgroundColor: '#f8f9fa', border: 'none' }}>
          <ul className="nav nav-tabs card-header-tabs" style={{ border: 'none' }}>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
                style={{
                  border: 'none',
                  backgroundColor: activeTab === 'profile' ? '#28a745' : 'transparent',
                  color: activeTab === 'profile' ? 'white' : '#28a745',
                  borderRadius: '25px',
                  padding: '10px 20px',
                  marginRight: '10px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
              >
                📋 ข้อมูลส่วนตัว
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'password' ? 'active' : ''}`}
                onClick={() => setActiveTab('password')}
                style={{
                  border: 'none',
                  backgroundColor: activeTab === 'password' ? '#28a745' : 'transparent',
                  color: activeTab === 'password' ? 'white' : '#28a745',
                  borderRadius: '25px',
                  padding: '10px 20px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
              >
                🔐 เปลี่ยนรหัสผ่าน
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit}>
              <div className="row">
                {/* ข้อมูลพื้นฐาน */}
                <div className="col-md-6">
                  <h5 style={{ color: '#28a745', marginBottom: '20px' }}>📋 ข้อมูลพื้นฐาน</h5>
                  
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">ชื่อ-นามสกุล *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">อีเมล *</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">ชื่อผู้ใช้ *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      name="username"
                      value={profileData.username}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label">เบอร์โทรศัพท์</label>
                    <input
                      type="tel"
                      className="form-control"
                      id="phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      placeholder="0812345678"
                    />
                  </div>
                </div>

                {/* ข้อมูลการทำงาน */}
                <div className="col-md-6">
                  <h5 style={{ color: '#28a745', marginBottom: '20px' }}>💼 ข้อมูลการทำงาน</h5>
                  
                  <div className="mb-3">
                    <label htmlFor="department" className="form-label">แผนก/หน่วยงาน</label>
                    <input
                      type="text"
                      className="form-control"
                      id="department"
                      name="department"
                      value={profileData.department}
                      onChange={handleProfileChange}
                      placeholder="เช่น ฝ่ายกิจการนักศึกษา"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="position" className="form-label">ตำแหน่ง</label>
                    <input
                      type="text"
                      className="form-control"
                      id="position"
                      name="position"
                      value={profileData.position}
                      onChange={handleProfileChange}
                      placeholder="เช่น เจ้าหน้าที่กิจการนักศึกษา"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="address" className="form-label">ที่อยู่</label>
                    <textarea
                      className="form-control"
                      id="address"
                      name="address"
                      value={profileData.address}
                      onChange={handleProfileChange}
                      rows="4"
                      placeholder="กรอกที่อยู่"
                    />
                  </div>
                </div>
              </div>

              <div className="text-center mt-4">
                <button
                  type="submit"
                  className="btn"
                  disabled={loading}
                  style={{ 
                    padding: '12px 40px', 
                    backgroundColor: '#28a745',
                    border: 'none',
                    borderRadius: '25px',
                    color: 'white',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(40,167,69,0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#218838'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(40,167,69,0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#28a745'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(40,167,69,0.3)'
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      💾 บันทึกข้อมูล
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit}>
              <div className="row justify-content-center">
                <div className="col-md-6">
                  <h5 style={{ color: '#28a745', marginBottom: '20px' }}>🔐 เปลี่ยนรหัสผ่าน</h5>
                  
                  <div className="mb-3">
                    <label htmlFor="currentPassword" className="form-label">รหัสผ่านปัจจุบัน *</label>
                    <input
                      type="password"
                      className="form-control"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="กรอกรหัสผ่านปัจจุบัน"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label">รหัสผ่านใหม่ *</label>
                    <input
                      type="password"
                      className="form-control"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">ยืนยันรหัสผ่านใหม่ *</label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="ยืนยันรหัสผ่านใหม่"
                    />
                  </div>

                  <div className="text-center">
                    <button
                      type="submit"
                      className="btn"
                      disabled={loading}
                      style={{ 
                        padding: '12px 40px', 
                        backgroundColor: '#ffc107',
                        border: 'none',
                        borderRadius: '25px',
                        color: '#333',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(255,193,7,0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e0a800'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,193,7,0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffc107'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(255,193,7,0.3)'
                      }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          กำลังเปลี่ยน...
                        </>
                      ) : (
                        <>
                          🔑 เปลี่ยนรหัสผ่าน
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default StaffProfile
