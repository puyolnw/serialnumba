import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const StudentSerialHistory = () => {
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { user } = useAuth();

  useEffect(() => {
    fetchHistory();
  }, [currentPage]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/student/serial-history?page=${currentPage}&limit=${itemsPerPage}`);
      if (response.data.success) {
        setHistory(response.data.data.history || []);
        setPagination(response.data.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0
        });
      } else {
        setError('ไม่สามารถโหลดประวัติ Serial ได้');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setError('ไม่สามารถโหลดประวัติ Serial ได้');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'REDEEMED':
        return { backgroundColor: '#d4edda', color: '#155724', text: 'แลกแล้ว' };
      case 'SENT':
        return { backgroundColor: '#cce7ff', color: '#004085', text: 'ส่งแล้ว' };
      case 'PENDING':
        return { backgroundColor: '#fff3cd', color: '#856404', text: 'รอดำเนินการ' };
      default:
        return { backgroundColor: '#f8f9fa', color: '#495057', text: status };
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <p className="mt-3">กำลังโหลดประวัติ Serial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="alert alert-danger" style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #f5c6cb'
        }}>
          <strong>เกิดข้อผิดพลาด:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      {/* Header Section */}
      <div style={{
        background: 'linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(111,66,193,0.3)'
      }}>
        <div className="row align-items-center">
          <div className="col-md-8">
            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', fontWeight: 'bold' }}>
              📚 ประวัติ Serial
            </h1>
            <p style={{ fontSize: '1.2rem', margin: 0, opacity: 0.9 }}>
              สวัสดี {user?.name}! นี่คือประวัติการแลก Serial Code ของคุณ
            </p>
          </div>
          <div className="col-md-4 text-end">
            <div style={{ fontSize: '4rem', opacity: 0.8 }}>📋</div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="card mb-4" style={{ border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
        <div className="card-body">
          <div className="row text-center">
            <div className="col-md-4">
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#28a745' }}>📊</div>
                <h3 style={{ margin: 0, color: '#333' }}>{pagination.totalItems || 0}</h3>
                <p style={{ margin: '5px 0 0 0', color: '#666' }}>Serial ทั้งหมด</p>
              </div>
            </div>
            <div className="col-md-4">
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#007bff' }}>⏱️</div>
                <h3 style={{ margin: 0, color: '#333' }}>
                  {history.reduce((sum, item) => sum + item.hours_earned, 0)}
                </h3>
                <p style={{ margin: '5px 0 0 0', color: '#666' }}>ชั่วโมงรวม</p>
              </div>
            </div>
            <div className="col-md-4">
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#ffc107' }}>✅</div>
                <h3 style={{ margin: 0, color: '#333' }}>
                  {history.filter(item => item.serial.status === 'REDEEMED').length}
                </h3>
                <p style={{ margin: '5px 0 0 0', color: '#666' }}>แลกสำเร็จ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {history.length > 0 ? (
        <>
          {/* History Cards */}
          <div className="card" style={{ border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
            <div className="card-header" style={{ backgroundColor: '#f8f9fa', border: 'none' }}>
              <h4 style={{ margin: 0, color: '#333' }}>📋 รายการ Serial ทั้งหมด</h4>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: '20px' }}>
                {history.map((item, index) => {
                  const statusInfo = getStatusColor(item.serial.status);
                  return (
                    <div key={index} style={{
                      padding: '25px',
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      border: '1px solid #e9ecef',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 5px 20px rgba(0,0,0,0.1)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}>
                      <div className="row align-items-center">
                        <div className="col-md-1">
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            backgroundColor: '#007bff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '1.5rem'
                          }}>
                            🎫
                          </div>
                        </div>
                        <div className="col-md-4">
                          <h6 style={{ marginBottom: '5px', color: '#333', fontWeight: 'bold' }}>
                            {item.activity.title}
                          </h6>
                          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                            วันที่กิจกรรม: {formatDate(item.activity.start_date)}
                          </p>
                        </div>
                        <div className="col-md-2">
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333', fontFamily: 'monospace' }}>
                              {item.serial.code}
                            </div>
                            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '12px' }}>Serial Code</p>
                          </div>
                        </div>
                        <div className="col-md-2">
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              padding: '8px 16px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              borderRadius: '20px',
                              fontSize: '1.1rem',
                              fontWeight: 'bold',
                              display: 'inline-block'
                            }}>
                              +{item.hours_earned} ชั่วโมง
                            </div>
                          </div>
                        </div>
                        <div className="col-md-2">
                          <div style={{ textAlign: 'center' }}>
                            <span style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              backgroundColor: statusInfo.backgroundColor,
                              color: statusInfo.color
                            }}>
                              {statusInfo.text}
                            </span>
                          </div>
                        </div>
                        <div className="col-md-1">
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
                              {formatDate(item.redeemed_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * itemsPerPage) + 1} to{' '}
                {Math.min(pagination.currentPage * itemsPerPage, pagination.totalItems)} of{' '}
                {pagination.totalItems} results
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
          <div className="card-body text-center" style={{ padding: '60px 20px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}>📋</div>
            <h4 style={{ color: '#666', marginBottom: '10px' }}>ยังไม่มีประวัติ Serial</h4>
            <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>
              คุณยังไม่ได้แลก Serial Code ใดๆ เริ่มเข้าร่วมกิจกรรมเพื่อรับชั่วโมงกันเถอะ!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSerialHistory;
