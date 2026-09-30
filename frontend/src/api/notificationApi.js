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