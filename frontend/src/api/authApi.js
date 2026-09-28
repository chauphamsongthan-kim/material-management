import axiosClient from './axiosClient';

// Đăng nhập
export async function login(username, password) {
  const response = await axiosClient.post('/auth/login', {
    username,
    password,
  });

  return response.data;
}

// Đổi mật khẩu của tài khoản đang đăng nhập
export async function changePassword(currentPassword, newPassword) {
  const response = await axiosClient.put('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });

  return response.data;
}


