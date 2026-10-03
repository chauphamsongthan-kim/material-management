
import {
  subscribeToPush,
  linkPushDevice,
  getPushStatus,
  unsubscribeFromPush,
} from '../api/pushApi';

// Chuyển VAPID public key từ Base64 URL-safe sang Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

// Kiểm tra trình duyệt có hỗ trợ Push Notification không
export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    window.isSecureContext
  );
}

// Lấy hoặc tạo đăng ký Push của trình duyệt.
// Hàm này không yêu cầu quyền thông báo và không tự bật cho tài khoản.
async function getOrCreateDeviceSubscription() {
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error('Chưa cấu hình VITE_VAPID_PUBLIC_KEY ở frontend.');
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  return subscription;
}

// Đăng ký và bật Push cho tài khoản hiện tại
export async function enablePushNotifications() {
  if (!isPushSupported()) {
    return {
      success: false,
      message:
        'Trình duyệt hoặc môi trường hiện tại chưa hỗ trợ thông báo đẩy. Hãy dùng trình duyệt hỗ trợ và HTTPS.',
    };
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      return {
        success: false,
        message:
          permission === 'denied'
            ? 'Bạn đã chặn quyền thông báo trong trình duyệt.'
            : 'Bạn chưa cấp quyền thông báo.',
      };
    }

    const subscription = await getOrCreateDeviceSubscription();

    const result = await subscribeToPush(subscription.toJSON());

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      subscribed: true,
      message: 'Đã bật chuông báo cho tài khoản này.',
    };
  } catch (error) {
    console.error('Lỗi bật Push Notification:', error);

    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Không thể bật thông báo đẩy.',
    };
  }
}

// Tắt Push cho tài khoản hiện tại, không hủy đăng ký của trình duyệt
export async function disablePushNotifications() {
  if (!isPushSupported()) {
    return {
      success: false,
      message: 'Trình duyệt không hỗ trợ thông báo đẩy.',
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = registration
      ? await registration.pushManager.getSubscription()
      : null;

    if (!subscription) {
      return {
        success: true,
        subscribed: false,
        message: 'Tài khoản hiện tại chưa có đăng ký Push trên thiết bị này.',
      };
    }

    const result = await unsubscribeFromPush(subscription.endpoint);

    if (!result.success) {
      return result;
    }

    // Không gọi subscription.unsubscribe() ở đây:
    // các tài khoản khác trên cùng thiết bị có thể vẫn đang bật Push.
    return {
      success: true,
      subscribed: false,
      message: 'Đã tắt chuông báo cho tài khoản này.',
    };
  } catch (error) {
    console.error('Lỗi tắt Push Notification:', error);

    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Không thể tắt thông báo đẩy.',
    };
  }
}

// Kiểm tra trạng thái Push riêng của tài khoản đang đăng nhập.
// Nếu trình duyệt đã có subscription, liên kết thiết bị với tài khoản
// ở trạng thái mặc định tắt (không làm thay đổi trạng thái đã có).
export async function getPushSubscriptionStatus() {
  if (!isPushSupported()) {
    return {
      supported: false,
      subscribed: false,
      deviceSubscribed: false,
      permission: 'unsupported',
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = registration
      ? await registration.pushManager.getSubscription()
      : null;

    if (!subscription) {
      return {
        supported: true,
        subscribed: false,
        deviceSubscribed: false,
        permission: Notification.permission,
      };
    }

    // Liên kết endpoint với tài khoản hiện tại.
    // API /link không bật Push nếu tài khoản đang tắt.
    const linkResult = await linkPushDevice(subscription.toJSON());

    if (!linkResult.success) {
      return {
        supported: true,
        subscribed: false,
        deviceSubscribed: true,
        permission: Notification.permission,
        message: linkResult.message,
      };
    }

    // Lấy trạng thái bật/tắt riêng của tài khoản từ backend.
    const statusResult = await getPushStatus(subscription.endpoint);

    if (!statusResult.success) {
      return {
        supported: true,
        subscribed: false,
        deviceSubscribed: true,
        permission: Notification.permission,
        message: statusResult.message,
      };
    }

    return {
      supported: true,
      subscribed: statusResult.enabled,
      deviceSubscribed: true,
      permission: Notification.permission,
    };
  } catch (error) {
    console.error('Lỗi kiểm tra trạng thái Push:', error);

    return {
      supported: true,
      subscribed: false,
      deviceSubscribed: false,
      permission: Notification.permission,
      message:
        error.response?.data?.message ||
        error.message ||
        'Không thể kiểm tra trạng thái thông báo đẩy.',
    };
  }
}