import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import { useAuth } from '../context/AuthContext';

import DeviceDetailPage from '../pages/DeviceDetailPage';

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

        {/* Dashboard - yêu cầu đăng nhập */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
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

        {/* Trang không tồn tại */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

        <Route
          path="/devices/:deviceId"
          element={
          <ProtectedRoute>
         <DeviceDetailPage />
         </ProtectedRoute>
        }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;