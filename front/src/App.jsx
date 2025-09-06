import { Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Layouts
import GuestLayout from './layouts/GuestLayout'
import DashboardLayout from './layouts/DashboardLayout'
import StaffLayout from './layouts/StaffLayout'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Activities from './pages/Activities'
import CreateActivity from './pages/CreateActivity'
import MyActivities from './pages/MyActivities'
import AllActivities from './pages/AllActivities'
import UserManagement from './pages/UserManagement'
import AdminHome from './pages/AdminHome'
import StaffHome from './pages/StaffHome'
import StudentHome from './pages/StudentHome'
import AdminSettings from './pages/AdminSettings'
import StudentProgress from './pages/StudentProgress'
import StudentSerialHistory from './pages/StudentSerialHistory'
import StudentRedeemSerial from './pages/StudentRedeemSerial'
import PublicCheckin from './pages/PublicCheckin'
import AttendanceConfirmation from './pages/AttendanceConfirmation'
import MailSettings from './pages/MailSettings'
import MailTest from './pages/MailTest'
import SerialManagement from './pages/SerialManagement'
import QRCodeGenerator from './pages/QRCodeGenerator'
import ActivityManagement from './pages/ActivityManagement'
import SerialSending from './pages/SerialSending'
import UserManagementByRole from './pages/UserManagementByRole'
import SystemSettings from './pages/SystemSettings'
import ActivityCalendar from './pages/ActivityCalendar'
import StudentProfile from './pages/StudentProfile'
import StudentCertificate from './pages/StudentCertificate'
import MemberReports from './pages/Reports/MemberReports'
import ActivityReports from './pages/Reports/ActivityReports'
import EvaluationReports from './pages/Reports/EvaluationReports'
import StaffDashboard from './pages/StaffDashboard'
import StaffActivities from './pages/StaffActivities'
import StaffSerialSending from './pages/StaffSerialSending'
import StaffProfile from './pages/StaffProfile'
import StaffActivityReports from './pages/StaffActivityReports'

// Layout Wrapper Component
const LayoutWrapper = ({ children }) => {
  const { isAuthenticated } = useAuth()
  
  if (isAuthenticated) {
    return <DashboardLayout>{children}</DashboardLayout>
  }
  
  return <GuestLayout>{children}</GuestLayout>
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<GuestLayout />}>
          <Route index element={<Landing />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        {/* Public Check-in Route (no layout) */}
        <Route path="/checkin/:slug" element={<PublicCheckin />} />


        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="ADMIN">
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminHome />} />
          <Route path="activities" element={<ActivityManagement />} />
          <Route path="activities/create" element={<CreateActivity />} />
          <Route path="serials/send" element={<SerialSending />} />
          <Route path="users/students" element={<UserManagementByRole role="STUDENT" roleName="นักเรียน" roleIcon="fa-graduation-cap" />} />
          <Route path="users/staff" element={<UserManagementByRole role="STAFF" roleName="สตาฟ" roleIcon="fa-user-tie" />} />
          <Route path="users/admins" element={<UserManagementByRole role="ADMIN" roleName="แอดมิน" roleIcon="fa-crown" />} />
          <Route path="reports/members" element={<MemberReports />} />
          <Route path="reports/activities" element={<ActivityReports />} />
          <Route path="reports/evaluations" element={<EvaluationReports />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route path="mail-settings" element={<MailSettings />} />
          <Route path="mail-test" element={<MailTest />} />
        </Route>

        {/* Staff Routes */}
        <Route path="/staff" element={
          <ProtectedRoute requiredRole="STAFF">
            <StaffLayout />
          </ProtectedRoute>
        }>
          <Route index element={<StaffDashboard />} />
          <Route path="activities" element={<StaffActivities />} />
          <Route path="activities/create" element={<CreateActivity />} />
          <Route path="serials/send" element={<StaffSerialSending />} />
          <Route path="profile" element={<StaffProfile />} />
          <Route path="reports/activities" element={<StaffActivityReports />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={
          <ProtectedRoute requiredRole="STUDENT">
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<StudentHome />} />
          <Route path="progress" element={<StudentProgress />} />
          <Route path="serials" element={<StudentRedeemSerial />} />
          <Route path="history" element={<StudentSerialHistory />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="certificate" element={<StudentCertificate />} />
        </Route>

        {/* Activity Management Routes */}
        <Route path="/activities" element={<LayoutWrapper />}>
          <Route index element={<ActivityCalendar />} />
          <Route path="create" element={
            <ProtectedRoute requiredRole="STAFF">
              <CreateActivity />
            </ProtectedRoute>
          } />
          <Route path="my" element={
            <ProtectedRoute>
              <MyActivities />
            </ProtectedRoute>
          } />
          <Route path=":id" element={<div>Activity Details</div>} />
          <Route path=":id/edit" element={
            <ProtectedRoute>
              <div>Edit Activity</div>
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
