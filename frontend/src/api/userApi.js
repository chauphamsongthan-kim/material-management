import axiosClient from './axiosClient';

// Lấy danh sách tất cả tài khoản - ADMIN
export async function getUsers() {
  const response = await axiosClient.get('/users');
  return response.data;
}

// Tạo tài khoản mới - ADMIN
export async function createUser(userData) {
  const response = await axiosClient.post('/users', userData);
  return response.data;
}

// ADMIN đổi/reset mật khẩu tài khoản khác
export async function updateUserPassword(userId, newPassword) {
  const response = await axiosClient.put(
    `/users/${userId}/password`,
    {
      new_password: newPassword,
    }
  );

  return response.data;
}

// ADMIN xóa tài khoản
export async function deleteUser(userId) {
  const response = await axiosClient.delete(`/users/${userId}`);
  return response.data;
}