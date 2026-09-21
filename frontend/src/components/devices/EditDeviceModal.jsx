import { useEffect, useState } from 'react';

function EditDeviceModal({
  device,
  onClose,
  onSuccess,
  updateDevice,
}) {
  const [deviceName, setDeviceName] = useState(
    device.device_name || ''
  );

  const [deviceType, setDeviceType] = useState(
    device.device_type || ''
  );

  const [originalQuantity, setOriginalQuantity] = useState(
    String(device.original_quantity || '')
  );

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDeviceName(device.device_name || '');
    setDeviceType(device.device_type || '');
    setOriginalQuantity(
      String(device.original_quantity || '')
    );
  }, [device]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');

    const name = deviceName.trim();
    const type = deviceType.trim();
    const quantity = Number(originalQuantity);

    if (!name || !type || !originalQuantity) {
      setError('Vui lòng nhập đầy đủ thông tin thiết bị.');
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError('Số lượng gốc phải là số nguyên lớn hơn 0.');
      return;
    }

    try {
      setSaving(true);

      const result = await updateDevice(
        device.device_id,
        {
          device_name: name,
          device_type: type,
          original_quantity: quantity,
        }
      );

      if (!result.success) {
        setError(
          result.message || 'Không thể cập nhật thiết bị.'
        );
        return;
      }

      await onSuccess();
    } catch (err) {
      console.error('Lỗi sửa thiết bị:', err);

      setError(
        err.response?.data?.message ||
          'Không thể cập nhật thiết bị.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-5">
          <h2 className="text-xl font-bold text-gray-800">
            Sửa thiết bị
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Cập nhật thông tin thiết bị.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tên thiết bị
              </label>

              <input
                type="text"
                value={deviceName}
                onChange={(event) =>
                  setDeviceName(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Nhập tên thiết bị"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Loại thiết bị
              </label>

              <input
                type="text"
                value={deviceType}
                onChange={(event) =>
                  setDeviceType(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Nhập loại thiết bị"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Số lượng gốc
              </label>

              <input
                type="number"
                min="1"
                value={originalQuantity}
                onChange={(event) =>
                  setOriginalQuantity(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-gray-500">
                Hiện tại: {device.current_quantity}
                {' / '}
                {device.original_quantity}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditDeviceModal;