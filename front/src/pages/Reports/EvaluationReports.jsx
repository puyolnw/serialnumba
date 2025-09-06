import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Line, Bar, Radar, Scatter } from 'react-chartjs-2';
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
  RadialLinearScale,
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
  RadialLinearScale,
  ArcElement
);

const EvaluationReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    activityId: '',
    ratingRange: ''
  });

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchData();
    }
  }, [user, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/reports/evaluations', { params: filters });
      setData(response.data.data);
    } catch (error) {
      console.error('Error fetching evaluation reports:', error);
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
      const response = await api.get('/admin/reports/evaluations/export/excel', {
        params: filters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `evaluation-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  const exportToPDF = async () => {
    try {
      const response = await api.get('/admin/reports/evaluations/export/pdf', {
        params: filters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `evaluation-reports-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  };

  // Chart configurations
  const ratingTrendConfig = {
    labels: data?.ratingTrend?.map(item => item.month) || [],
    datasets: [
      {
        label: 'คะแนนรวม',
        data: data?.ratingTrend?.map(item => item.overallRating) || [],
        borderColor: '#4ECDC4',
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      },
      {
        label: 'ความสนุก',
        data: data?.ratingTrend?.map(item => item.funRating) || [],
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4
      },
      {
        label: 'การเรียนรู้',
        data: data?.ratingTrend?.map(item => item.learningRating) || [],
        borderColor: '#45B7D1',
        backgroundColor: 'rgba(69, 183, 209, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4
      }
    ]
  };

  const categoryComparisonConfig = {
    labels: data?.categoryComparison?.map(item => item.category) || [],
    datasets: [
      {
        label: 'คะแนนรวม',
        data: data?.categoryComparison?.map(item => item.overallRating) || [],
        backgroundColor: 'rgba(78, 205, 196, 0.8)',
        borderColor: '#4ECDC4',
        borderWidth: 2
      },
      {
        label: 'ความสนุก',
        data: data?.categoryComparison?.map(item => item.funRating) || [],
        backgroundColor: 'rgba(255, 107, 107, 0.8)',
        borderColor: '#FF6B6B',
        borderWidth: 2
      },
      {
        label: 'การเรียนรู้',
        data: data?.categoryComparison?.map(item => item.learningRating) || [],
        backgroundColor: 'rgba(69, 183, 209, 0.8)',
        borderColor: '#45B7D1',
        borderWidth: 2
      }
    ]
  };

  const detailedRatingsConfig = {
    labels: data?.detailedRatings?.map((activity, index) => `กิจกรรม ${index + 1}`) || [],
    datasets: data?.detailedRatings?.map((activity, index) => ({
      label: activity.title,
      data: [
        activity.overallRating,
        activity.funRating,
        activity.learningRating,
        activity.organizationRating,
        activity.venueRating
      ],
      backgroundColor: [
        `hsl(${index * 60}, 70%, 70%)`,
        `hsl(${index * 60}, 70%, 60%)`,
        `hsl(${index * 60}, 70%, 50%)`,
        `hsl(${index * 60}, 70%, 40%)`,
        `hsl(${index * 60}, 70%, 30%)`
      ],
      borderWidth: 2
    })) || []
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
                <i className="fas fa-star me-2"></i>
                รายงานประเมินกิจกรรม
              </h2>
              <p className="text-muted mb-0">ข้อมูลการประเมินและความคิดเห็นของสมาชิก</p>
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
                  <label className="form-label fw-semibold">กิจกรรม</label>
                  <select
                    className="form-select"
                    name="activityId"
                    value={filters.activityId}
                    onChange={handleFilterChange}
                  >
                    <option value="">ทั้งหมด</option>
                    {data?.activities?.map(activity => (
                      <option key={activity.id} value={activity.id}>{activity.title}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">ช่วงคะแนน</label>
                  <select
                    className="form-select"
                    name="ratingRange"
                    value={filters.ratingRange}
                    onChange={handleFilterChange}
                  >
                    <option value="">ทั้งหมด</option>
                    <option value="1">1 ดาว</option>
                    <option value="2">2 ดาว</option>
                    <option value="3">3 ดาว</option>
                    <option value="4">4 ดาว</option>
                    <option value="5">5 ดาว</option>
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
                    <i className="fas fa-comments fa-2x"></i>
                  </div>
                  <h4 className="text-primary mb-1">{data.summary?.totalEvaluations || 0}</h4>
                  <p className="text-muted mb-0">การประเมินทั้งหมด</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="text-success mb-2">
                    <i className="fas fa-star fa-2x"></i>
                  </div>
                  <h4 className="text-success mb-1">{typeof data.summary?.averageOverallRating === 'number' ? data.summary.averageOverallRating.toFixed(1) : '0.0'}</h4>
                  <p className="text-muted mb-0">คะแนนเฉลี่ยรวม</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="text-info mb-2">
                    <i className="fas fa-smile fa-2x"></i>
                  </div>
                  <h4 className="text-info mb-1">{typeof data.summary?.averageFunRating === 'number' ? data.summary.averageFunRating.toFixed(1) : '0.0'}</h4>
                  <p className="text-muted mb-0">คะแนนความสนุกเฉลี่ย</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="text-warning mb-2">
                    <i className="fas fa-graduation-cap fa-2x"></i>
                  </div>
                  <h4 className="text-warning mb-1">{typeof data.summary?.averageLearningRating === 'number' ? data.summary.averageLearningRating.toFixed(1) : '0.0'}</h4>
                  <p className="text-muted mb-0">คะแนนการเรียนรู้เฉลี่ย</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="row mb-4">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-light border-0">
                  <h6 className="mb-0 text-dark">
                    <i className="fas fa-chart-line me-2"></i>
                    เทรนด์คะแนนประเมินรายเดือน
                  </h6>
                </div>
                <div className="card-body">
                  <Line 
                    data={ratingTrendConfig} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 5
                        }
                      }
                    }}
                    height={300}
                  />
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-light border-0">
                  <h6 className="mb-0 text-dark">
                    <i className="fas fa-chart-bar me-2"></i>
                    การกระจายคะแนน
                  </h6>
                </div>
                <div className="card-body">
                  <Bar 
                    data={{
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
                    }} 
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

          {/* Top Rated Activities Table */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-light border-0">
                  <h6 className="mb-0 text-dark">
                    <i className="fas fa-trophy me-2"></i>
                    อันดับกิจกรรมที่ได้รับคะแนนสูงสุด
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
                          <th className="border-0">คะแนนรวม</th>
                          <th className="border-0">ความสนุก</th>
                          <th className="border-0">การเรียนรู้</th>
                          <th className="border-0">การจัดระเบียบ</th>
                          <th className="border-0">สถานที่</th>
                          <th className="border-0">จำนวนการประเมิน</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.topRatedActivities?.map((activity, index) => (
                          <tr key={activity.id || `activity-${index}`}>
                            <td>
                              <span className={`badge ${index === 0 ? 'bg-warning' : index === 1 ? 'bg-secondary' : index === 2 ? 'bg-danger' : 'bg-light text-dark'}`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="fw-semibold">{activity.title}</td>
                            <td className="text-muted">{new Date(activity.start_date).toLocaleDateString('th-TH')}</td>
                            <td>
                              <span className="badge bg-primary">
                                {typeof activity.overallRating === 'number' ? activity.overallRating.toFixed(1) : 'N/A'}
                              </span>
                            </td>
                            <td className="text-muted">{typeof activity.funRating === 'number' ? activity.funRating.toFixed(1) : 'N/A'}</td>
                            <td className="text-muted">{typeof activity.learningRating === 'number' ? activity.learningRating.toFixed(1) : 'N/A'}</td>
                            <td className="text-muted">{typeof activity.organizationRating === 'number' ? activity.organizationRating.toFixed(1) : 'N/A'}</td>
                            <td className="text-muted">{typeof activity.venueRating === 'number' ? activity.venueRating.toFixed(1) : 'N/A'}</td>
                            <td>
                              <span className="badge bg-info">
                                {activity.reviewCount} รายการ
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

          {/* Recent Reviews Table */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-light border-0">
                  <h6 className="mb-0 text-dark">
                    <i className="fas fa-comment-dots me-2"></i>
                    การประเมินล่าสุด
                  </h6>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0">กิจกรรม</th>
                          <th className="border-0">ผู้ประเมิน</th>
                          <th className="border-0">คะแนนรวม</th>
                          <th className="border-0">ความคิดเห็น</th>
                          <th className="border-0">วันที่ประเมิน</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.recentReviews?.map((review, index) => (
                          <tr key={review.id || `review-${index}`}>
                            <td className="fw-semibold">{review.activity?.title || 'ไม่ระบุ'}</td>
                            <td className="text-muted">{review.user?.name || 'ไม่ระบุ'}</td>
                            <td>
                              <span className="badge bg-primary">
                                {review.overall_rating} ดาว
                              </span>
                            </td>
                            <td className="text-muted">
                              {review.comment ? (
                                <span className="text-truncate d-inline-block" style={{maxWidth: '200px'}} title={review.comment}>
                                  {review.comment}
                                </span>
                              ) : (
                                <span className="text-muted">ไม่มีความคิดเห็น</span>
                              )}
                            </td>
                            <td className="text-muted">{new Date(review.created_at).toLocaleDateString('th-TH')}</td>
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

export default EvaluationReports;