
import axios from 'axios';

const axiosClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    (window.location.hostname === 'localhost'
      ? 'http://localhost:5000/api'
      : `http://${window.location.hostname}:5000/api`),
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

export default axiosClient;