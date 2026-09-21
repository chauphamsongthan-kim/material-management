import { PackageOpen } from 'lucide-react';

function DeviceTable({ devices, onDeviceClick }) {
  if (devices.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <PackageOpen
          size={40}
          className="mx-auto mb-3 text-gray-400"
        />

        <p className="font-medium text-gray-700">
          Ban này chưa có thiết bị
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Thiết bị sẽ xuất hiện tại đây sau khi được thêm vào hệ thống.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Tên thiết bị
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Loại thiết bị
              </th>

              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                SL gốc
              </th>

              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                SL hiện tại
              </th>
            </tr>
          </thead>

          <tbody>
            {devices.map((device) => (
              <tr
                key={device.device_id}
                onClick={() => onDeviceClick(device.device_id)}
                className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50"
              >
                <td className="px-6 py-4 font-medium text-gray-800">
                  {device.device_name}
                </td>

                <td className="px-6 py-4 text-gray-600">
                  {device.device_type}
                </td>

                <td className="px-6 py-4 text-center text-gray-700">
                  {device.original_quantity}
                </td>

                <td className="px-6 py-4 text-center font-medium text-gray-700">
                  {device.current_quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DeviceTable;