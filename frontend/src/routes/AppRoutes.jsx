import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import AccountManagementPage from '../pages/AccountManagementPage';
import DeviceDetailPage from '../pages/DeviceDetailPage';

import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>

        {/* Trang đăng nhập */}
        <Route
          path="/login"
          element={
            isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <LoginPage />
          }
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Quản lý tài khoản - ADMIN */}
        <Route
          path="/accounts"
          element={
            <ProtectedRoute>
              <AccountManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Chi tiết thiết bị */}
        <Route
          path="/devices/:deviceId"
          element={
            <ProtectedRoute>
              <DeviceDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Trang mặc định */}
        <Route
          path="/"
          element={
            <Navigate
              to={isAuthenticated ? "/dashboard" : "/login"}
              replace
            />
          }
        />

        {/* Trang không tồn tại - luôn để cuối */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;