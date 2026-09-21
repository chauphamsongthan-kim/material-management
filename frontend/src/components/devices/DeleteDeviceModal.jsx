import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

function DeleteDeviceModal({
  device,
  onClose,
  onSuccess,
  deleteDevice,
}) {
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    try {
      setDeleting(true);
      setError('');

      const result = await deleteDevice(device.device_id);

      if (!result.success) {
        setError(
          result.message || 'Không thể xóa thiết bị.'
        );
        return;
      }

      await onSuccess();
    } catch (err) {
      console.error('Lỗi xóa thiết bị:', err);

      setError(
        err.response?.data?.message ||
          'Không thể xóa thiết bị.'
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Xóa thiết bị
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Bạn có chắc muốn xóa thiết bị{' '}
                <span className="font-semibold text-gray-800">
                  "{device.device_name}"
                </span>
                ?
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-yellow-50 px-4 py-3 text-sm leading-6 text-yellow-700">
            <p className="font-medium">
              Lưu ý:
            </p>

            <p className="mt-1">
              Toàn bộ lịch sử mượn/trả của thiết bị
              cũng sẽ bị xóa.
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {deleting ? 'Đang xóa...' : 'Xóa thiết bị'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteDeviceModal;