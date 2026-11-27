import axiosClient from './axiosClient';

// Lấy danh sách thông báo
export const getNotifications = async () => {
  const response = await axiosClient.get('/notifications');
  return response.data;
};

// Đánh dấu thông báo đã đọc
export const markNotificationRead = async (notificationId) => {
  const response = await axiosClient.patch(
    `/notifications/${notificationId}/read`
  );
  return response.data;
};

// Xóa một thông báo
export const deleteNotification = async (notificationId) => {
  const response = await axiosClient.delete(
    `/notifications/${notificationId}`
  );
  return response.data;
};

// Danh sách tài khoản có thể nhận thông báo (Admin cấp 1 và cấp 2)
export const getNotificationRecipients = async () => {
  const response = await axiosClient.get('/notifications/recipients');
  return response.data;
};

// ADMIN gửi thông báo đến các tài khoản được chọn
export const sendAdminNotification = async ({
  title,
  message,
  recipient_ids,
}) => {
  const response = await axiosClient.post('/notifications', {
    title,
    message,
    recipient_ids,
  });

  return response.data;
};