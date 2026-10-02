
import axiosClient from './axiosClient';

// Bật Push Notification cho tài khoản hiện tại
export const subscribeToPush = async (subscription) => {
  try {
    const response = await axiosClient.post(
      '/push/subscribe',
      subscription
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        'Không thể bật thông báo đẩy.',
    };
  }
};

// Liên kết thiết bị với tài khoản hiện tại, không tự bật Push
export const linkPushDevice = async (subscription) => {
  try {
    const response = await axiosClient.post(
      '/push/link',
      subscription
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        'Không thể liên kết thiết bị với tài khoản.',
    };
  }
};

// Lấy trạng thái bật/tắt Push riêng của tài khoản hiện tại
export const getPushStatus = async (endpoint) => {
  try {
    const response = await axiosClient.get('/push/status', {
      params: { endpoint },
    });

    return {
      success: true,
      enabled: Boolean(response.data.enabled),
    };
  } catch (error) {
    return {
      success: false,
      enabled: false,
      message:
        error.response?.data?.message ||
        'Không thể kiểm tra trạng thái thông báo đẩy.',
    };
  }
};

// Tắt Push cho tài khoản hiện tại, không hủy đăng ký của trình duyệt
export const unsubscribeFromPush = async (endpoint) => {
  try {
    const response = await axiosClient.delete(
      '/push/unsubscribe',
      {
        data: { endpoint },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        'Không thể tắt thông báo đẩy.',
    };
  }
};