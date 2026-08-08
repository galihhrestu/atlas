import "./styles/responsive.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// =====================
// LOGIN
// =====================
import Login from "./pages/Login/Login";

// =====================
// DASHBOARD
// =====================
import UserDashboard from "./pages/UserDashboard/UserDashboard";
import OperatorDashboard from "./pages/OperatorDashboard/OperatorDashboard";
import ManagementDashboard from "./pages/ManagementDashboard/ManagementDashboard";

// =====================
// INCIDENT
// =====================
import Incident from "./pages/Incident/Incident";
import IncidentDetail from "./pages/Incident/IncidentDetail";
import CreateIncident from "./pages/Incident/CreateIncident";
import OperatorIncidentDetail from "./pages/Incident/OperatorIncidentDetail";
import ManagementIncidentDetail from "./pages/Incident/ManagementIncidentDetail";

// =====================
// INVESTIGATION
// =====================
import InvestigationMonitoring from "./pages/Investigation/InvestigationMonitoring";
import InvestigationDetail from "./pages/Investigation/InvestigationDetail";

// =====================
// OTHER
// =====================
import Report from "./pages/Report/Report";
import Analytics from "./pages/Analytics/Analytics";
import MasterData from "./pages/MasterData/MasterData";
import UserManagement from "./pages/UserManagement/UserManagement";
import Settings from "./pages/Settings/Settings";
import AuditTrail from "./pages/AuditTrail/AuditTrail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route path="/" element={<Login />} />

        {/* APPLICATION */}
        <Route element={<MainLayout />}>
          {/* USER DASHBOARD */}
          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoute allowedRole="user">
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* CREATE INCIDENT */}
          <Route
            path="/create-incident"
            element={
              <ProtectedRoute allowedRole="user">
                <CreateIncident />
              </ProtectedRoute>
            }
          />

          {/* OPERATOR DASHBOARD */}
          <Route
            path="/operator-dashboard"
            element={
              <ProtectedRoute allowedRole="operator">
                <OperatorDashboard />
              </ProtectedRoute>
            }
          />

          {/* OPERATOR PENDING APPROVAL DETAIL */}
          <Route
            path="/operator-incident/:id"
            element={
              <ProtectedRoute allowedRole="operator">
                <OperatorIncidentDetail />
              </ProtectedRoute>
            }
          />

          {/* OPERATOR INVESTIGATION MONITORING */}
          <Route
            path="/investigation-monitoring"
            element={
              <ProtectedRoute allowedRole="operator">
                <InvestigationMonitoring />
              </ProtectedRoute>
            }
          />

          {/* OPERATOR INVESTIGATION DETAIL */}
          <Route
            path="/investigation/:id"
            element={
              <ProtectedRoute allowedRole="operator">
                <InvestigationDetail />
              </ProtectedRoute>
            }
          />

          {/* MANAGEMENT DASHBOARD */}
          <Route
            path="/management-dashboard"
            element={
              <ProtectedRoute allowedRole="management">
                <ManagementDashboard />
              </ProtectedRoute>
            }
          />

          {/* MANAGEMENT FINAL REPORT REVIEW */}
          <Route
            path="/management-incident/:id"
            element={
              <ProtectedRoute allowedRole="management">
                <ManagementIncidentDetail />
              </ProtectedRoute>
            }
          />

          {/* EXISTING INCIDENT ROUTES */}
          <Route
            path="/incident"
            element={
              <ProtectedRoute>
                <Incident />
              </ProtectedRoute>
            }
          />

          <Route
            path="/incident/:id"
            element={
              <ProtectedRoute>
                <IncidentDetail />
              </ProtectedRoute>
            }
          />

          {/* REPORT */}
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            }
          />

          {/* ANALYTICS */}
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRole="management">
                <Analytics />
              </ProtectedRoute>
            }
          />

          {/* MASTER DATA */}
          <Route
            path="/master-data"
            element={
              <ProtectedRoute allowedRole="operator">
                <MasterData />
              </ProtectedRoute>
            }
          />

          {/* USER MANAGEMENT */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRole="admin">
                <UserManagement />
              </ProtectedRoute>
            }
          />

          {/* AUDIT TRAIL */}
          <Route
            path="/audit-trail"
            element={
              <ProtectedRoute allowedRole="management">
                <AuditTrail />
              </ProtectedRoute>
            }
          />

          {/* SETTINGS */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* UNKNOWN */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
