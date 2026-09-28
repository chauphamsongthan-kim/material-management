import { useMemo, useState } from 'react';
import {
  CalendarDays,
  History,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

function DeviceHistoryTable({ history, loading }) {
  const [sortAscending, setSortAscending] = useState(true);

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const dateA = new Date(a.borrow_date);
      const dateB = new Date(b.borrow_date);

      const timeA = dateA.getTime();
      const timeB = dateB.getTime();

      if (sortAscending) {
        return timeA - timeB;
      }

      return timeB - timeA;
    });
  }, [history, sortAscending]);

  function handleSortByBorrowDate() {
    setSortAscending((current) => !current);
  }

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
      {/* TITLE */}
      <div className="border-b border-gray-200 px-6 py-5">
        <div className="flex items-center gap-2">
          <History
            size={20}
            className="text-blue-600"
          />

          <h2 className="text-lg font-bold text-gray-800">
            Lịch sử mượn/trả
          </h2>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">

          {/* HEADER */}
          <thead className="bg-white">
            <tr className="h-16 border-b-2 border-gray-300">

              <th className="px-6 py-5 text-left text-lg font-bold text-gray-800">
                Người mượn
              </th>

              <th className="px-6 py-5 text-left text-lg font-bold text-gray-800">
                Người trả
              </th>

              <th className="px-6 py-5 text-center text-lg font-bold text-gray-800">
                SL mượn
              </th>

              <th className="px-6 py-5 text-center text-lg font-bold text-gray-800">
                SL trả
              </th>

              {/* NGÀY MƯỢN + SORT */}
              <th className="px-6 py-5 text-center text-lg font-bold text-gray-800">
                <button
                  type="button"
                  onClick={handleSortByBorrowDate}
                  className="mx-auto flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 transition hover:bg-gray-100"
                  title={
                    sortAscending
                      ? 'Đang sắp xếp từ cũ đến mới. Nhấn để đảo ngược.'
                      : 'Đang sắp xếp từ mới đến cũ. Nhấn để đảo ngược.'
                  }
                >
                  <span>Ngày mượn</span>

                  {sortAscending ? (
                    <ArrowUp
                      size={20}
                      strokeWidth={2.5}
                      className="text-blue-600"
                    />
                  ) : (
                    <ArrowDown
                      size={20}
                      strokeWidth={2.5}
                      className="text-blue-600"
                    />
                  )}
                </button>
              </th>

              <th className="px-6 py-5 text-center text-lg font-bold text-gray-800">
                Ngày trả
              </th>

            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {sortedHistory.map((item) => (
              <tr
                key={item.history_id}
                className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
              >
                {/* NGƯỜI MƯỢN */}
                <td className="px-5 py-4 font-medium text-gray-800">
                  {item.borrower_name}
                </td>

                {/* NGƯỜI TRẢ */}
                <td className="px-5 py-4 text-gray-600">
                  {item.returner_name || ''}
                </td>

                {/* SL MƯỢN */}
                <td className="px-5 py-4 text-center text-gray-700">
                  {item.borrowed_quantity}
                </td>

                {/* SL TRẢ */}
                <td className="px-5 py-4 text-center text-gray-700">
                  {item.returned_quantity ?? 0}
                </td>

                {/* NGÀY MƯỢN */}
                <td className="px-5 py-4 text-center text-gray-600">
                  <div className="flex items-center justify-center gap-1.5">
                    <CalendarDays size={15} />
                    {item.borrow_date}
                  </div>
                </td>

                {/* NGÀY TRẢ */}
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