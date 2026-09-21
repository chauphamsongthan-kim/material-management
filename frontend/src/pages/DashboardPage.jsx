import { useEffect, useState } from 'react';
import { Search, LogOut, Package } from 'lucide-react';
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


const [showAddDeviceModal, setShowAddDeviceModal] =
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
        setError(result.message || 'Không thể tải danh sách Ban.');
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
        result.message || 'Không thể tải danh sách thiết bị.'
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
    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">

          {/* Logo + Tên */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Package size={22} />
            </div>

            <div>
              <h1 className="font-bold text-gray-800">
                Hệ thống quản lý thiết bị
              </h1>

              <p className="text-xs text-gray-500">
                Quản lý thiết bị và vật tư
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative hidden flex-1 max-w-md md:block">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Tìm kiếm thiết bị..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-blue-500"
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

                {!searching && searchResults.length === 0 && (
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
                        navigate(`/devices/${device.device_id}`);
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

          {/* User */}
          <div className="flex items-center gap-4">

            <div className="text-right">
              <p className="font-medium text-gray-800">
                {user?.username}
              </p>

              <p className="text-sm text-gray-500">
                {user?.role}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
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
      <main className="mx-auto max-w-7xl px-6 py-10">

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Chào mừng trở lại, {user?.username}
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
      user?.department_id === selectedDepartment.department_id) && (
      <button
        type="button"
        onClick={() => setShowAddDeviceModal(true)}
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
        onClose={() => setShowAddDeviceModal(false)}
        onSuccess={async () => {
          setShowAddDeviceModal(false);

          // Tải lại danh sách thiết bị
          await handleDepartmentClick(selectedDepartment);
        }}
      />
    )}
  </div>
);
}

export default DashboardPage;