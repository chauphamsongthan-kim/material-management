import { useEffect, useState } from 'react';
import {
  Search,
  LogOut,
  KeyRound,
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
                  : 'Quản trị viên'}
              </p>

              <p className="text-sm text-[#7c3a0a]">
                {user?.role}
              </p>
            </div>

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

              {(user?.role === 'ADMIN' ||
                Number(user?.department_id) ===
                  Number(
                    selectedDepartment.department_id
                  )) && (
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