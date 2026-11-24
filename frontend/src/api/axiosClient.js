
import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động gửi JWT Token trong mỗi request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Các API mà 401 là kết quả bình thường (sai mật khẩu), không phải hết phiên
const AUTH_ENDPOINTS_WITH_OWN_401 = ['/auth/login', '/auth/change-password'];

let redirectingToLogin = false;

// Token hết hạn / bị thu hồi (đổi mật khẩu, xóa tài khoản): xóa phiên và về trang đăng nhập
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    const hasSession = Boolean(localStorage.getItem('token'));
    const isAuthEndpoint = AUTH_ENDPOINTS_WITH_OWN_401.some((path) =>
      url.includes(path)
    );

    if (status === 401 && hasSession && !isAuthEndpoint && !redirectingToLogin) {
      redirectingToLogin = true;

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      window.location.assign('/login');
    }

    return Promise.reject(error);
  }
);

export default axiosClient;