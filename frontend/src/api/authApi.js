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

  // Đổi mật khẩu làm token cũ hết hiệu lực; server cấp token mới
  // để người dùng đang đăng nhập không bị đăng xuất.
  const newToken = response.data?.data?.token;

  if (newToken) {
    localStorage.setItem('token', newToken);
  }

  return response.data;
}



// Quên mật khẩu: gửi mã khôi phục tới Gmail đã liên kết (không cần đăng nhập)
export async function forgotPassword(username) {
  const response = await axiosClient.post('/auth/forgot-password', {
    username,
  });
  return response.data;
}

// Đặt lại mật khẩu bằng mã khôi phục nhận qua Gmail
export async function resetPassword(username, code, newPassword) {
  const response = await axiosClient.post('/auth/reset-password', {
    username,
    code,
    new_password: newPassword,
  });
  return response.data;
}

// Liên kết Gmail (chỉ Admin cấp 2)
export async function getEmailStatus() {
  const response = await axiosClient.get('/auth/email');
  return response.data;
}

export async function requestEmailLink(email) {
  const response = await axiosClient.post('/auth/email/request', { email });
  return response.data;
}

export async function verifyEmailLink(email, code) {
  const response = await axiosClient.post('/auth/email/verify', {
    email,
    code,
  });
  return response.data;
}

export async function unlinkEmail(password) {
  const response = await axiosClient.delete('/auth/email', {
    data: { password },
  });
  return response.data;
}
