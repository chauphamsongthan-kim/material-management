// =========================================
// KIỂM TRA ĐỊA CHỈ PUSH HỢP LỆ
// =========================================
// Địa chỉ push do trình duyệt cấp luôn thuộc máy chủ push của
// Google, Mozilla, Apple hoặc Microsoft. Chỉ chấp nhận các máy chủ này
// để người dùng không thể bắt server gọi tới một địa chỉ tùy ý.
//
// Cần thêm máy chủ khác: đặt PUSH_ALLOWED_HOSTS trong .env,
// ví dụ PUSH_ALLOWED_HOSTS=push.example.com,push2.example.com

const DEFAULT_ALLOWED_HOSTS = [
  'fcm.googleapis.com', // Chrome, Edge, Opera, Samsung Internet, Android
  'push.services.mozilla.com', // Firefox
  'push.apple.com', // Safari / iOS
  'notify.windows.com', // Windows (WNS)
];

const MAX_ENDPOINT_LENGTH = 2048;

function getAllowedHosts() {
  const extra = (process.env.PUSH_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  return [...DEFAULT_ALLOWED_HOSTS, ...extra];
}

function isAllowedPushEndpoint(endpoint) {
  if (typeof endpoint !== 'string' || endpoint.length > MAX_ENDPOINT_LENGTH) {
    return false;
  }

  let url;

  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:') return false;
  if (url.username || url.password) return false;
  if (url.port && url.port !== '443') return false;

  const hostname = url.hostname.toLowerCase();

  return getAllowedHosts().some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
  );
}

module.exports = { isAllowedPushEndpoint };
