import { useEffect, useState } from 'react';
import {
  X,
  LoaderCircle,
  Package,
  UserRound,
  HandCoins,
} from 'lucide-react';

import { getActiveBorrows } from '../../api/deviceApi';

function ReturnDeviceModal({
  device,
  onClose,
  onSuccess,
  returnDevice,
}) {
  const [activeBorrows, setActiveBorrows] = useState([]);
  const [selectedBorrowId, setSelectedBorrowId] = useState('');
  const [returnerName, setReturnerName] = useState('');
  const [returnedQuantity, setReturnedQuantity] = useState('');

  const [loadingBorrows, setLoadingBorrows] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadActiveBorrows = async () => {
      try {
        setLoadingBorrows(true);
        setError('');

        const response = await getActiveBorrows(device.device_id);

        const borrows = response.data || [];

        setActiveBorrows(borrows);

        if (borrows.length > 0) {
          setSelectedBorrowId(borrows[0].borrow_id);
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Không thể tải danh sách lượt mượn.'
        );
      } finally {
        setLoadingBorrows(false);
      }
    };

    loadActiveBorrows();
  }, [device.device_id]);

  const selectedBorrow = activeBorrows.find(
    (borrow) => borrow.borrow_id === selectedBorrowId
  );

  useEffect(() => {
    if (selectedBorrow) {
      setReturnedQuantity(
        String(selectedBorrow.remaining_quantity)
      );
    } else {
      setReturnedQuantity('');
    }
  }, [selectedBorrow]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const quantity = Number(returnedQuantity);

    if (!selectedBorrowId) {
      setError('Vui lòng chọn lượt mượn cần trả.');
      return;
    }

    if (!returnerName.trim()) {
      setError('Vui lòng nhập người trả.');
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError('Số lượng trả phải là số nguyên dương.');
      return;
    }

    if (
      selectedBorrow &&
      quantity > selectedBorrow.remaining_quantity
    ) {
      setError(
        `Số lượng trả không được vượt quá ${selectedBorrow.remaining_quantity}.`
      );
      return;
    }

    try {
      setSubmitting(true);

      const result = await returnDevice(
        device.device_id,
        {
          borrow_id: selectedBorrowId,
          returner_name: returnerName.trim(),
          returned_quantity: quantity,
        }
      );

      if (!result.success) {
        setError(
          result.message ||
          'Không thể thực hiện trả thiết bị.'
        );
        return;
      }

      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Không thể thực hiện trả thiết bị.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <HandCoins size={22} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Trả thiết bị
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Ghi nhận thiết bị được trả
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
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

          {loadingBorrows ? (
            <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 py-8 text-sm text-gray-500">
              <LoaderCircle
                size={20}
                className="mr-2 animate-spin"
              />
              Đang tải các lượt mượn...
            </div>
          ) : activeBorrows.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center">
              <p className="font-medium text-gray-700">
                Không có lượt mượn nào đang chờ trả.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Thiết bị hiện không có số lượng nào đang được mượn.
              </p>
            </div>
          ) : (
            <>
              {/* CHỌN LƯỢT MƯỢN */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <HandCoins
                    size={16}
                    className="text-gray-400"
                  />
                  Lượt mượn
                  <span className="text-red-500">*</span>
                </label>

                <select
                  value={selectedBorrowId}
                  onChange={(event) =>
                    setSelectedBorrowId(event.target.value)
                  }
                  disabled={submitting}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition hover:border-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  {activeBorrows.map((borrow) => (
              <option
                key={borrow.borrow_id}
                value={borrow.borrow_id}
              >
                {borrow.borrower_name} — mượn ngày{' '}
                {borrow.borrow_date} — Còn phải trả{' '}
                {borrow.remaining_quantity}
              </option>
                  ))}
                </select>
              </div>


              {/* NGƯỜI TRẢ */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <UserRound
                    size={16}
                    className="text-gray-400"
                  />
                  Người trả
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={returnerName}
                  onChange={(event) =>
                    setReturnerName(event.target.value)
                  }
                  placeholder="Nhập tên người trả"
                  disabled={submitting}
                  autoFocus
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              {/* SỐ LƯỢNG TRẢ */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Package
                    size={16}
                    className="text-gray-400"
                  />
                  Số lượng trả
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="number"
                  min="1"
                  max={selectedBorrow?.remaining_quantity || 1}
                  step="1"
                  value={returnedQuantity}
                  onChange={(event) =>
                    setReturnedQuantity(event.target.value)
                  }
                  placeholder="Nhập số lượng trả"
                  disabled={submitting}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                />

                {selectedBorrow && (
                  <p className="mt-2 text-xs text-gray-400">
                    Tối đa có thể trả:{' '}
                    <span className="font-semibold text-gray-600">
                      {selectedBorrow.remaining_quantity}
                    </span>
                  </p>
                )}
              </div>

              {/* FOOTER */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? 'Đang xử lý...'
                    : 'Xác nhận trả'}
                </button>
              </div>
            </>
          )}

          {/* NO ACTIVE BORROWS */}
          {!loadingBorrows && activeBorrows.length === 0 && (
            <div className="flex justify-end border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default ReturnDeviceModal;