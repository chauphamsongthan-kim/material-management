
import { useEffect, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

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

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [removeImage, setRemoveImage] = useState(false);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDeviceName(device.device_name || '');
    setDeviceType(device.device_type || '');
    setOriginalQuantity(
      String(device.original_quantity || '')
    );

    setImageFile(null);
    setImagePreview('');
    setRemoveImage(false);
    setError('');
  }, [device]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const currentImageUrl = device.image_url
    ? `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}${device.image_url}`
    : '';

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
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
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 5 MB.');
      event.target.value = '';
      return;
    }

    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setRemoveImage(true);
  };

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

      const hasImageChange = Boolean(imageFile) || removeImage;

      let deviceData = {
        device_name: name,
        device_type: type,
        original_quantity: quantity,
      };

      if (hasImageChange) {
        const formData = new FormData();

        formData.append('device_name', name);
        formData.append('device_type', type);
        formData.append('original_quantity', String(quantity));

        if (imageFile) {
          formData.append('image', imageFile);
        }

        if (removeImage) {
          formData.append('remove_image', 'true');
        }

        deviceData = formData;
      }

      const result = await updateDevice(
        device.device_id,
        deviceData
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
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Sửa thiết bị
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Cập nhật thông tin thiết bị.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Đóng"
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-6">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* TÊN THIẾT BỊ */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tên thiết bị
              </label>

              <input
                type="text"
                value={deviceName}
                onChange={(event) => {
                  setDeviceName(event.target.value);
                  setError('');
                }}
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                placeholder="Nhập tên thiết bị"
              />
            </div>

            {/* LOẠI THIẾT BỊ */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Loại thiết bị
              </label>

              <input
                type="text"
                value={deviceType}
                onChange={(event) => {
                  setDeviceType(event.target.value);
                  setError('');
                }}
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                placeholder="Nhập loại thiết bị"
              />
            </div>

            {/* SỐ LƯỢNG GỐC */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Số lượng gốc
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
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              />

              <p className="mt-2 text-xs text-gray-500">
                Hiện tại: {device.current_quantity}
                {' / '}
                {device.original_quantity}
              </p>
            </div>

            {/* ẢNH THIẾT BỊ */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Ảnh thiết bị
              </label>

              <div className="rounded-xl border-2 border-dashed border-gray-300 p-4">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Ảnh mới xem trước"
                    className="mx-auto mb-3 h-40 w-full rounded-lg object-contain"
                  />
                ) : currentImageUrl && !removeImage ? (
                  <img
                    src={currentImageUrl}
                    alt={device.device_name}
                    className="mx-auto mb-3 h-40 w-full rounded-lg object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-40 flex-col items-center justify-center text-gray-400">
                    <ImagePlus size={36} className="mb-2" />
                    <span className="text-sm">
                      Chưa có ảnh thiết bị
                    </span>
                  </div>
                )}

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100">
                  <ImagePlus size={17} />
                  {imageFile ? 'Chọn ảnh khác' : 'Chọn ảnh mới'}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    disabled={saving}
                    className="hidden"
                  />
                </label>

                <p className="mt-2 text-center text-xs text-gray-400">
                  JPG, PNG hoặc WebP · Tối đa 5 MB
                </p>
              </div>

              {(imageFile || (device.image_url && !removeImage)) && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={saving}
                  className="mt-2 text-sm font-medium text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Xóa ảnh thiết bị
                </button>
              )}

              {removeImage && (
                <p className="mt-2 text-xs text-amber-600">
                  Ảnh sẽ bị xóa khi bạn lưu thay đổi.
                </p>
              )}
            </div>
          </div>

          {/* FOOTER */}
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