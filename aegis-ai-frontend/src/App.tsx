import { Navigate, Route, Routes } from "react-router";

import { SessionManager } from "./components/auth/SessionManager";

import { routeAccess } from "./constants/accessControl";

import { DashboardLayout } from "./layouts/DashboardLayout";

import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RoleProtectedRoute } from "./routes/RoleProtectedRoute";

import { AICopilotPage } from "./pages/AICopilotPage";
import { AlertsPage } from "./pages/AlertsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DocumentAssistantPage } from "./pages/DocumentAssistantPage";
import { LoginPage } from "./pages/LoginPage";
import { PredictiveMaintenancePage } from "./pages/PredictiveMaintenancePage";
import { ProfilePage } from "./pages/ProfilePage";
import { RobotMonitoringPage } from "./pages/RobotMonitoringPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { VisionInspectionPage } from "./pages/VisionInspectionPage";
import { WorkerSafetyPage } from "./pages/WorkerSafetyPage";
import { WorkflowAutomationPage } from "./pages/WorkflowAutomationPage";

function App() {
  return (
    <>
      <SessionManager />

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<DashboardLayout />}>
            <Route
              path="/dashboard"
              element={
                <RoleProtectedRoute allowedRoles={routeAccess.dashboard}>
                  <DashboardPage />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <RoleProtectedRoute allowedRoles={routeAccess.analytics}>
                  <AnalyticsPage />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/robots"
              element={
                <RoleProtectedRoute allowedRoles={routeAccess.robots}>
                  <RobotMonitoringPage />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/safety"
              element={
                <RoleProtectedRoute allowedRoles={routeAccess.safety}>
                  <WorkerSafetyPage />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/vision"
              element={
                <RoleProtectedRoute allowedRoles={routeAccess.vision}>
                  <VisionInspectionPage />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/maintenance"
              element={
                <RoleProtectedRoute allowedRoles={routeAccess.maintenance}>
                  <PredictiveMaintenancePage />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/workflows"
              element={
                <RoleProtectedRoute allowedRoles={routeAccess.workflows}>
                  <WorkflowAutomationPage />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/alerts"
              element={
                <RoleProtectedRoute allowedRoles={routeAccess.alerts}>
                  <AlertsPage />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/documents"
              element={
                <RoleProtectedRoute allowedRoles={routeAccess.documents}>
                  <DocumentAssistantPage />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/copilot"
              element={
                <RoleProtectedRoute allowedRoles={routeAccess.copilot}>
                  <AICopilotPage />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <RoleProtectedRoute allowedRoles={routeAccess.profile}>
                  <ProfilePage />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/administration"
              element={
                <RoleProtectedRoute allowedRoles={routeAccess.administration}>
                  <UserManagementPage />
                </RoleProtectedRoute>
              }
            />

            <Route path="/unauthorized" element={<UnauthorizedPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;
