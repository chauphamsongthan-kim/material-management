// =========================================
// GIỚI HẠN SỐ LẦN NHẬP SAI MẬT KHẨU
// Sai 6 lần liên tiếp -> khóa 30 giây
// =========================================
// Lưu trong bộ nhớ của tiến trình (không cần thêm bảng DB).
// Khi server khởi động lại thì bộ đếm được đặt lại.
// Khóa theo tên đăng nhập (không theo IP) vì server nằm sau proxy
// nên IP của mọi người có thể giống nhau.

const MAX_FAILS = 6;
const LOCK_MS = 30 * 1000;
const FAIL_WINDOW_MS = 15 * 60 * 1000; // quên các lần sai cũ hơn 15 phút
const MAX_ENTRIES = 10000;

const entries = new Map(); // key -> { fails, lockedUntil, lastFailAt }

function normalizeKey(raw) {
  return String(raw ?? '').trim().toLowerCase().slice(0, 100);
}

function cleanup(now = Date.now()) {
  for (const [key, entry] of entries) {
    const lockExpired = entry.lockedUntil <= now;
    const stale = now - entry.lastFailAt > FAIL_WINDOW_MS;

    if (lockExpired && stale) {
      entries.delete(key);
    }
  }

  // Chặn bộ nhớ phình to nếu bị gửi tràn tên đăng nhập ngẫu nhiên
  if (entries.size > MAX_ENTRIES) {
    const overflow = entries.size - MAX_ENTRIES;
    let removed = 0;

    for (const key of entries.keys()) {
      entries.delete(key);
      removed += 1;
      if (removed >= overflow) break;
    }
  }
}

const cleanupTimer = setInterval(() => cleanup(), 60 * 1000);
cleanupTimer.unref();

// Trả về số giây còn phải chờ (0 = được phép thử)
function getRetryAfterSeconds(rawKey) {
  const entry = entries.get(normalizeKey(rawKey));
  if (!entry) return 0;

  const remainingMs = entry.lockedUntil - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

// Ghi nhận một lần sai. Trả về số giây bị khóa (0 nếu chưa bị khóa).
function recordFailure(rawKey) {
  const key = normalizeKey(rawKey);
  const now = Date.now();

  let entry = entries.get(key);

  const lockFinished = entry && entry.fails >= MAX_FAILS && entry.lockedUntil <= now;
  const tooOld = entry && now - entry.lastFailAt > FAIL_WINDOW_MS;

  // Hết thời gian khóa (hoặc các lần sai đã quá cũ) -> đếm lại từ đầu
  if (!entry || lockFinished || tooOld) {
    entry = { fails: 0, lockedUntil: 0, lastFailAt: now };
  }

  entry.fails += 1;
  entry.lastFailAt = now;

  if (entry.fails >= MAX_FAILS) {
    entry.lockedUntil = now + LOCK_MS;
  }

  entries.set(key, entry);

  return entry.lockedUntil > now ? Math.ceil(LOCK_MS / 1000) : 0;
}

// Đăng nhập đúng -> xóa bộ đếm
function reset(rawKey) {
  entries.delete(normalizeKey(rawKey));
}

module.exports = {
  MAX_FAILS,
  LOCK_MS,
  getRetryAfterSeconds,
  recordFailure,
  reset,
};
