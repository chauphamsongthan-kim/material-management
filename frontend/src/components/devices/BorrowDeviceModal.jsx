import { useState } from 'react';
import { X, HandCoins, Package, UserRound } from 'lucide-react';

function BorrowDeviceModal({
  device,
  onClose,
  onSuccess,
  borrowDevice,
}) {
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowedQuantity, setBorrowedQuantity] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');

    if (!borrowerName.trim()) {
      setError('Vui lòng nhập tên người mượn.');
      return;
    }

    const quantity = Number(borrowedQuantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError('Số lượng mượn phải là số nguyên lớn hơn 0.');
      return;
    }

    if (quantity > Number(device.current_quantity)) {
      setError(
        `Số lượng mượn không được vượt quá số lượng hiện tại (${device.current_quantity}).`
      );
      return;
    }

    try {
      setLoading(true);

      const result = await borrowDevice(device.device_id, {
        borrower_name: borrowerName.trim(),
        borrowed_quantity: quantity,
      });

      if (!result.success) {
        setError(
          result.message || 'Không thể mượn thiết bị.'
        );
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Lỗi mượn thiết bị:', err);

      setError(
        err.response?.data?.message ||
        'Không thể mượn thiết bị.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <HandCoins size={22} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Mượn thiết bị
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Tạo một lượt mượn thiết bị
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Đóng"
            className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* DEVICE INFO */}
        <div className="mx-6 mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm">
              <Package size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-gray-800">
                {device.device_name}
              </p>

              <p className="mt-0.5 text-sm text-gray-500">
                {device.device_type}
              </p>
            </div>
          </div>

          {/* CURRENT QUANTITY */}
          <div className="mt-4 flex items-center justify-between rounded-lg bg-white px-4 py-3">
            <span className="text-sm text-gray-500">
              Số lượng hiện tại
            </span>

            <span className="text-lg font-bold text-blue-600">
              {device.current_quantity}
            </span>
          </div>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 px-6 py-6"
        >
          {/* NGƯỜI MƯỢN */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <UserRound size={16} className="text-gray-400" />
              Người mượn
              <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={borrowerName}
              onChange={(event) =>
                setBorrowerName(event.target.value)
              }
              placeholder="Nhập tên người mượn"
              disabled={loading}
              autoFocus
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>

          {/* SỐ LƯỢNG MƯỢN */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <Package size={16} className="text-gray-400" />
              Số lượng mượn
              <span className="text-red-500">*</span>
            </label>

            <input
              type="number"
              min="1"
              max={device.current_quantity}
              step="1"
              value={borrowedQuantity}
              onChange={(event) =>
                setBorrowedQuantity(event.target.value)
              }
              placeholder="Nhập số lượng"
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-gray-100"
            />

            <p className="mt-2 text-xs text-gray-400">
              Tối đa có thể mượn:{' '}
              <span className="font-semibold text-gray-600">
                {device.current_quantity}
              </span>
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                !
              </div>

              <p className="text-sm leading-5 text-red-600">
                {error}
              </p>
            </div>
          )}

          {/* FOOTER */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận mượn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BorrowDeviceModal;