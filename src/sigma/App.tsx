import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { useAuth } from './context/AuthContext'
import { AdminDataEntryPage } from './pages/AdminDataEntryPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { AdminValidationPage } from './pages/AdminValidationPage'
import { AssetsPage } from './pages/AssetsPage'
import { DashboardPage } from './pages/DashboardPage'
import { FindingsPage } from './pages/FindingsPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PatrolsPage } from './pages/PatrolsPage'
import { PerformancePage } from './pages/PerformancePage'
import { ReportsPage } from './pages/ReportsPage'
import { RiskPage } from './pages/RiskPage'
import { VisibilityPage } from './pages/VisibilityPage'

function ProtectedLayout() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/sigma/login" replace />
  return <AppShell><Outlet /></AppShell>
}

function AdminOnly() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/sigma/login" replace />
  if (user.role !== 'admin') return <Navigate to="/sigma/dashboard" replace />
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/sigma/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="patrols" element={<PatrolsPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="visibility" element={<VisibilityPage />} />
        <Route path="risk" element={<RiskPage />} />
        <Route path="findings" element={<FindingsPage />} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route element={<AdminOnly />}>
          <Route path="admin/data-entry" element={<AdminDataEntryPage />} />
          <Route path="admin/validation" element={<AdminValidationPage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
