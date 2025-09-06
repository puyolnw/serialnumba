import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ActivityReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    category: ''
  });

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchData();
    }
  }, [user, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/reports/activities', { params: filters });
      setData(response.data.data);
    } catch (error) {
      console.error('Error fetching activity reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const exportToExcel = async () => {
    try {
      const response = await api.get('/admin/reports/activities/export/excel', {
        params: filters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activity-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  const exportToPDF = async () => {
    try {
      const response = await api.get('/admin/reports/activities/export/pdf', {
        params: filters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activity-reports-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  };

  // Chart configurations
  const participationTrendConfig = {
    labels: data?.participationTrend?.map(item => item.month) || [],
    datasets: [{
      label: 'จำนวนผู้เข้าร่วม',
      data: data?.participationTrend?.map(item => item.participants) || [],
      borderColor: '#4ECDC4',
      backgroundColor: 'rgba(78, 205, 196, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4
    }]
  };

  const activityStatusConfig = {
    labels: data?.activityStatus?.map(item => item.status) || [],
    datasets: [{
      label: 'จำนวนกิจกรรม',
      data: data?.activityStatus?.map(item => item.count) || [],
      backgroundColor: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const topActivitiesConfig = {
    labels: data?.topActivities?.map(item => item.title?.substring(0, 20) + '...') || [],
    datasets: [{
      label: 'จำนวนผู้เข้าร่วม',
      data: data?.topActivities?.map(item => item.participantCount) || [],
      backgroundColor: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const ratingDistributionConfig = {
    labels: ['1 ดาว', '2 ดาว', '3 ดาว', '4 ดาว', '5 ดาว'],
    datasets: [{
      label: 'จำนวนการประเมิน',
      data: data?.ratingDistribution || [],
      backgroundColor: [
        '#FF6B6B', '#FFA07A', '#FFEAA7', '#98D8C8', '#4ECDC4'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 text-primary">
                <i className="fas fa-calendar-alt me-2"></i>
                รายงานกิจกรรม
              </h2>
              <p className="text-muted mb-0">ข้อมูลการจัดกิจกรรมและผลตอบรับ</p>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-success btn-sm"
                onClick={exportToExcel}
                disabled={loading}
              >
                <i className="fas fa-file-excel me-1"></i>
                Excel
              </button>
              <button 
                className="btn btn-danger btn-sm"
                onClick={exportToPDF}
                disabled={loading}
              >
                <i className="fas fa-file-pdf me-1"></i>
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
              <h6 className="mb-0 text-dark">
                <i className="fas fa-filter me-2"></i>
                ตัวกรองข้อมูล
              </h6>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label fw-semibold">วันที่เริ่มต้น</label>
                  <input
                    type="date"
                    className="form-control"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">วันที่สิ้นสุด</label>
                  <input
                    type="date"
                    className="form-control"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">สถานะ</label>
                  <select
                    className="form-select"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="">ทั้งหมด</option>
                    {data?.statuses?.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">ประเภท</label>
                  <select
                    className="form-select"
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                  >
                    <option value="">ทั้งหมด</option>
                    {data?.categories?.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <p className="mt-3 text-muted">กำลังโหลดข้อมูล...</p>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="text-primary mb-2">
                    <i className="fas fa-calendar-check fa-2x"></i>
                  </div>
                  <h4 className="text-primary mb-1">{data.summary?.totalActivities || 0}</h4>
                  <p className="text-muted mb-0">กิจกรรมทั้งหมด</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="text-success mb-2">
                    <i className="fas fa-check-circle fa-2x"></i>
                  </div>
                  <h4 className="text-success mb-1">{data.summary?.completedActivities || 0}</h4>
                  <p className="text-muted mb-0">กิจกรรมที่เสร็จสิ้น</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="text-info mb-2">
                    <i className="fas fa-users fa-2x"></i>
                  </div>
                  <h4 className="text-info mb-1">{data.summary?.totalParticipants || 0}</h4>
                  <p className="text-muted mb-0">ผู้เข้าร่วมทั้งหมด</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="text-warning mb-2">
                    <i className="fas fa-star fa-2x"></i>
                  </div>
                  <h4 className="text-warning mb-1">{data.summary?.averageRating?.toFixed(1) || 0}</h4>
                  <p className="text-muted mb-0">คะแนนเฉลี่ย</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="row mb-4">
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-light border-0">
                  <h6 className="mb-0 text-dark">
                    <i className="fas fa-chart-line me-2"></i>
                    เทรนด์การเข้าร่วมรายเดือน
                  </h6>
                </div>
                <div className="card-body">
                  <Line 
                    data={participationTrendConfig} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                    height={300}
                  />
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-light border-0">
                  <h6 className="mb-0 text-dark">
                    <i className="fas fa-chart-pie me-2"></i>
                    การกระจายสถานะกิจกรรม
                  </h6>
                </div>
                <div className="card-body">
                  <Pie 
                    data={activityStatusConfig} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                    height={300}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Second Row Charts */}
          <div className="row mb-4">
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-light border-0">
                  <h6 className="mb-0 text-dark">
                    <i className="fas fa-chart-bar me-2"></i>
                    กิจกรรมยอดนิยม
                  </h6>
                </div>
                <div className="card-body">
                  <Bar 
                    data={topActivitiesConfig} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                    height={300}
                  />
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-light border-0">
                  <h6 className="mb-0 text-dark">
                    <i className="fas fa-star me-2"></i>
                    การกระจายคะแนนประเมิน
                  </h6>
                </div>
                <div className="card-body">
                  <Bar 
                    data={ratingDistributionConfig} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                    height={300}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Top Activities Table */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-light border-0">
                  <h6 className="mb-0 text-dark">
                    <i className="fas fa-trophy me-2"></i>
                    อันดับกิจกรรมยอดนิยม
                  </h6>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0">อันดับ</th>
                          <th className="border-0">ชื่อกิจกรรม</th>
                          <th className="border-0">วันที่จัด</th>
                          <th className="border-0">ผู้เข้าร่วม</th>
                          <th className="border-0">คะแนนเฉลี่ย</th>
                          <th className="border-0">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.topActivities?.map((activity, index) => (
                          <tr key={activity.id || `activity-${index}`}>
                            <td>
                              <span className={`badge ${index === 0 ? 'bg-warning' : index === 1 ? 'bg-secondary' : index === 2 ? 'bg-danger' : 'bg-light text-dark'}`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="fw-semibold">{activity.title}</td>
                            <td className="text-muted">{new Date(activity.start_date).toLocaleDateString('th-TH')}</td>
                            <td>
                              <span className="badge bg-info">
                                {activity.participantCount} คน
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-warning">
                                {typeof activity.averageRating === 'number' ? activity.averageRating.toFixed(1) : 'N/A'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                activity.status === 'CLOSED' ? 'bg-success' :
                                activity.status === 'OPEN' ? 'bg-warning' :
                                activity.status === 'DRAFT' ? 'bg-secondary' : 'bg-light text-dark'
                              }`}>
                                {activity.status === 'CLOSED' ? 'เสร็จสิ้น' :
                                 activity.status === 'OPEN' ? 'กำลังดำเนินการ' :
                                 activity.status === 'DRAFT' ? 'ร่าง' : 'ไม่ระบุ'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-5">
          <div className="text-muted">
            <i className="fas fa-exclamation-triangle fa-3x mb-3"></i>
            <p>ไม่พบข้อมูล</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityReports;