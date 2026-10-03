
import { useEffect, useState } from 'react';
import { X, Plus, Package, Layers3, ImagePlus } from 'lucide-react';

function AddDeviceModal({
  department,
  onClose,
  onSuccess,
  addDevice,
}) {
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [originalQuantity, setOriginalQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setImageFile(null);
      setImagePreview('');
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.');
      event.target.value = '';
      setImageFile(null);
      setImagePreview('');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 5 MB.');
      event.target.value = '';
      setImageFile(null);
      setImagePreview('');
      return;
    }

    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');

    const name = deviceName.trim();
    const type = deviceType.trim();
    const quantity = Number(originalQuantity);

    if (!name) {
      setError('Vui lòng nhập tên thiết bị.');
      return;
    }

    if (!type) {
      setError('Vui lòng nhập loại thiết bị.');
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError('Số lượng gốc phải là số nguyên lớn hơn 0.');
      return;
    }

    try {
      setLoading(true);

      let deviceData = {
        device_name: name,
        device_type: type,
        original_quantity: quantity,
        notes: notes.trim(),
      };

      if (imageFile) {
        const formData = new FormData();

        formData.append('device_name', name);
        formData.append('device_type', type);
        formData.append('original_quantity', String(quantity));
        formData.append('notes', notes.trim());
        formData.append('image', imageFile);

        deviceData = formData;
      }

      const result = await addDevice(
        department.department_id,
        deviceData
      );

      if (!result.success) {
        setError(
          result.message || 'Không thể thêm thiết bị.'
        );
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Lỗi thêm thiết bị:', err);

      setError(
        err.response?.data?.message ||
        'Không thể thêm thiết bị.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Plus size={22} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Thêm thiết bị
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Thêm thiết bị vào ban
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

        {/* DEPARTMENT INFO */}
        <div className="mx-6 mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-500">
            Ban quản lý
          </p>

          <p className="mt-1 font-semibold text-blue-900">
            {department?.department_name}
          </p>
        </div>

        {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">

          {/* TÊN THIẾT BỊ */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <Package
                size={16}
                className="text-gray-400"
              />

              Tên thiết bị

              <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={deviceName}
              onChange={(event) => {
                setDeviceName(event.target.value);
                setError('');
              }}
              placeholder="Nhập tên thiết bị"
              disabled={loading}
              autoFocus
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>

          {/* LOẠI THIẾT BỊ */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <Layers3
                size={16}
                className="text-gray-400"
              />

              Loại thiết bị

              <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={deviceType}
              onChange={(event) => {
                setDeviceType(event.target.value);
                setError('');
              }}
              placeholder="Nhập loại thiết bị"
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>

          {/* SỐ LƯỢNG GỐC */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <Package
                size={16}
                className="text-gray-400"
              />

              Số lượng gốc

              <span className="text-red-500">*</span>
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={originalQuantity}
              onChange={(event) => {
                setOriginalQuantity(event.target.value);
                setError('');
              }}
              placeholder="Nhập số lượng"
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-gray-100"
            />

            <p className="mt-2 text-xs text-gray-400">
              Số lượng hiện tại sẽ được tự động đặt bằng số lượng gốc.
            </p>
          </div>

          {/* ẢNH THIẾT BỊ */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Ảnh thiết bị
              <span className="ml-1 font-normal text-gray-400">
                (Không bắt buộc)
              </span>
            </label>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-4 py-5 transition hover:border-blue-400 hover:bg-blue-50">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Xem trước ảnh thiết bị"
                  className="mb-3 h-36 w-full rounded-md object-contain"
                />
              ) : (
                <>
                  <ImagePlus
                    size={32}
                    className="mb-2 text-gray-400"
                  />

                  <span className="text-sm text-gray-600">
                    Nhấn để chọn ảnh thiết bị
                  </span>

                  <span className="mt-1 text-xs text-gray-400">
                    JPG, PNG hoặc WebP · Tối đa 5 MB
                  </span>
                </>
              )}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                disabled={loading}
                className="hidden"
              />
            </label>

            {imagePreview && (
              <div className="mt-2 flex items-center justify-between">
                <span className="truncate text-xs text-gray-500">
                  {imageFile?.name}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                  }}
                  disabled={loading}
                  className="ml-3 shrink-0 text-sm text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Xóa ảnh
                </button>
              </div>
            )}
          </div>

          {/* GHI CHÚ */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Ghi chú
            </label>

            <textarea
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                setError('');
              }}
              placeholder="Nhập ghi chú cho thiết bị (không bắt buộc)"
              rows={3}
              disabled={loading}
              className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
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
          </div>

          {/* FOOTER */}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
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
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} />

              {loading ? 'Đang thêm...' : 'Thêm thiết bị'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddDeviceModal;