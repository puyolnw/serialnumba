import { useState, useEffect } from 'react'
import api from '../services/api'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/users')
      
      if (response.data.success) {
        setUsers(response.data.data.users || [])
      } else {
        setError(response.data.message || 'Failed to fetch users')
      }
    } catch (error) {
      console.error('Fetch users error:', error)
      setError(error.response?.data?.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role) => {
    const badges = {
      'ADMIN': 'danger',
      'STAFF': 'warning',
      'STUDENT': 'info'
    }
    return badges[role] || 'secondary'
  }

  const getRoleText = (role) => {
    const texts = {
      'ADMIN': 'ผู้ดูแลระบบ',
      'STAFF': 'เจ้าหน้าที่',
      'STUDENT': 'นักเรียน'
    }
    return texts[role] || role
  }

  const getStatusBadge = (isActive) => {
    return isActive ? 'success' : 'danger'
  }

  const getStatusText = (isActive) => {
    return isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.role === filter
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.student_code?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading users...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>จัดการผู้ใช้</h1>
          <p>จัดการผู้ใช้ในระบบและสิทธิ์การเข้าถึง</p>
        </div>

          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

        <div className="table-container">
          <div className="table-header">
            <div className="d-flex justify-content-between align-items-center w-100">
              <h5>
                <i className="fas fa-users me-2"></i>
                ผู้ใช้ ({filteredUsers.length})
              </h5>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-light btn-sm">
                  <i className="fas fa-plus me-1"></i>
                  เพิ่มผู้ใช้ใหม่
                </button>
                <div className="input-group input-group-sm" style={{ width: '200px' }}>
                  <span className="input-group-text">
                    <i className="fas fa-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ค้นหาผู้ใช้..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="form-select form-select-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="all">ทุกบทบาท</option>
                  <option value="ADMIN">ผู้ดูแลระบบ</option>
                  <option value="STAFF">เจ้าหน้าที่</option>
                  <option value="STUDENT">นักเรียน</option>
                </select>
              </div>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-user-slash"></i>
              <h5>ไม่พบผู้ใช้</h5>
              <p>
                {searchTerm 
                  ? `ไม่พบผู้ใช้ที่ตรงกับ "${searchTerm}"` 
                  : "ไม่พบผู้ใช้ตามเงื่อนไขที่เลือก"
                }
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ชื่อ</th>
                    <th>อีเมล</th>
                    <th>รหัสนักเรียน</th>
                    <th>บทบาท</th>
                    <th>สถานะ</th>
                    <th>วันที่สร้าง</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>{user.name}</strong>
                            {user.username && (
                              <div className="text-muted small">@{user.username}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <a href={`mailto:${user.email}`} className="text-decoration-none">
                          {user.email}
                        </a>
                      </td>
                      <td>
                        {user.student_code ? (
                          <span className="badge bg-light text-dark">
                            {user.student_code}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge bg-${getRoleBadge(user.role)}`}>
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${getStatusBadge(user.is_active)}`}>
                          {getStatusText(user.is_active)}
                        </span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {formatDate(user.id)}
                        </small>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            className="btn btn-outline-primary"
                            title="ดูรายละเอียด"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            title="แก้ไขผู้ใช้"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className={`btn btn-outline-${user.is_active ? 'warning' : 'success'}`}
                            title={user.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                          >
                            <i className={`fas fa-${user.is_active ? 'ban' : 'check'}`}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserManagement
