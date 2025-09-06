import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { publicApi } from '../services/api'

const ActivityCalendar = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await publicApi.get('/activities')
      if (response.data.success) {
        setActivities(response.data.data.activities)
      } else {
        setError('ไม่สามารถโหลดกิจกรรมได้')
      }
    } catch (error) {
      setError('ไม่สามารถโหลดกิจกรรมได้')
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  // สร้างปฏิทิน
  const generateCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const calendar = []
    const current = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      calendar.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return calendar
  }

  // ตรวจสอบว่าวันนั้นมีกิจกรรมหรือไม่
  const getActivitiesForDate = (date) => {
    return activities.filter(activity => {
      const startDate = new Date(activity.start_date)
      const endDate = new Date(activity.end_date)
      const checkDate = new Date(date)
      
      // ตั้งเวลาเป็น 00:00:00 เพื่อเปรียบเทียบเฉพาะวันที่
      checkDate.setHours(0, 0, 0, 0)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(0, 0, 0, 0)
      
      return checkDate >= startDate && checkDate <= endDate
    })
  }

  // ตรวจสอบว่าวันนี้มีกิจกรรมหรือไม่
  const getTodayActivities = () => {
    const today = new Date()
    return getActivitiesForDate(today)
  }

  // ตรวจสอบว่าวันที่เลือกมีกิจกรรมหรือไม่
  const getSelectedDateActivities = () => {
    return getActivitiesForDate(selectedDate)
  }

  // เปลี่ยนเดือน
  const changeMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  // เลือกวันที่
  const selectDate = (date) => {
    setSelectedDate(new Date(date))
  }

  // เปิด modal แสดงรายละเอียดกิจกรรม
  const openActivityModal = (activity) => {
    setSelectedActivity(activity)
    setShowModal(true)
  }

  // ปิด modal
  const closeModal = () => {
    setShowModal(false)
    setSelectedActivity(null)
  }

  // จัดรูปแบบวันที่
  const formatDate = (date) => {
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // จัดรูปแบบเวลา
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // ตรวจสอบว่าเป็นวันนี้หรือไม่
  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // ตรวจสอบว่าเป็นเดือนปัจจุบันหรือไม่
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  // ตรวจสอบว่าเป็นวันที่เลือกหรือไม่
  const isSelectedDate = (date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  const calendar = generateCalendar()
  const todayActivities = getTodayActivities()
  const selectedDateActivities = getSelectedDateActivities()

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="text-center">
          <div>กำลังโหลดกิจกรรม...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="text-center mb-4">
        <h1 style={{ color: '#007bff', marginBottom: '10px' }}>📅 ปฏิทินกิจกรรม</h1>
        <p style={{ color: '#666' }}>ดูกิจกรรมทั้งหมดและกิจกรรมของวันนี้</p>
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

      {/* กิจกรรมวันนี้ */}
      {todayActivities.length > 0 && (
        <div className="card mb-4" style={{ border: '2px solid #28a745' }}>
          <div className="card-header" style={{ backgroundColor: '#28a745', color: 'white' }}>
            <h3 style={{ margin: 0 }}>🎯 กิจกรรมวันนี้ ({formatDate(new Date())})</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gap: '15px' }}>
              {todayActivities.map((activity) => (
                <div key={activity.id} className="card" style={{ border: '1px solid #dee2e6', cursor: 'pointer' }}
                     onClick={() => openActivityModal(activity)}>
                  <div className="card-body">
                    <h5 style={{ color: '#007bff', marginBottom: '10px' }}>{activity.title}</h5>
                    {activity.description && (
                      <p style={{ color: '#666', marginBottom: '10px' }}>{activity.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <div>
                        <strong>เวลาเริ่ม:</strong> {formatTime(activity.start_date)}
                      </div>
                      <div>
                        <strong>เวลาสิ้นสุด:</strong> {formatTime(activity.end_date)}
                      </div>
                      <div>
                        <strong>ชั่วโมงที่ได้รับ:</strong> {activity.hours_awarded} ชั่วโมง
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ปฏิทิน */}
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h3 style={{ margin: 0 }}>
              {currentDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}
            </h3>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-primary"
                onClick={() => changeMonth(-1)}
                style={{ padding: '5px 10px' }}
              >
                ‹
              </button>
              <button 
                className="btn btn-outline-primary"
                onClick={() => setCurrentDate(new Date())}
                style={{ padding: '5px 10px' }}
              >
                วันนี้
              </button>
              <button 
                className="btn btn-outline-primary"
                onClick={() => changeMonth(1)}
                style={{ padding: '5px 10px' }}
              >
                ›
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          {/* หัวตาราง */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: '1px',
            marginBottom: '10px'
          }}>
            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
              <div key={day} style={{ 
                textAlign: 'center', 
                fontWeight: 'bold', 
                padding: '10px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6'
              }}>
                {day}
              </div>
            ))}
          </div>

          {/* วันในปฏิทิน */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: '1px'
          }}>
            {calendar.map((date, index) => {
              const dayActivities = getActivitiesForDate(date)
              const hasActivities = dayActivities.length > 0
              
              return (
                <div
                  key={index}
                  onClick={() => selectDate(date)}
                  style={{
                    minHeight: '100px',
                    padding: '8px',
                    border: '1px solid #dee2e6',
                    backgroundColor: isSelectedDate(date) ? '#007bff' : 
                                   isToday(date) ? '#e3f2fd' : 
                                   isCurrentMonth(date) ? 'white' : '#f8f9fa',
                    color: isSelectedDate(date) ? 'white' : 
                           isCurrentMonth(date) ? 'black' : '#6c757d',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <div style={{ 
                    fontWeight: isToday(date) ? 'bold' : 'normal',
                    marginBottom: '5px'
                  }}>
                    {date.getDate()}
                  </div>
                  
                  {hasActivities && (
                    <div style={{ 
                      fontSize: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}>
                      {dayActivities.slice(0, 2).map(activity => (
                        <div
                          key={activity.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            openActivityModal(activity)
                          }}
                          style={{
                            backgroundColor: isSelectedDate(date) ? 'rgba(255,255,255,0.3)' : '#28a745',
                            color: isSelectedDate(date) ? 'white' : 'white',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            fontSize: '9px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = isSelectedDate(date) ? 'rgba(255,255,255,0.5)' : '#218838'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = isSelectedDate(date) ? 'rgba(255,255,255,0.3)' : '#28a745'
                          }}
                        >
                          {activity.title}
                        </div>
                      ))}
                      {dayActivities.length > 2 && (
                        <div style={{
                          color: isSelectedDate(date) ? 'white' : '#666',
                          fontSize: '8px',
                          textAlign: 'center'
                        }}>
                          +{dayActivities.length - 2} กิจกรรม
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* รายละเอียดกิจกรรมของวันที่เลือก */}
      {selectedDateActivities.length > 0 && (
        <div className="card mt-4">
          <div className="card-header">
            <h4 style={{ margin: 0 }}>
              กิจกรรมวันที่ {formatDate(selectedDate)}
            </h4>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gap: '15px' }}>
              {selectedDateActivities.map((activity) => (
                <div key={activity.id} className="card" style={{ border: '1px solid #dee2e6', cursor: 'pointer' }}
                     onClick={() => openActivityModal(activity)}>
                  <div className="card-body">
                    <h5 style={{ color: '#007bff', marginBottom: '10px' }}>{activity.title}</h5>
                    {activity.description && (
                      <p style={{ color: '#666', marginBottom: '10px' }}>{activity.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <div>
                        <strong>เวลาเริ่ม:</strong> {formatTime(activity.start_date)}
                      </div>
                      <div>
                        <strong>เวลาสิ้นสุด:</strong> {formatTime(activity.end_date)}
                      </div>
                      <div>
                        <strong>ชั่วโมงที่ได้รับ:</strong> {activity.hours_awarded} ชั่วโมง
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span className={`badge ${activity.status === 'OPEN' ? 'badge-success' : 'badge-secondary'}`} style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: activity.status === 'OPEN' ? '#28a745' : '#6c757d',
                        color: 'white'
                      }}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ข้อความเมื่อไม่มีกิจกรรม */}
      {activities.length === 0 && (
        <div className="card text-center">
          <div style={{ padding: '40px' }}>
            <h3>ไม่มีกิจกรรม</h3>
            <p style={{ color: '#666' }}>
              ยังไม่มีกิจกรรมที่เปิดให้เข้าร่วม กรุณาติดตามข่าวสารจากเรา
            </p>
          </div>
        </div>
      )}


      {/* Modal แสดงรายละเอียดกิจกรรม */}
      {showModal && selectedActivity && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }} onClick={closeModal}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #007bff',
              paddingBottom: '15px'
            }}>
              <h3 style={{ 
                color: '#007bff', 
                margin: 0,
                fontSize: '1.5rem'
              }}>
                📋 รายละเอียดกิจกรรม
              </h3>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '5px'
                }}
              >
                ✕
              </button>
            </div>

            {/* เนื้อหากิจกรรม */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                color: '#333', 
                marginBottom: '15px',
                fontSize: '1.3rem'
              }}>
                {selectedActivity.title}
              </h4>
              
              {selectedActivity.description && (
                <p style={{ 
                  color: '#666', 
                  marginBottom: '20px',
                  lineHeight: '1.6'
                }}>
                  {selectedActivity.description}
                </p>
              )}

              {/* รายละเอียดสำคัญ */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'grid', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '20px', 
                      marginRight: '10px',
                      color: '#28a745'
                    }}>
                      ⏰
                    </span>
                    <div>
                      <strong>เวลาเริ่ม:</strong> {formatTime(selectedActivity.start_date)}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '20px', 
                      marginRight: '10px',
                      color: '#dc3545'
                    }}>
                      🏁
                    </span>
                    <div>
                      <strong>เวลาสิ้นสุด:</strong> {formatTime(selectedActivity.end_date)}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '20px', 
                      marginRight: '10px',
                      color: '#ffc107'
                    }}>
                      🏆
                    </span>
                    <div>
                      <strong>ชั่วโมงที่ได้รับ:</strong> 
                      <span style={{ 
                        color: '#28a745', 
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        marginLeft: '5px'
                      }}>
                        {selectedActivity.hours_awarded} ชั่วโมง
                      </span>
                    </div>
                  </div>

                  {selectedActivity.location && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '20px', 
                        marginRight: '10px',
                        color: '#17a2b8'
                      }}>
                        📍
                      </span>
                      <div>
                        <strong>สถานที่:</strong> {selectedActivity.location}
                      </div>
                    </div>
                  )}

                  {selectedActivity.max_participants && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '20px', 
                        marginRight: '10px',
                        color: '#6f42c1'
                      }}>
                        👥
                      </span>
                      <div>
                        <strong>จำนวนผู้เข้าร่วมสูงสุด:</strong> {selectedActivity.max_participants} คน
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* สถานะกิจกรรม */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '20px',
                gap: '10px'
              }}>
                <span style={{ fontWeight: 'bold' }}>สถานะ:</span>
                <span className={`badge ${selectedActivity.status === 'OPEN' ? 'badge-success' : 'badge-secondary'}`} style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  backgroundColor: selectedActivity.status === 'OPEN' ? '#28a745' : '#6c757d',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {selectedActivity.status === 'OPEN' ? '🟢 เปิดรับสมัคร' : '🔴 ปิดรับสมัคร'}
                </span>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActivityCalendar
