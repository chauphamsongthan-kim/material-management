import { CalendarDays, History } from 'lucide-react';

function DeviceHistoryTable({ history, loading }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">
          Đang tải lịch sử mượn/trả...
        </p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <History
          size={40}
          className="mx-auto mb-3 text-gray-400"
        />

        <p className="font-medium text-gray-700">
          Chưa có lịch sử mượn/trả
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Lịch sử sẽ xuất hiện sau khi thiết bị được mượn hoặc trả.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-5">
        <div className="flex items-center gap-2">
          <History size={20} className="text-blue-600" />

          <h2 className="text-lg font-bold text-gray-800">
            Lịch sử mượn/trả
          </h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                Người mượn
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                Người trả
              </th>

              <th className="px-5 py-4 text-center text-sm font-semibold text-gray-700">
                SL mượn
              </th>

              <th className="px-5 py-4 text-center text-sm font-semibold text-gray-700">
                SL trả
              </th>

              <th className="px-5 py-4 text-center text-sm font-semibold text-gray-700">
                Ngày mượn
              </th>

              <th className="px-5 py-4 text-center text-sm font-semibold text-gray-700">
                Ngày trả
              </th>
            </tr>
          </thead>

          <tbody>
            {history.map((item) => (
              <tr
                key={item.history_id}
                className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
              >
                <td className="px-5 py-4 font-medium text-gray-800">
                  {item.borrower_name}
                </td>

                <td className="px-5 py-4 text-gray-600">
                  {item.returner_name || ''}
                </td>

                <td className="px-5 py-4 text-center text-gray-700">
                  {item.borrowed_quantity}
                </td>

                <td className="px-5 py-4 text-center text-gray-700">
                  {item.returned_quantity ?? 0}
                </td>

                <td className="px-5 py-4 text-center text-gray-600">
                  <div className="flex items-center justify-center gap-1.5">
                    <CalendarDays size={15} />
                    {item.borrow_date}
                  </div>
                </td>

                <td className="px-5 py-4 text-center text-gray-600">
                    {item.return_date ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <CalendarDays size={15} />
                    {item.return_date}
                  </div>
                ) : (
                  ''
                )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DeviceHistoryTable;