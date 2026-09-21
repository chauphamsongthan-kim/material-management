import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Package,
  LoaderCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import {
  getDeviceById,
  borrowDevice,
  returnDevice,
  getDeviceHistory,
  updateDevice,
  deleteDevice,
} from '../api/deviceApi';

import BorrowDeviceModal from '../components/devices/BorrowDeviceModal';
import ReturnDeviceModal from '../components/devices/ReturnDeviceModal';
import DeviceHistoryTable from '../components/devices/DeviceHistoryTable';

import EditDeviceModal from '../components/devices/EditDeviceModal';
import DeleteDeviceModal from '../components/devices/DeleteDeviceModal';

function DeviceDetailPage() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  
  const { user } = useAuth();

  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canManageDevice =
  user?.role === 'ADMIN' ||
  user?.department_id === device?.department_id;

  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    loadDevice();
    loadHistory();
  }, [deviceId]);

  async function loadDevice() {
    try {
      setLoading(true);
      setError('');

      const result = await getDeviceById(deviceId);

      if (result.success) {
        setDevice(result.data);
      } else {
        setError(
          result.message || 'Không thể tải thông tin thiết bị.'
        );
      }
    } catch (err) {
      console.error('Lỗi tải thiết bị:', err);

      setError(
        err.response?.data?.message ||
          'Không thể tải thông tin thiết bị.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
  try {
    setLoadingHistory(true);
    setHistoryError('');

    const result = await getDeviceHistory(deviceId);

    if (result.success) {
      setHistory(result.data || []);
    } else {
      setHistoryError(
        result.message || 'Không thể tải lịch sử mượn/trả.'
      );
    }
  } catch (err) {
    console.error('Lỗi tải lịch sử:', err);

    setHistoryError(
      err.response?.data?.message ||
        'Không thể tải lịch sử mượn/trả.'
    );
  } finally {
    setLoadingHistory(false);
  }
}

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500">
            <LoaderCircle
              size={24}
              className="animate-spin"
            />
            Đang tải thông tin thiết bị...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>

          <div className="rounded-xl bg-red-50 p-6 text-red-600">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!device) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-blue-600"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
        </div>
      </header>
        {/* MAIN */}
        <main className="mx-auto max-w-4xl px-6 py-8">
          {/* TITLE */}
          <div className="mb-8">
            <p className="text-xl font-bold text-blue-600">
              CHI TIẾT THIẾT BỊ
            </p>

            <p className="mt-2 text-base text-gray-500">
              Thông tin và lịch sử mượn / trả thiết bị
            </p>
          </div>

        {/* DEVICE INFORMATION */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Package size={28} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {device.device_name}
                </h2>

                <p className="mt-1 text-gray-500">
                  {device.device_type}
                </p>
              </div>
            </div>
          </div>

          {/* INFORMATION GRID */}
          <div className="grid gap-3 px-6 py-5 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-sm text-gray-500">
                Loại thiết bị
              </p>

              <p className="mt-1 font-medium text-gray-800">
                {device.device_type}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-sm text-gray-500">
                Ban quản lý
              </p>

              <p className="mt-1 font-medium text-gray-800">
                {device.department_name}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-sm text-gray-500">
                Số lượng gốc
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-800">
                {device.original_quantity}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-sm text-gray-500">
                Số lượng hiện tại
              </p>

            <p className="mt-1 text-2xl font-bold text-blue-600">
              {device.current_quantity}
            </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-wrap gap-3 border-t border-gray-200 px-6 py-5">
            
            {/* MƯỢN */}
            <button
              type="button"
              onClick={() => setShowBorrowModal(true)}
              disabled={device.current_quantity <= 0}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
            >
              Mượn thiết bị
            </button>

            {/* TRẢ */}
            {canManageDevice && (
              <button
                type="button"
                onClick={() => setShowReturnModal(true)}
                className="rounded-xl border border-green-200 bg-white px-5 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50"
              >
                Trả thiết bị
              </button>
            )}

            {/* QUẢN LÝ THIẾT BỊ */}
            {canManageDevice && (
              <>
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <Pencil size={16} />
                  Sửa
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Xóa
                </button>
              </>
            )}
          </div>
        </div>

                {/* HISTORY */}
        <section className="mt-6">
          {historyError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
              {historyError}
            </div>
          ) : (
            <DeviceHistoryTable
              history={history}
              loading={loadingHistory}
            />
          )}
        </section>
      </main>

      {/* BORROW MODAL */}
      {showBorrowModal && (
        <BorrowDeviceModal
          device={device}
          borrowDevice={borrowDevice}
          onClose={() => setShowBorrowModal(false)}
          onSuccess={async () => {
            setShowBorrowModal(false);
            await loadDevice();
            await loadHistory();
          }}
        />
      )}

      {/* RETURN MODAL */}
      {showReturnModal && (
        <ReturnDeviceModal
          device={device}
          returnDevice={returnDevice}
          onClose={() => setShowReturnModal(false)}
          onSuccess={async () => {
          setShowReturnModal(false);
          await loadDevice();
          await loadHistory();
        }}
        />
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <EditDeviceModal
          device={device}
          updateDevice={updateDevice}
          onClose={() => setShowEditModal(false)}
          onSuccess={async () => {
            setShowEditModal(false);
            await loadDevice();
          }}
        />
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <DeleteDeviceModal
          device={device}
          deleteDevice={deleteDevice}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={async () => {
            setShowDeleteModal(false);
            navigate(-1);
          }}
        />
      )}

    </div>
  );
}

export default DeviceDetailPage;