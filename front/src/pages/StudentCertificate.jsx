import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const StudentCertificate = () => {
  const { user } = useAuth()
  const [eligibility, setEligibility] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    checkEligibility()
  }, [])

  const checkEligibility = async () => {
    try {
      const response = await api.get('/certificate/check-eligibility')
      if (response.data.success) {
        setEligibility(response.data.data)
      }
    } catch (error) {
      console.error('Failed to check eligibility:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadCertificate = async () => {
    if (!user || !eligibility?.isEligible) return

    setDownloading(true)
    try {
      const response = await api.get(`/certificate/generate/${user.id}`, {
        responseType: 'blob'
      })

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `certificate_${user.student_id || user.id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download certificate:', error)
      alert('ไม่สามารถดาวน์โหลดใบประกาศได้')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <p className="mt-3">กำลังตรวจสอบสิทธิ์ใบประกาศ...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card" style={{
            borderRadius: '15px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            border: 'none'
          }}>
            <div className="card-header" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '15px 15px 0 0',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>
                <i className="fas fa-certificate me-3"></i>
                ใบประกาศนียบัตร
              </h2>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                ใบประกาศสำหรับนักเรียนที่ทำกิจกรรมครบตามที่กำหนด
              </p>
            </div>

            <div className="card-body" style={{ padding: '2rem' }}>
              {eligibility?.isEligible ? (
                <div>
                  {/* Success State */}
                  <div className="text-center mb-4">
                    <div style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.5rem',
                      boxShadow: '0 8px 25px rgba(40, 167, 69, 0.3)'
                    }}>
                      <i className="fas fa-check" style={{ fontSize: '48px', color: 'white' }}></i>
                    </div>
                    <h3 style={{ color: '#28a745', marginBottom: '1rem' }}>
                      ยินดีด้วย! คุณมีสิทธิ์ได้รับใบประกาศ
                    </h3>
                    <p style={{ color: '#6c757d', fontSize: '1.1rem' }}>
                      คุณได้ทำกิจกรรมครบ <strong>{eligibility.totalHours}</strong> ชั่วโมง 
                      จากที่กำหนด <strong>{eligibility.requiredHours}</strong> ชั่วโมงแล้ว
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontWeight: '600', color: '#2c3e50' }}>ความคืบหน้า</span>
                      <span style={{ fontWeight: '600', color: '#28a745' }}>
                        {eligibility.totalHours}/{eligibility.requiredHours} ชั่วโมง
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '12px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                        borderRadius: '6px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <div className="text-center">
                    <button
                      onClick={downloadCertificate}
                      disabled={downloading}
                      className="btn btn-primary btn-lg"
                      style={{
                        padding: '1rem 2rem',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                        border: 'none',
                        boxShadow: '0 8px 25px rgba(0, 123, 255, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)'
                        e.target.style.boxShadow = '0 12px 35px rgba(0, 123, 255, 0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = '0 8px 25px rgba(0, 123, 255, 0.3)'
                      }}
                    >
                      {downloading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          กำลังสร้างใบประกาศ...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-download me-2"></i>
                          ดาวน์โหลดใบประกาศ (PDF)
                        </>
                      )}
                    </button>
                  </div>

                  {/* Info */}
                  <div className="mt-4 p-3" style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '10px',
                    border: '1px solid #e9ecef'
                  }}>
                    <h6 style={{ color: '#495057', marginBottom: '0.5rem' }}>
                      <i className="fas fa-info-circle me-2"></i>
                      ข้อมูลใบประกาศ
                    </h6>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6c757d' }}>
                      <li>ใบประกาศจะแสดงชื่อและรหัสนักศึกษาของคุณ</li>
                      <li>สามารถพิมพ์หรือบันทึกเป็นไฟล์ PDF ได้</li>
                      <li>ใบประกาศมีลายเซ็นดิจิทัลเพื่อความปลอดภัย</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Not Eligible State */}
                  <div className="text-center mb-4">
                    <div style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.5rem',
                      boxShadow: '0 8px 25px rgba(255, 193, 7, 0.3)'
                    }}>
                      <i className="fas fa-clock" style={{ fontSize: '48px', color: 'white' }}></i>
                    </div>
                    <h3 style={{ color: '#ffc107', marginBottom: '1rem' }}>
                      ยังไม่ครบชั่วโมงที่กำหนด
                    </h3>
                    <p style={{ color: '#6c757d', fontSize: '1.1rem' }}>
                      คุณต้องทำกิจกรรมให้ครบ <strong>{eligibility.requiredHours}</strong> ชั่วโมง 
                      ถึงจะได้รับใบประกาศ
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontWeight: '600', color: '#2c3e50' }}>ความคืบหน้า</span>
                      <span style={{ fontWeight: '600', color: '#ffc107' }}>
                        {eligibility.totalHours}/{eligibility.requiredHours} ชั่วโมง
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '12px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(eligibility.totalHours / eligibility.requiredHours) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
                        borderRadius: '6px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>

                  {/* Remaining Hours */}
                  <div className="text-center">
                    <div className="p-4" style={{
                      backgroundColor: '#fff3cd',
                      borderRadius: '10px',
                      border: '1px solid #ffeaa7'
                    }}>
                      <h5 style={{ color: '#856404', marginBottom: '0.5rem' }}>
                        <i className="fas fa-hourglass-half me-2"></i>
                        ยังขาดอีก {eligibility.remainingHours} ชั่วโมง
                      </h5>
                      <p style={{ color: '#856404', margin: 0 }}>
                        เข้าร่วมกิจกรรมเพิ่มเติมเพื่อให้ครบตามที่กำหนด
                      </p>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="text-center mt-4">
                    <a
                      href="/activities"
                      className="btn btn-outline-primary btn-lg"
                      style={{
                        padding: '1rem 2rem',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        borderRadius: '10px',
                        textDecoration: 'none'
                      }}
                    >
                      <i className="fas fa-calendar-alt me-2"></i>
                      ดูกิจกรรมที่มี
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentCertificate
