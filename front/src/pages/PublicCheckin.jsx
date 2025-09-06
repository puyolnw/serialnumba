import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const PublicCheckin = () => {
  const { slug } = useParams();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    identifier_type: 'EMAIL',
    identifier_value: '',
    name: '',
    student_code: ''
  });
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    fetchActivity();
  }, [slug]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/public/activity/${slug}`);
      if (response.data.success) {
        setActivity(response.data.data);
      } else {
        setError('Activity not found');
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
      setError('Failed to load activity information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.identifier_value.trim()) {
      setError('กรุณากรอกอีเมลของคุณ');
      return;
    }

    if (!formData.name.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุลของคุณ');
      return;
    }

    if (!formData.student_code.trim()) {
      setError('กรุณากรอกรหัสนิสิตของคุณ');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.identifier_value)) {
      setError('กรุณากรอกอีเมลที่ถูกต้อง');
      return;
    }

    try {
      setSubmitting(true);
      setMessage('');
      setError('');
      
      const response = await api.post(`/public/checkin/${slug}`, {
        identifier_type: 'EMAIL',
        identifier_value: formData.identifier_value,
        name: formData.name.trim(),
        student_code: formData.student_code.trim()
      });
      
      if (response.data.success) {
        setMessage('ลงทะเบียนสำเร็จ! กรุณารอการส่งอีเมลจากแอดมินเพื่อยืนยันการเข้าร่วมกิจกรรม');
        setEmailSent(true);
        setFormData({ 
          identifier_type: 'EMAIL', 
          identifier_value: '', 
          name: '', 
          student_code: '' 
        });
      }
    } catch (error) {
      console.error('Error checking in:', error);
      if (error.response?.data?.message?.includes('already checked in')) {
        setError('อีเมลนี้ได้ลงทะเบียนเข้าร่วมกิจกรรมนี้แล้ว');
      } else {
        setError(error.response?.data?.message || 'ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear messages when user starts typing
    if (message || error) {
      setMessage('');
      setError('');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid #2563eb',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }}></div>
          <p style={{ color: '#374151', fontSize: '18px', fontWeight: '500' }}>
            กำลังโหลดข้อมูลกิจกรรม...
          </p>
        </div>
      </div>
    );
  }

  if (error && !activity) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fef2f2 0%, #fce7f3 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '448px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            padding: '32px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <svg style={{ width: '32px', height: '32px', color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
              ไม่พบกิจกรรม
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>{error}</p>
            <a href="/" style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 24px',
              backgroundColor: '#2563eb',
              color: 'white',
              fontWeight: '500',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'background-color 0.2s'
            }}>
              <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              กลับหน้าหลัก
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #f3e8ff 100%)',
      padding: '48px 0'
    }}>
      <div style={{ maxWidth: '512px', margin: '0 auto', padding: '0 16px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <svg style={{ width: '40px', height: '40px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 style={{
            fontSize: '30px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '8px'
          }}>
            ลงทะเบียนเข้าร่วมกิจกรรม
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            กรอกอีเมลของคุณเพื่อลงทะเบียนเข้าร่วมกิจกรรม
          </p>
        </div>

        {/* Activity Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          padding: '32px',
          marginBottom: '32px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '16px'
            }}>
              {activity?.title}
            </h2>
            {activity?.description && (
              <p style={{
                color: '#6b7280',
                marginBottom: '24px',
                lineHeight: '1.6'
              }}>
                {activity.description}
              </p>
            )}
            
            <div style={{
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#dbeafe',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px'
                  }}>
                    <svg style={{ width: '24px', height: '24px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>วันที่จัด</p>
                  <p style={{ fontWeight: '600', color: '#111827' }}>
                    {new Date(activity?.start_date).toLocaleDateString('th-TH')}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#dcfce7',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px'
                  }}>
                    <svg style={{ width: '24px', height: '24px', color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>ชั่วโมงที่ได้รับ</p>
                  <p style={{ fontWeight: '600', color: '#111827' }}>
                    {activity?.hours_awarded} ชั่วโมง
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div style={{
            marginBottom: '24px',
            padding: '24px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#dcfce7',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                flexShrink: 0
              }}>
                <svg style={{ width: '20px', height: '20px', color: '#16a34a' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontWeight: '600', color: '#166534', marginBottom: '4px' }}>ส่งอีเมลสำเร็จ!</h3>
                <p style={{ color: '#15803d' }}>{message}</p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div style={{
            marginBottom: '24px',
            padding: '24px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#fee2e2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                flexShrink: 0
              }}>
                <svg style={{ width: '20px', height: '20px', color: '#dc2626' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontWeight: '600', color: '#991b1b', marginBottom: '4px' }}>เกิดข้อผิดพลาด</h3>
                <p style={{ color: '#dc2626' }}>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Check-in Form */}
        {!emailSent && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            padding: '32px'
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Name Field */}
              <div>
                <label htmlFor="name" style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <svg style={{ width: '20px', height: '20px', color: '#2563eb', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    ชื่อ-นามสกุล *
                  </div>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="กรอกชื่อ-นามสกุลของคุณ"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Student Code Field */}
              <div>
                <label htmlFor="student_code" style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <svg style={{ width: '20px', height: '20px', color: '#2563eb', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    รหัสนิสิต *
                  </div>
                </label>
                <input
                  type="text"
                  id="student_code"
                  name="student_code"
                  value={formData.student_code}
                  onChange={handleChange}
                  placeholder="กรอกรหัสนิสิตของคุณ"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="identifier_value" style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <svg style={{ width: '20px', height: '20px', color: '#2563eb', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    อีเมลของคุณ *
                  </div>
                </label>
                <input
                  type="email"
                  id="identifier_value"
                  name="identifier_value"
                  value={formData.identifier_value}
                  onChange={handleChange}
                  placeholder="กรอกอีเมลของคุณ เช่น example@email.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '12px',
                    fontSize: '18px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2563eb';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                  disabled={submitting}
                  required
                />
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                  อีเมล 1 ตัวสามารถลงทะเบียนได้ 1 ครั้งเท่านั้น
                </p>
              </div>
              
              <button
                type="submit"
                disabled={submitting || !formData.identifier_value.trim()}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                  color: 'white',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: submitting || !formData.identifier_value.trim() ? 'not-allowed' : 'pointer',
                  opacity: submitting || !formData.identifier_value.trim() ? 0.5 : 1,
                  transition: 'all 0.2s',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (!submitting && formData.identifier_value.trim()) {
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.background = 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)';
                }}
              >
                {submitting ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '12px'
                    }}></div>
                    กำลังส่งอีเมล...
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: '24px', height: '24px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    ส่งอีเมลลงทะเบียน
                  </div>
                )}
              </button>
            </form>
          </div>
        )}
        
        {/* Important Notes */}
        <div style={{
          marginTop: '32px',
          padding: '24px',
          background: 'linear-gradient(135deg, #fffbeb 0%, #fed7aa 100%)',
          border: '1px solid #fed7aa',
          borderRadius: '12px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <svg style={{ width: '20px', height: '20px', color: '#d97706', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ข้อมูลสำคัญ
          </h3>
          <ul style={{ fontSize: '14px', color: '#374151', listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
              <svg style={{ width: '16px', height: '16px', color: '#d97706', marginRight: '8px', marginTop: '2px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              การเข้าร่วมจะได้รับการยืนยันโดยแอดมิน
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
              <svg style={{ width: '16px', height: '16px', color: '#d97706', marginRight: '8px', marginTop: '2px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              คุณจะได้รับรหัสซีเรียลผ่านอีเมลจากแอดมิน
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
              <svg style={{ width: '16px', height: '16px', color: '#d97706', marginRight: '8px', marginTop: '2px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              อีเมล 1 ตัวสามารถลงทะเบียนได้ 1 ครั้งเท่านั้น
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start' }}>
              <svg style={{ width: '16px', height: '16px', color: '#d97706', marginRight: '8px', marginTop: '2px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              ติดต่อเจ้าหน้าที่หากมีปัญหา
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PublicCheckin;
