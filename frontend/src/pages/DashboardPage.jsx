import { useEffect, useState } from 'react';
import {
  Search,
  LogOut,
  KeyRound,
  Bell,
  BellRing,
  BellOff,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { getDepartments } from '../api/departmentApi';

import {
  getDevicesByDepartment,
  addDevice,
  searchDevices,
} from '../api/deviceApi';

import DepartmentCard from '../components/departments/DepartmentCard';
import DeviceTable from '../components/devices/DeviceTable';

import AddDeviceModal from '../components/devices/AddDeviceModal';
import ChangePasswordModal from '../components/common/ChangePasswordModal';
import {
  getNotifications,
  markNotificationRead,
  deleteNotification,
} from '../api/notificationApi';

import {
  isPushSupported,
  enablePushNotifications,
  disablePushNotifications,
  getPushSubscriptionStatus,
} from '../utils/pushNotification';

function DashboardPage() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');

  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Ban đang được chọn
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Danh sách thiết bị của Ban đang chọn
  const [devices, setDevices] = useState([]);

  // Trạng thái tải thiết bị
  const [loadingDevices, setLoadingDevices] = useState(false);

  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);

  const [showChangePasswordModal, setShowChangePasswordModal] =
    useState(false);

  // Trạng thái thông báo
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState('');

  // Trạng thái Push Notification trên thiết bị hiện tại
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState('');

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    try {
      setLoading(true);

      const result = await getDepartments();

      if (result.success) {
        setDepartments(result.data);
      } else {
        setError(
          result.message || 'Không thể tải danh sách Ban.'
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Không thể kết nối đến máy chủ.'
      );
    } finally {
      setLoading(false);
    }
  }
  // Tải thông báo của tài khoản đang đăng nhập
const loadNotifications = async () => {
  try {
    setLoadingNotifications(true);
    setNotificationError('');

    const result = await getNotifications();

    if (result.success) {
      setNotifications(result.data || []);
      setUnreadCount(Number(result.unread_count) || 0);
    } else {
      setNotificationError(
        result.message || 'Không thể tải thông báo.'
      );
    }
  } catch (err) {
    console.error('Lỗi tải thông báo:', err);
    setNotificationError(
      err.response?.data?.message || 'Không thể tải thông báo.'
    );
  } finally {
    setLoadingNotifications(false);
  }
};


// Kiểm tra khả năng hỗ trợ và trạng thái Push riêng của tài khoản
useEffect(() => {
  let cancelled = false;

  // Tránh hiển thị nhầm trạng thái của tài khoản trước đó
  setPushSubscribed(false);
  setPushMessage('');

  async function checkPushStatus() {
    const status = await getPushSubscriptionStatus();

    if (cancelled) return;

    setPushSupported(status.supported);
    setPushSubscribed(status.subscribed);

    if (status.message) {
      setPushMessage(status.message);
    }
  }

  checkPushStatus();

  return () => {
    cancelled = true;
  };
}, [user?.user_id]);

// Bật hoặc tắt Push Notification
const handleTogglePush = async () => {
  if (pushBusy) return;

  setPushBusy(true);
  setPushMessage('');

  try {
    if (pushSubscribed) {
      const result = await disablePushNotifications();

      if (result.success) {
        setPushSubscribed(false);
      }

      setPushMessage(result.message);
    } else {
      const result = await enablePushNotifications();

      if (result.success) {
        setPushSubscribed(true);
      }

      setPushMessage(result.message);
    }
  } catch (err) {
    console.error('Lỗi thay đổi Push Notification:', err);
    setPushMessage('Đã xảy ra lỗi khi thay đổi cài đặt thông báo.');
  } finally {
    setPushBusy(false);
  }
};

// Tự tải thông báo khi vào Dashboard và cập nhật định kỳ
useEffect(() => {
  if (!user?.user_id) {
    setNotifications([]);
    setUnreadCount(0);
    setShowNotifications(false);
    return;
  }

  loadNotifications();

  const intervalId = setInterval(() => {
    loadNotifications();
  }, 15000);

  return () => clearInterval(intervalId);
}, [user?.user_id, user?.role]);

// Đánh dấu thông báo đã đọc
const handleNotificationClick = async (notification) => {
  try {
    if (!notification.is_read) {
      const result = await markNotificationRead(
        notification.notification_id
      );

      if (!result.success) {
        setNotificationError(
          result.message || 'Không thể đánh dấu đã đọc.'
        );
        return;
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item.notification_id === notification.notification_id
            ? { ...item, is_read: 1 }
            : item
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    }

    setShowNotifications(false);

    if (notification.device_id) {
      navigate(`/devices/${notification.device_id}`);
    }
  } catch (err) {
    console.error('Lỗi cập nhật thông báo:', err);
    setNotificationError(
      err.response?.data?.message ||
        'Không thể cập nhật thông báo.'
    );
  }
};

  // Xóa thông báo
const handleDeleteNotification = async (notification) => {
  try {
    setNotificationError('');

    const result = await deleteNotification(
      notification.notification_id
    );

    if (!result.success) {
      setNotificationError(
        result.message || 'Không thể xóa thông báo.'
      );
      return;
    }

    // Xóa thông báo khỏi danh sách trên giao diện
    setNotifications((previous) =>
      previous.filter(
        (item) =>
          item.notification_id !== notification.notification_id
      )
    );

    // Nếu thông báo chưa đọc, giảm số lượng chưa đọc
    if (
      notification.is_read === false ||
      notification.is_read === 0
    ) {
      setUnreadCount((previous) => Math.max(0, previous - 1));
    }
  } catch (err) {
    console.error('Lỗi xóa thông báo:', err);

    setNotificationError(
      err.response?.data?.message ||
        'Không thể xóa thông báo.'
    );
  }
};

  const handleSearch = async (keyword) => {
    setSearch(keyword);

    if (!keyword.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setSearching(true);
      setShowSearchResults(true);

      const result = await searchDevices(keyword.trim());

      if (result.success) {
        setSearchResults(result.data || []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Lỗi tìm kiếm thiết bị:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const handleDepartmentClick = async (department) => {
    try {
      setSelectedDepartment(department);
      setDevices([]);
      setLoadingDevices(true);
      setError('');

      const result = await getDevicesByDepartment(
        department.department_id
      );

      if (result.success) {
        setDevices(result.data || []);
      } else {
        setError(
          result.message ||
            'Không thể tải danh sách thiết bị.'
        );
      }
    } catch (err) {
      console.error('Lỗi tải thiết bị:', err);

      setError(
        err.response?.data?.message ||
          'Không thể tải danh sách thiết bị.'
      );
    } finally {
      setLoadingDevices(false);
    }
  };

  const filteredDepartments = departments;

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* DASHBOARD BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">

        {/* Nền vàng thuần */}
        <div className="absolute inset-0 bg-[#FFFF00]/5" />

        {/* Vùng vàng mờ */}
        <div className="absolute -left-32 -top-32 h-[550px] w-[550px] rounded-full bg-[#FFFF00]/25 blur-3xl" />

        <div className="absolute -bottom-40 -right-40 h-[650px] w-[650px] rounded-full bg-[#FFFF00]/20 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFFF00]/15 blur-3xl" />

      </div>

      {/* HEADER */}

      {/* HEADER */}
      <header className="border-b border-amber-700/40 bg-[linear-gradient(to_bottom,#fdc82f,#f0b10e)] shadow-md">
        <div className="flex w-full flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-6">

          {/* Logo + Tên hệ thống */}
          <div className="flex w-full min-w-0 shrink-0 items-center gap-3 lg:w-auto">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white p-1.5 shadow-md ring-2 ring-white/80">
              <img
                src="/logo-chua-hoi-duc.png"
                alt="Logo Chùa Hội Đức"
                className="h-full w-full rounded-full object-contain"
              />
            </div>

            <div>
              <h1 className="text-xl font-bold text-[#7c3a0a] sm:text-2xl">
                Hệ thống quản lý thiết bị và vật tư
              </h1>

              <p className="text-sm text-[#8a4b0f]">
                Chùa Hội Đức
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative block w-full min-w-0 max-w-xl flex-1">
            <div className="relative">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a16207]"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  handleSearch(e.target.value)
                }
                placeholder="Tìm kiếm thiết bị..."
                className="w-full rounded-lg border border-amber-200 bg-[#fffaf0] py-2.5 pl-10 pr-4 text-[#5c2a06] placeholder:text-[#a16207] outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-200"
              />
            </div>

            {/* SEARCH RESULTS */}
            {showSearchResults && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">

                {searching && (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Đang tìm kiếm...
                  </div>
                )}

                {!searching &&
                  searchResults.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Không tìm thấy thiết bị.
                    </div>
                  )}

                {!searching &&
                  searchResults.map((device) => (
                    <button
                      key={device.device_id}
                      type="button"
                      onClick={() => {
                        setShowSearchResults(false);
                        setSearch('');
                        navigate(
                          `/devices/${device.device_id}`
                        );
                      }}
                      className="block w-full border-b border-gray-100 px-4 py-3 text-left transition hover:bg-gray-50"
                    >
                      <p className="font-medium text-gray-800">
                        {device.device_name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {device.device_type}
                      </p>

                      <p className="mt-1 text-xs text-blue-600">
                        {device.department_name}
                      </p>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* USER + ACTIONS */}
          <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 lg:w-auto lg:flex-nowrap lg:gap-3">
            
            
            {/* Thông tin tài khoản */}
            <div className="mr-2 text-right">
              <p className="font-semibold text-[#5c2a06]">
                {user?.role === 'HEAD'
                ? `Trưởng ban ${
                    user?.department_name?.replace(
                      /^Ban\s/,
                      'ban '
                    ) || ''
                  }`
                : user?.role === 'GUEST'
                  ? 'Khách'
                  : 'Quản trị viên'}
              </p>

              <p className="text-sm text-[#7c3a0a]">
                {user?.role}
              </p>
            </div>

{/* NOTIFICATIONS - ADMIN, HEAD và GUEST */}
{user?.user_id && (
    <div className="relative">
            <button
              type="button"
              onClick={() => {
                const nextState = !showNotifications;
                setShowNotifications(nextState);

                if (nextState) {
                  loadNotifications();
                }
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-amber-300 bg-white text-[#7c3a0a] transition hover:bg-amber-50"
              aria-label="Thông báo"
              title="Thông báo"
            >
              <Bell size={20} />

              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <button
                  type="button"
                  aria-label="Đóng danh sách thông báo"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setShowNotifications(false)}
                />

                <div className="absolute right-0 top-full z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-xl">
                  <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                    <h3 className="whitespace-nowrap font-semibold text-gray-800">
                      Thông báo
                    </h3>

                    <span className="whitespace-nowrap text-xs text-gray-500">
                      {unreadCount} chưa đọc
                    </span>
                  </div>

                  {loadingNotifications && notifications.length === 0 && (
                    <div className="p-5 text-center text-sm text-gray-500">
                      Đang tải thông báo...
                    </div>
                  )}

                  {notificationError && (
                    <div className="p-3 text-sm text-red-600">
                      {notificationError}
                    </div>
                  )}

                  {!loadingNotifications && notifications.length === 0 && (
                    <div className="p-6 text-center text-sm text-gray-500">
                      Bạn chưa có thông báo nào.
                    </div>
                  )}

                  {notifications.length > 0 && (
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.notification_id}
                          className={`flex items-start gap-2 border-b border-gray-100 px-3 py-3 transition hover:bg-amber-50 ${
                            !notification.is_read ? 'bg-amber-50/70' : 'bg-white'
                          }`}
                        >
                          {/* Nội dung thông báo */}
                          <button
                            type="button"
                            onClick={() => handleNotificationClick(notification)}
                            className="flex min-w-0 flex-1 items-start gap-2 text-left"
                          >
                            {!notification.is_read && (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                            )}

                            <div className="min-w-0 flex-1">
                            {notification.title && (
                              <p className="truncate text-sm font-semibold text-gray-800">
                                {notification.title}
                              </p>
                            )}

                            <p className="mt-1 text-sm text-gray-700">
                              {notification.message}
                            </p>

                              <p className="mt-1 whitespace-nowrap text-xs text-gray-500">
                                {notification.created_at ? (
                                  <>
                                    <span>
                                      {new Date(notification.created_at).toLocaleDateString('vi-VN')}
                                    </span>

                                    <span className="ml-6">
                                      {new Date(notification.created_at).toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: false,
                                      })}
                                    </span>
                                  </>
                                ) : ''}
                              </p>
                            </div>
                          </button>

                          {/* Nút xóa thông báo */}
                          <button
                            type="button"
                            onClick={() => handleDeleteNotification(notification)}
                            aria-label="Xóa thông báo"
                            title="Xóa thông báo"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-100 hover:text-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            </div>
)}

            {/* PUSH NOTIFICATION */}
            {user?.user_id && (
              <div className="relative">
                <button
                  type="button"
                  onClick={handleTogglePush}
                  disabled={!pushSupported || pushBusy}
                  className={`flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition ${
                    pushSubscribed
                      ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                      : 'border-amber-300 bg-white text-[#7c3a0a] hover:bg-amber-50'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                  aria-label={
                    pushSubscribed
                      ? 'Tắt thông báo đẩy'
                      : 'Bật thông báo đẩy'
                  }
                  title={
                    !pushSupported
                      ? 'Trình duyệt hoặc môi trường hiện tại không hỗ trợ Push Notification'
                      : pushSubscribed
                        ? 'Tắt thông báo đẩy trên thiết bị này'
                        : 'Bật thông báo đẩy trên thiết bị này'
                  }
                >
                  {pushBusy ? (
                    <span className="text-xs">Đang xử lý...</span>
                  ) : pushSubscribed ? (
                    <>
                      <BellRing size={17} />
                      <span className="hidden sm:inline">Đang bật</span>
                    </>
                  ) : (
                    <>
                      <BellOff size={17} />
                      <span className="hidden sm:inline">Bật thông báo</span>
                    </>
                  )}
                </button>

                {pushMessage && (
                  <div
                    role="status"
                    className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 shadow-lg"
                  >
                    {pushMessage}
                  </div>
                )}
              </div>
            )}

            {/* Quản lý tài khoản - chỉ ADMIN */}
            {user?.role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => navigate('/accounts')}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Quản lý tài khoản
              </button>
            )}

            {/* Đổi mật khẩu */}
            <button
              type="button"
              onClick={() =>
                setShowChangePasswordModal(true)
              }
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <KeyRound size={17} />

              <span className="hidden lg:inline">
                Đổi mật khẩu
              </span>
            </button>

            {/* Đăng xuất */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              <LogOut size={18} />

              <span className="hidden sm:inline">
                Đăng xuất
              </span>
            </button>

          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">

        {/* Greeting */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Chào mừng trở lại, {user?.full_name}
          </h2>

          <p className="mt-2 text-gray-600">
            Chọn một Ban để xem và quản lý thiết bị.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-10 text-center text-gray-500">
            Đang tải danh sách Ban...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-100 p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Departments */}
        {!loading && !error && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDepartments.map((department) => (
              <DepartmentCard
                key={department.department_id}
                department={department}
                onClick={() =>
                  handleDepartmentClick(department)
                }
              />
            ))}
          </div>
        )}

        {/* Không tìm thấy */}
        {!loading &&
          !error &&
          filteredDepartments.length === 0 && (
            <div className="py-10 text-center text-gray-500">
              Không tìm thấy Ban phù hợp.
            </div>
          )}

        {/* DEVICES */}
        {selectedDepartment && (
          <section className="mt-10">

            <div className="mb-5 flex items-center justify-between gap-4">

              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedDepartment.department_name}
                </h2>

                <p className="mt-1 text-gray-500">
                  Danh sách thiết bị
                </p>
              </div>

                {(
                  user?.role === 'ADMIN' ||
                  (
                    user?.role === 'HEAD' &&
                    Number(user?.department_id) ===
                      Number(selectedDepartment.department_id)
                  )
                ) && (
                <button
                  type="button"
                  onClick={() =>
                    setShowAddDeviceModal(true)
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  + Thêm thiết bị
                </button>
              )}

            </div>

            {/* Loading thiết bị */}
            {loadingDevices && (
              <div className="rounded-lg bg-white p-10 text-center text-gray-500 shadow-sm">
                Đang tải danh sách thiết bị...
              </div>
            )}

            {/* Bảng thiết bị */}
            {!loadingDevices && (
              <DeviceTable
                devices={devices}
                onDeviceClick={(deviceId) => {
                  navigate(`/devices/${deviceId}`);
                }}
              />
            )}

          </section>
        )}

      </main>

      {/* ADD DEVICE MODAL */}
      {showAddDeviceModal && selectedDepartment && (
        <AddDeviceModal
          department={selectedDepartment}
          addDevice={addDevice}
          onClose={() =>
            setShowAddDeviceModal(false)
          }
          onSuccess={async () => {
            setShowAddDeviceModal(false);

            await handleDepartmentClick(
              selectedDepartment
            );
          }}
        />
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() =>
            setShowChangePasswordModal(false)
          }
        />
      )}

    </div>
  );
}

export default DashboardPage;