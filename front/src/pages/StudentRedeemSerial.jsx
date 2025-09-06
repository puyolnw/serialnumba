import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const StudentRedeemSerial = () => {
  const [serialCode, setSerialCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pendingReviews, setPendingReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedSerial, setSelectedSerial] = useState(null);
  const [reviewData, setReviewData] = useState({
    fun_rating: 5,
    learning_rating: 5,
    organization_rating: 5,
    venue_rating: 5,
    overall_rating: 5,
    suggestion: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    try {
      const response = await api.get('/student/pending-reviews');
      if (response.data.success) {
        setPendingReviews(response.data.data.pendingReviews);
      }
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!serialCode.trim()) {
      setError('กรุณากรอกรหัส Serial');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      setError('');
      
      const response = await api.post('/student/redeem-serial', {
        code: serialCode.trim().toUpperCase()
      });
      
      if (response.data.success) {
        if (response.data.data.requiresReview) {
          // ต้องรีวิวก่อน เปิดหน้ารีวิวทันที
          setSelectedSerial({
            id: response.data.data.serialHistoryId,
            activityTitle: response.data.data.activityTitle,
            hoursAwarded: response.data.data.hoursAwarded,
            serialCode: response.data.data.serialCode
          });
          setShowReviewModal(true);
          setMessage('');
        } else {
          setMessage(`สำเร็จ! คุณได้รับ ${response.data.data.hoursEarned} ชั่วโมงจาก "${response.data.data.activityTitle}"`);
        }
        setSerialCode('');
        // รีเฟรชรายการที่รอรีวิว
        fetchPendingReviews();
      }
    } catch (error) {
      console.error('Error redeeming serial:', error);
      setError(error.response?.data?.message || 'ไม่สามารถแลก Serial ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setSerialCode(e.target.value.toUpperCase());
    // Clear messages when user starts typing
    if (message || error) {
      setMessage('');
      setError('');
    }
  };

  const openReviewModal = (serial) => {
    setSelectedSerial(serial);
    setReviewData({
      fun_rating: 5,
      learning_rating: 5,
      organization_rating: 5,
      venue_rating: 5,
      overall_rating: 5,
      suggestion: ''
    });
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedSerial(null);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await api.post('/student/submit-review', {
        serial_id: selectedSerial.id,
        ...reviewData
      });
      
      if (response.data.success) {
        setMessage(response.data.message || 'รีวิวสำเร็จ! ขอบคุณสำหรับความคิดเห็น');
        closeReviewModal();
        fetchPendingReviews();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError(error.response?.data?.message || 'ไม่สามารถส่งรีวิวได้');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewChange = (field, value) => {
    console.log('handleReviewChange called:', field, value); // Debug log
    setReviewData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      console.log('New review data:', newData); // Debug log
      return newData;
    });
  };

  const renderStars = (rating, onChange) => {
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className="star-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Star clicked:', star, 'Current rating:', rating); // Debug log
              onChange(star);
            }}
            style={{
              background: star <= rating ? 'rgba(255, 193, 7, 0.2)' : 'rgba(0,0,0,0.05)',
              border: star <= rating ? '2px solid #ffc107' : '2px solid #e9ecef',
              fontSize: '2rem',
              cursor: 'pointer',
              color: star <= rating ? '#ffc107' : '#adb5bd',
              padding: '10px',
              borderRadius: '10px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '45px',
              minHeight: '45px',
              boxShadow: star <= rating ? '0 4px 12px rgba(255, 193, 7, 0.4)' : '0 2px 4px rgba(0,0,0,0.1)',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.15)';
              e.target.style.boxShadow = '0 6px 16px rgba(255, 193, 7, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = star <= rating ? '0 4px 12px rgba(255, 193, 7, 0.4)' : '0 2px 4px rgba(0,0,0,0.1)';
            }}
            onMouseDown={(e) => {
              e.target.style.transform = 'scale(0.9)';
            }}
            onMouseUp={(e) => {
              e.target.style.transform = 'scale(1.1)';
            }}
          >
            ⭐
          </button>
        ))}
        <span style={{ 
          marginLeft: '15px', 
          fontSize: '16px', 
          color: '#495057',
          fontWeight: '600',
          backgroundColor: '#f8f9fa',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #e9ecef'
        }}>
          {rating ? `${rating}/5` : '0/5'}
        </span>
      </div>
    );
  };

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      {/* Header Section */}
      <div style={{
        background: 'linear-gradient(135deg, #ffc107 0%, #ff8c00 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(255,193,7,0.3)'
      }}>
        <div className="row align-items-center">
          <div className="col-md-8">
            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', fontWeight: 'bold' }}>
              🎫 แลก Serial Code
            </h1>
            <p style={{ fontSize: '1.2rem', margin: 0, opacity: 0.9 }}>
              สวัสดี {user?.name}! กรอกรหัส Serial เพื่อรับชั่วโมงกิจกรรม
            </p>
          </div>
          <div className="col-md-4 text-end">
            <div style={{ fontSize: '4rem', opacity: 0.8 }}>🎁</div>
          </div>
        </div>
      </div>

      {/* Redeem Serial Form */}
      <div className="card mb-4" style={{ border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
        <div className="card-header" style={{ backgroundColor: '#f8f9fa', border: 'none' }}>
          <h4 style={{ margin: 0, color: '#333' }}>💳 แลก Serial Code</h4>
        </div>
        <div className="card-body">
          {message && (
            <div className="alert alert-success" style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #c3e6cb'
            }}>
              <strong>สำเร็จ!</strong> {message}
            </div>
          )}

          {error && (
            <div className="alert alert-danger" style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #f5c6cb'
            }}>
              <strong>เกิดข้อผิดพลาด:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="serialCode" className="form-label">รหัส Serial Code</label>
              <input
                type="text"
                className="form-control"
                id="serialCode"
                value={serialCode}
                onChange={handleChange}
                placeholder="กรอกรหัส Serial Code ที่ได้รับ"
                style={{ fontSize: '1.1rem', padding: '12px' }}
                required
              />
            </div>
            <div className="text-center">
              <button
                type="submit"
                className="btn btn-warning"
                disabled={loading}
                style={{ padding: '12px 30px', fontSize: '1.1rem' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    กำลังแลก...
                  </>
                ) : (
                  <>
                    🎫 แลก Serial Code
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <div className="card" style={{ border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
          <div className="card-header" style={{ backgroundColor: '#f8f9fa', border: 'none' }}>
            <h4 style={{ margin: 0, color: '#333' }}>⭐ รีวิวกิจกรรมที่รอรีวิว</h4>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              กรุณารีวิวกิจกรรมเหล่านี้เพื่อให้ระบบสมบูรณ์
            </p>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gap: '15px' }}>
              {pendingReviews.map((item) => (
                <div key={item.id} style={{
                  padding: '20px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '10px',
                  border: '1px solid #ffeaa7'
                }}>
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <h6 style={{ marginBottom: '5px', color: '#333', fontWeight: 'bold' }}>
                        {item.activity?.title}
                      </h6>
                      <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                        Serial: <strong>{item.serial?.code}</strong> • 
                        วันที่แลก: {new Date(item.redeemed_at).toLocaleDateString('th-TH')} • 
                        ได้รับ: <strong>{item.hours_earned} ชั่วโมง</strong>
                      </p>
                    </div>
                    <div className="col-md-4 text-end">
                      <button
                        onClick={() => openReviewModal(item)}
                        className="btn btn-primary"
                        style={{ padding: '8px 20px', fontSize: '14px' }}
                      >
                        ⭐ รีวิวกิจกรรม
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedSerial && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 style={{ margin: 0, color: '#333' }}>⭐ รีวิวกิจกรรม</h4>
              <button
                onClick={closeReviewModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ 
              marginBottom: '25px', 
              padding: '20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '12px',
              border: '1px solid #e9ecef'
            }}>
              <h6 style={{ margin: 0, color: '#333', fontWeight: 'bold' }}>
                {selectedSerial.activityTitle || selectedSerial.activity?.title}
              </h6>
              <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                Serial: <strong>{selectedSerial.serialCode || selectedSerial.serial?.code}</strong> • 
                จะได้รับ <strong style={{ color: '#28a745' }}>{selectedSerial.hoursAwarded || selectedSerial.hours_earned} ชั่วโมง</strong>
              </p>
            </div>

            <form onSubmit={handleReviewSubmit}>
              <div className="mb-4">
                <label className="form-label" style={{ fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
                  🎉 ความสนุก
                </label>
                <div style={{ marginBottom: '5px' }}>
                  {renderStars(reviewData.fun_rating, (rating) => handleReviewChange('fun_rating', rating))}
                </div>
                <small className="text-muted">ให้คะแนนความสนุกของกิจกรรม</small>
              </div>

              <div className="mb-4">
                <label className="form-label" style={{ fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
                  📚 การเรียนรู้
                </label>
                <div style={{ marginBottom: '5px' }}>
                  {renderStars(reviewData.learning_rating, (rating) => handleReviewChange('learning_rating', rating))}
                </div>
                <small className="text-muted">ให้คะแนนความรู้ที่ได้รับ</small>
              </div>

              <div className="mb-4">
                <label className="form-label" style={{ fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
                  🎯 การจัดงาน
                </label>
                <div style={{ marginBottom: '5px' }}>
                  {renderStars(reviewData.organization_rating, (rating) => handleReviewChange('organization_rating', rating))}
                </div>
                <small className="text-muted">ให้คะแนนการจัดงานและระบบ</small>
              </div>

              <div className="mb-4">
                <label className="form-label" style={{ fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
                  🏢 สถานที่
                </label>
                <div style={{ marginBottom: '5px' }}>
                  {renderStars(reviewData.venue_rating, (rating) => handleReviewChange('venue_rating', rating))}
                </div>
                <small className="text-muted">ให้คะแนนสถานที่และสิ่งอำนวยความสะดวก</small>
              </div>

              <div className="mb-4">
                <label className="form-label" style={{ fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
                  ⭐ คะแนนรวม
                </label>
                <div style={{ marginBottom: '5px' }}>
                  {renderStars(reviewData.overall_rating, (rating) => handleReviewChange('overall_rating', rating))}
                </div>
                <small className="text-muted">ให้คะแนนโดยรวมของกิจกรรม</small>
              </div>

              <div className="mb-4">
                <label htmlFor="suggestion" className="form-label" style={{ fontWeight: 'bold', color: '#333' }}>
                  💬 ข้อเสนอแนะ (ไม่บังคับ)
                </label>
                <textarea
                  className="form-control"
                  id="suggestion"
                  rows="4"
                  value={reviewData.suggestion}
                  onChange={(e) => handleReviewChange('suggestion', e.target.value)}
                  placeholder="กรอกข้อเสนอแนะหรือความคิดเห็นเพิ่มเติม..."
                  style={{ 
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
                <small className="text-muted">ช่วยให้เราปรับปรุงกิจกรรมในอนาคต</small>
              </div>

              {(!reviewData.fun_rating || !reviewData.learning_rating || !reviewData.organization_rating || !reviewData.venue_rating || !reviewData.overall_rating) && (
                <div className="alert alert-warning" style={{ 
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  color: '#856404',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <small>⚠️ กรุณาให้คะแนนทุกข้อเพื่อส่งรีวิว</small>
                </div>
              )}

              <div className="d-flex gap-3 justify-content-end" style={{ marginTop: '30px' }}>
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="btn btn-outline-secondary"
                  style={{ 
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !reviewData.fun_rating || !reviewData.learning_rating || !reviewData.organization_rating || !reviewData.venue_rating || !reviewData.overall_rating}
                  style={{ 
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    backgroundColor: '#007bff',
                    border: 'none'
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      กำลังส่ง...
                    </>
                  ) : (
                    <>
                      ⭐ ส่งรีวิว
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRedeemSerial;