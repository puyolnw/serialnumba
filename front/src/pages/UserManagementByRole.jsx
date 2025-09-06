import { useState, useEffect } from 'react'
import api from '../services/api'

const UserManagementByRole = ({ role, roleName, roleIcon }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    student_code: '',
    birth_date: '',
    gender: '',
    phone: '',
    address: '',
    enrollment_year: '',
    program: '',
    password: '',
    is_active: true
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchUsers()
  }, [role])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/users?role=${role}`)
      if (response.data.success) {
        setUsers(response.data.data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('ไม่สามารถโหลดข้อมูลผู้ใช้ได้')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validation
      if (!formData.name || !formData.email || !formData.username) {
        setError('กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, อีเมล, ชื่อผู้ใช้)')
        setLoading(false)
        return
      }

      // Password is only required for new users
      if (!editingUser && !formData.password) {
        setError('กรุณากรอกรหัสผ่าน')
        setLoading(false)
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('รูปแบบอีเมลไม่ถูกต้อง')
        setLoading(false)
        return
      }

      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
      if (!usernameRegex.test(formData.username)) {
        setError('ชื่อผู้ใช้ต้องเป็นตัวอักษร ตัวเลข และ _ เท่านั้น (3-50 ตัวอักษร)')
        setLoading(false)
        return
      }

      // Validate password length (only if password is provided)
      if (formData.password && formData.password.length < 6) {
        setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
        setLoading(false)
        return
      }

      // For students, student_code is required
      if (role === 'STUDENT' && !formData.student_code?.trim()) {
        setError('กรุณากรอกรหัสนักเรียน')
        setLoading(false)
        return
      }

      let response
      if (editingUser) {
        // Update user
        const updateData = { ...formData }
        if (!updateData.password) {
          delete updateData.password // Don't update password if empty
        }
        // For non-students, don't send student_code if empty
        if (role !== 'STUDENT' && !updateData.student_code?.trim()) {
          updateData.student_code = null
        }
        response = await api.put(`/admin/users/${editingUser.id}`, updateData)
      } else {
        // Create user
        const createData = {
          ...formData,
          role: role
        }
        // For non-students, don't send student_code if empty
        if (role !== 'STUDENT' && !createData.student_code?.trim()) {
          createData.student_code = null
        }
        response = await api.post('/admin/users', createData)
      }

      if (response.data.success) {
        setSuccess(editingUser ? 'อัปเดตผู้ใช้สำเร็จ' : 'สร้างผู้ใช้สำเร็จ')
        setShowModal(false)
        setEditingUser(null)
        resetForm()
        fetchUsers()
      } else {
        setError(response.data.message || 'ไม่สามารถบันทึกข้อมูลได้')
      }
    } catch (error) {
      console.error('Error saving user:', error)
      setError(error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email || '',
      username: user.username || '',
      student_code: user.student_code || '',
      birth_date: user.birth_date || '',
      gender: user.gender || '',
      phone: user.phone || '',
      address: user.address || '',
      enrollment_year: user.enrollment_year || '',
      program: user.program || '',
      password: '',
      is_active: user.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?')) {
      return
    }

    try {
      const response = await api.delete(`/admin/users/${userId}`)
      if (response.data.success) {
        setSuccess('ลบผู้ใช้สำเร็จ')
        fetchUsers()
      } else {
        setError(response.data.message || 'ไม่สามารถลบผู้ใช้ได้')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      setError(error.response?.data?.message || 'ไม่สามารถลบผู้ใช้ได้')
    }
  }

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, {
        is_active: !currentStatus
      })
      if (response.data.success) {
        setSuccess('อัปเดตสถานะผู้ใช้สำเร็จ')
        fetchUsers()
      } else {
        setError(response.data.message || 'ไม่สามารถอัปเดตสถานะได้')
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      setError(error.response?.data?.message || 'ไม่สามารถอัปเดตสถานะได้')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      username: '',
      student_code: '',
      birth_date: '',
      gender: '',
      phone: '',
      address: '',
      enrollment_year: '',
      program: '',
      password: '',
      is_active: true
    })
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    resetForm()
  }

  const getStatusBadge = (isActive) => {
    return isActive ? 'badge-success' : 'badge-danger'
  }

  const getStatusText = (isActive) => {
    return isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'
  }

  const formatDate = (id) => {
    return `ID: ${id}`
  }

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && user.is_active) || 
      (filter === 'inactive' && !user.is_active)
    
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.student_code && user.student_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesFilter && matchesSearch
  })

  if (loading && users.length === 0) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">กำลังโหลด...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">
                <i className={`fas ${roleIcon} me-2`}></i>
                {roleName}
              </h1>
              <p className="text-muted mb-0">จัดการบัญชี{roleName.toLowerCase()}</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              <i className="fas fa-plus me-2"></i>เพิ่ม{roleName}
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError('')}
            ></button>
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert">
            <i className="fas fa-check-circle me-2"></i>
            {success}
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccess('')}
            ></button>
          </div>
        )}

        <div className="content-card">
          <div className="table-header">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">รายการ{roleName}</h5>
              <div className="d-flex gap-2">
                <select
                  className="form-select"
                  style={{ width: 'auto' }}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="active">ใช้งาน</option>
                  <option value="inactive">ไม่ใช้งาน</option>
                </select>
                <input
                  type="text"
                  className="form-control"
                  placeholder={`ค้นหา${roleName.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '250px' }}
                />
              </div>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <i className={`fas ${roleIcon} fa-3x text-muted mb-3`}></i>
              <h5>ไม่มี{roleName.toLowerCase()}</h5>
              <p className="text-muted">ยังไม่มี{roleName.toLowerCase()}ที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ชื่อ</th>
                    <th>อีเมล</th>
                    <th>ชื่อผู้ใช้</th>
                    {role === 'STUDENT' && <th>รหัสนักเรียน</th>}
                    {role === 'STUDENT' && <th>เบอร์โทร</th>}
                    {role === 'STUDENT' && <th>หลักสูตร</th>}
                    <th>สถานะ</th>
                    <th>ID</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar-sm me-2">
                            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <strong>{user.name || '-'}</strong>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.username || '-'}</td>
                      {role === 'STUDENT' && <td>{user.student_code || '-'}</td>}
                      {role === 'STUDENT' && <td>{user.phone || '-'}</td>}
                      {role === 'STUDENT' && <td>{user.program || '-'}</td>}
                      <td>
                        <span className={`badge ${getStatusBadge(user.is_active)}`}>
                          {getStatusText(user.is_active)}
                        </span>
                      </td>
                      <td>{formatDate(user.id)}</td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEdit(user)}
                            title="แก้ไข"
                          >
                            <i className="fas fa-edit"></i> แก้ไข
                          </button>
                          <button
                            className={`btn btn-sm ${user.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            title={user.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                          >
                            <i className={`fas ${user.is_active ? 'fa-ban' : 'fa-check'}`}></i> {user.is_active ? 'ปิด' : 'เปิด'}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(user.id)}
                            title="ลบ"
                          >
                            <i className="fas fa-trash"></i> ลบ
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

        {/* User Form Modal */}
        {showModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className={`fas ${roleIcon} me-2`}></i>
                    {editingUser ? 'แก้ไข' : 'เพิ่ม'}{roleName}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleCloseModal}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="name" className="form-label">ชื่อ *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                            placeholder="กรอกชื่อ"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="email" className="form-label">อีเมล *</label>
                          <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            required
                            placeholder="กรอกอีเมล"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="username" className="form-label">ชื่อผู้ใช้ *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                            required
                            placeholder="กรอกชื่อผู้ใช้"
                          />
                        </div>
                      </div>
                      {role === 'STUDENT' && (
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label htmlFor="student_code" className="form-label">รหัสนักเรียน *</label>
                            <input
                              type="text"
                              className="form-control"
                              id="student_code"
                              name="student_code"
                              value={formData.student_code}
                              onChange={(e) => setFormData(prev => ({ ...prev, student_code: e.target.value }))}
                              required
                              placeholder="กรอกรหัสนักเรียน"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ข้อมูลเพิ่มเติมสำหรับนักเรียน */}
                    {role === 'STUDENT' && (
                      <>
                        <hr />
                        <h6 className="mb-3">📋 ข้อมูลส่วนตัว</h6>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label htmlFor="birth_date" className="form-label">วันเกิด</label>
                              <input
                                type="date"
                                className="form-control"
                                id="birth_date"
                                name="birth_date"
                                value={formData.birth_date}
                                onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                                placeholder="เลือกวันเกิด"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label htmlFor="gender" className="form-label">เพศ</label>
                              <select
                                className="form-control"
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                              >
                                <option value="">เลือกเพศ</option>
                                <option value="MALE">ชาย</option>
                                <option value="FEMALE">หญิง</option>
                                <option value="OTHER">อื่นๆ</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <h6 className="mb-3">📞 ข้อมูลติดต่อ</h6>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label htmlFor="phone" className="form-label">เบอร์โทรศัพท์</label>
                              <input
                                type="tel"
                                className="form-control"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="0812345678"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label htmlFor="address" className="form-label">ที่อยู่</label>
                              <textarea
                                className="form-control"
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="กรอกที่อยู่"
                                rows="2"
                              />
                            </div>
                          </div>
                        </div>

                        <h6 className="mb-3">🎓 ข้อมูลการศึกษา</h6>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label htmlFor="enrollment_year" className="form-label">ปีที่เข้าศึกษา</label>
                              <input
                                type="number"
                                className="form-control"
                                id="enrollment_year"
                                name="enrollment_year"
                                value={formData.enrollment_year}
                                onChange={(e) => setFormData(prev => ({ ...prev, enrollment_year: e.target.value }))}
                                placeholder="2567"
                                min="2500"
                                max="2600"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label htmlFor="program" className="form-label">หลักสูตรที่เรียน</label>
                              <input
                                type="text"
                                className="form-control"
                                id="program"
                                name="program"
                                value={formData.program}
                                onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                                placeholder="เช่น วิศวกรรมคอมพิวเตอร์"
                              />
                            </div>
                          </div>
                        </div>
                        <hr />
                      </>
                    )}

                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="password" className="form-label">
                            รหัสผ่าน {editingUser ? '(เว้นว่างไว้หากไม่ต้องการเปลี่ยน)' : '*'}
                          </label>
                          <input
                            type="password"
                            className="form-control"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            required={!editingUser}
                            placeholder="กรอกรหัสผ่าน"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">สถานะ</label>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="is_active"
                              checked={formData.is_active}
                              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                            />
                            <label className="form-check-label" htmlFor="is_active">
                              เปิดใช้งาน
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCloseModal}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-2"></i>
                          {editingUser ? 'อัปเดต' : 'สร้าง'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManagementByRole
