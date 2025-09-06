import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const ActivityNotificationModal = ({ isOpen, onClose, activities }) => {
  const navigate = useNavigate()

  // Prevent body scroll when modal is open and handle ESC key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      
      const handleEscKey = (event) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }
      
      document.addEventListener('keydown', handleEscKey)
      
      return () => {
        document.body.style.overflow = 'unset'
        document.removeEventListener('keydown', handleEscKey)
      }
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  console.log('ActivityNotificationModal render:', { isOpen, activitiesCount: activities?.length })

  if (!isOpen) return null

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'วันนี้'
    if (diffDays === 1) return 'พรุ่งนี้'
    return `อีก ${diffDays} วัน`
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const handleActivityClick = (activityId) => {
    navigate(`/activities/${activityId}`)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8f9fa'
        }}>
          <h5 style={{ margin: 0, color: '#2c3e50', fontWeight: '600' }}>
            <i className="fas fa-calendar-alt" style={{ marginRight: '8px', color: '#007bff' }}></i>
            กิจกรรมที่ใกล้เข้ามา
          </h5>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6c757d',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e9ecef'
              e.target.style.color = '#dc3545'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.color = '#6c757d'
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: '20px',
          flex: 1,
          overflowY: 'auto'
        }}>
          {activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <i className="fas fa-calendar-check" style={{ 
                fontSize: '48px', 
                color: '#6c757d', 
                marginBottom: '16px',
                display: 'block'
              }}></i>
              <p style={{ color: '#6c757d', margin: 0, fontSize: '16px' }}>
                ไม่มีกิจกรรมที่ใกล้เข้ามาใน 2 วันข้างหน้า
              </p>
            </div>
          ) : (
            <div>
              {activities.map((activity) => (
                <div 
                  key={activity.id}
                  style={{
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#fff'
                  }}
                  onClick={() => handleActivityClick(activity.id)}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa'
                    e.target.style.borderColor = '#007bff'
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff'
                    e.target.style.borderColor = '#e9ecef'
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, marginRight: '16px' }}>
                      <h6 style={{ 
                        margin: '0 0 8px 0', 
                        color: '#007bff', 
                        fontSize: '16px',
                        fontWeight: '600'
                      }}>
                        {activity.title}
                      </h6>
                      <p style={{ 
                        margin: '0 0 8px 0', 
                        color: '#6c757d', 
                        fontSize: '14px',
                        lineHeight: '1.4'
                      }}>
                        {activity.description && activity.description.length > 100 
                          ? `${activity.description.substring(0, 100)}...` 
                          : activity.description
                        }
                      </p>
                      <small style={{ color: '#6c757d', fontSize: '12px' }}>
                        <i className="fas fa-user" style={{ marginRight: '4px' }}></i>
                        โดย: {activity.creator?.name || 'ไม่ระบุ'}
                      </small>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '120px' }}>
                      <div style={{ 
                        color: '#ffc107', 
                        fontWeight: '600', 
                        fontSize: '14px',
                        marginBottom: '4px'
                      }}>
                        <i className="fas fa-clock" style={{ marginRight: '4px' }}></i>
                        {formatDate(activity.start_date)}
                      </div>
                      <div style={{ 
                        color: '#6c757d', 
                        fontSize: '12px',
                        marginBottom: '8px'
                      }}>
                        {formatTime(activity.start_date)}
                      </div>
                      <span style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {activity.hours_awarded} ชั่วโมง
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          backgroundColor: '#f8f9fa'
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #6c757d',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: '#6c757d',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#6c757d'
              e.target.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.color = '#6c757d'
            }}
          >
            ปิด
          </button>
          <button 
            onClick={() => {
              navigate('/activities')
              onClose()
            }}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#007bff',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#0056b3'
              e.target.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#007bff'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            <i className="fas fa-calendar-alt" style={{ marginRight: '4px' }}></i>
            ดูปฏิทินกิจกรรม
          </button>
        </div>
      </div>
    </div>
  )
}

export default ActivityNotificationModal
