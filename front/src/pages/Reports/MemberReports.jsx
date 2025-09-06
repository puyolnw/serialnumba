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

const MemberReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    program: '',
    enrollmentYear: ''
  });

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchData();
    }
  }, [user, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/reports/members', { params: filters });
      setData(response.data.data);
    } catch (error) {
      console.error('Error fetching member reports:', error);
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
      const response = await api.get('/admin/reports/members/export/excel', {
        params: filters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `member-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  const exportToPDF = async () => {
    try {
      const response = await api.get('/admin/reports/members/export/pdf', {
        params: filters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `member-reports-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  };

  // Chart configurations
  const hoursDistributionConfig = {
    labels: data?.hoursDistribution?.map(item => item.range) || [],
    datasets: [{
      label: 'จำนวนสมาชิก',
      data: data?.hoursDistribution?.map(item => item.count) || [],
      backgroundColor: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const programDistributionConfig = {
    labels: data?.programDistribution?.map(item => item.program) || [],
    datasets: [{
      label: 'จำนวนสมาชิก',
      data: data?.programDistribution?.map(item => item.count) || [],
      backgroundColor: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const monthlyProgressConfig = {
    labels: data?.monthlyProgress?.map(item => item.month) || [],
    datasets: [{
      label: 'ชั่วโมงสะสมรวม',
      data: data?.monthlyProgress?.map(item => item.totalHours) || [],
      borderColor: '#4ECDC4',
      backgroundColor: 'rgba(78, 205, 196, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4
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
                <i className="fas fa-users me-2"></i>
                รายงานสมาชิก
              </h2>
              <p className="text-muted mb-0">ข้อมูลการสะสมชั่วโมงและสถิติสมาชิก</p>
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
                  <label className="form-label fw-semibold">สาขาวิชา</label>
                  <select
                    className="form-select"
                    name="program"
                    value={filters.program}
                    onChange={handleFilterChange}
                  >
                    <option value="">ทั้งหมด</option>
                    {data?.programs?.map(program => (
                      <option key={program} value={program}>{program}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">ปีที่เข้าเรียน</label>
                  <select
                    className="form-select"
                    name="enrollmentYear"
                    value={filters.enrollmentYear}
                    onChange={handleFilterChange}
                  >
                    <option value="">ทั้งหมด</option>
                    {data?.enrollmentYears?.map(year => (
                      <option key={year} value={year}>{year}</option>
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
                    <i className="fas fa-users fa-2x"></i>
                  </div>
                  <h4 className="text-primary mb-1">{data.summary?.totalMembers || 0}</h4>
                  <p className="text-muted mb-0">สมาชิกทั้งหมด</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="text-success mb-2">
                    <i className="fas fa-clock fa-2x"></i>
                  </div>
                  <h4 className="text-success mb-1">{data.summary?.totalHours || 0}</h4>
                  <p className="text-muted mb-0">ชั่วโมงสะสมรวม</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="text-info mb-2">
                    <i className="fas fa-chart-line fa-2x"></i>
                  </div>
                  <h4 className="text-info mb-1">{typeof data.summary?.averageHours === 'number' ? data.summary.averageHours.toFixed(1) : (parseFloat(data.summary?.averageHours) || 0).toFixed(1)}</h4>
                  <p className="text-muted mb-0">ชั่วโมงเฉลี่ย</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="text-warning mb-2">
                    <i className="fas fa-trophy fa-2x"></i>
                  </div>
                  <h4 className="text-warning mb-1">{data.summary?.activeMembers || 0}</h4>
                  <p className="text-muted mb-0">สมาชิกที่ใช้งาน</p>
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
                    <i className="fas fa-chart-pie me-2"></i>
                    การกระจายชั่วโมงสะสม
                  </h6>
                </div>
                <div className="card-body">
                  <Pie 
                    data={hoursDistributionConfig} 
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
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-light border-0">
                  <h6 className="mb-0 text-dark">
                    <i className="fas fa-chart-bar me-2"></i>
                    การกระจายตามสาขาวิชา
                  </h6>
                </div>
                <div className="card-body">
                  <Bar 
                    data={programDistributionConfig} 
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

          {/* Monthly Progress Chart */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-light border-0">
                  <h6 className="mb-0 text-dark">
                    <i className="fas fa-chart-line me-2"></i>
                    เทรนด์การสะสมชั่วโมงรายเดือน
                  </h6>
                </div>
                <div className="card-body">
                  <Line 
                    data={monthlyProgressConfig} 
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
                    height={100}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Top Students Table */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-light border-0">
                  <h6 className="mb-0 text-dark">
                    <i className="fas fa-medal me-2"></i>
                    อันดับสมาชิกที่สะสมชั่วโมงสูงสุด
                  </h6>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0">อันดับ</th>
                          <th className="border-0">ชื่อ-นามสกุล</th>
                          <th className="border-0">รหัสนักศึกษา</th>
                          <th className="border-0">สาขาวิชา</th>
                          <th className="border-0">ชั่วโมงสะสม</th>
                          <th className="border-0">จำนวนกิจกรรม</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.topStudents?.map((student, index) => (
                          <tr key={student.user_id || `student-${index}`}>
                            <td>
                              <span className={`badge ${index === 0 ? 'bg-warning' : index === 1 ? 'bg-secondary' : index === 2 ? 'bg-danger' : 'bg-light text-dark'}`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="fw-semibold">{student.user?.name || 'ไม่ระบุ'}</td>
                            <td className="text-muted">{student.user?.student_code || 'ไม่ระบุ'}</td>
                            <td className="text-muted">{student.user?.program || 'ไม่ระบุ'}</td>
                            <td>
                              <span className="badge bg-success">
                                {student.total_hours} ชั่วโมง
                              </span>
                            </td>
                            <td className="text-muted">{student.activity_count || 0} กิจกรรม</td>
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

export default MemberReports;