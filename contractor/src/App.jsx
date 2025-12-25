import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Pages
import Splash from './pages/Splash'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Uploads from './pages/Uploads'
import Chat from './pages/Chat'
import Earnings from './pages/Earnings'
import Inventory from './pages/Inventory'
import Weather from './pages/Weather'

// Admin Pages
import {
  AdminLogin,
  AdminDashboard,
  UserManagement,
  ContractorManagement,
  ProjectManagement,
  JobManagement,
  SupportTickets,
  Analytics,
  AdminSettings
} from './pages/admin'

// Components
import BottomNav from './components/BottomNav'
import AdminNav from './components/AdminNav'
import LoadingScreen from './components/LoadingScreen'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user || !isAdmin()) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

function AppLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-slate-50">
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

function AdminLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-slate-50">
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      <AdminNav />
    </div>
  )
}

export default function App() {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? (isAdmin() ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />) : <Splash />} />
      <Route path="/login" element={user ? (isAdmin() ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />) : <Login />} />

      {/* Admin Login */}
      <Route path="/admin/login" element={user && isAdmin() ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={
        <AdminRoute>
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </AdminRoute>
      } />

      <Route path="/admin/users" element={
        <AdminRoute>
          <AdminLayout>
            <UserManagement />
          </AdminLayout>
        </AdminRoute>
      } />

      <Route path="/admin/contractors" element={
        <AdminRoute>
          <AdminLayout>
            <ContractorManagement />
          </AdminLayout>
        </AdminRoute>
      } />

      <Route path="/admin/projects" element={
        <AdminRoute>
          <AdminLayout>
            <ProjectManagement />
          </AdminLayout>
        </AdminRoute>
      } />

      <Route path="/admin/jobs" element={
        <AdminRoute>
          <AdminLayout>
            <JobManagement />
          </AdminLayout>
        </AdminRoute>
      } />

      <Route path="/admin/tickets" element={
        <AdminRoute>
          <AdminLayout>
            <SupportTickets />
          </AdminLayout>
        </AdminRoute>
      } />

      <Route path="/admin/analytics" element={
        <AdminRoute>
          <AdminLayout>
            <Analytics />
          </AdminLayout>
        </AdminRoute>
      } />

      <Route path="/admin/settings" element={
        <AdminRoute>
          <AdminLayout>
            <AdminSettings />
          </AdminLayout>
        </AdminRoute>
      } />

      {/* Protected Contractor routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/projects" element={
        <ProtectedRoute>
          <AppLayout>
            <Projects />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/projects/:id" element={
        <ProtectedRoute>
          <AppLayout>
            <ProjectDetail />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/jobs" element={
        <ProtectedRoute>
          <AppLayout>
            <Jobs />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/jobs/:id" element={
        <ProtectedRoute>
          <AppLayout>
            <JobDetail />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/earnings" element={
        <ProtectedRoute>
          <AppLayout>
            <Earnings />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <AppLayout>
            <Profile />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <AppLayout>
            <Settings />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/uploads" element={
        <ProtectedRoute>
          <AppLayout>
            <Uploads />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/chat" element={
        <ProtectedRoute>
          <AppLayout>
            <Chat />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/inventory" element={
        <ProtectedRoute>
          <AppLayout>
            <Inventory />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/projects/:projectId/inventory" element={
        <ProtectedRoute>
          <AppLayout>
            <Inventory />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/weather" element={
        <ProtectedRoute>
          <AppLayout>
            <Weather />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
