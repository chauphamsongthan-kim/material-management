
import { useMemo, useState } from 'react';
import {
  CalendarDays,
  History,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

function parseDateTime(value) {
  if (!value) return null;

  const match = String(value)
    .trim()
    .match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/
    );

  if (!match) return null;

  const [, year, month, day, hour = '0', minute = '0', second = '0'] =
    match;

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    timestamp: new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    ).getTime(),
  };
}

function formatDate(value) {
  const parsed = parseDateTime(value);
  if (!parsed) return '';

  return `${parsed.year}-${parsed.month}-${parsed.day}`;
}

function formatTime(value) {
  const parsed = parseDateTime(value);
  if (!parsed) return '';

  return `${parsed.hour}:${parsed.minute}:${parsed.second}`;
}

function DeviceHistoryTable({ history, loading }) {
  const [sortAscending, setSortAscending] = useState(true);

  const sortedHistory = useMemo(() => {
  return [...history].sort((a, b) => {
    const timeA = parseDateTime(a.borrow_date)?.timestamp ?? 0;
    const timeB = parseDateTime(b.borrow_date)?.timestamp ?? 0;

    return sortAscending
      ? timeA - timeB
      : timeB - timeA;
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
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* TITLE */}
      <div className="border-b border-gray-200 px-6 py-5">
        <div className="flex items-center gap-2">
          <History
            size={22}
            className="shrink-0 text-blue-600"
          />

          <h2 className="text-xl font-bold text-gray-800">
            Lịch sử mượn/trả
          </h2>
        </div>
      </div>

      {/* TABLE */}
      <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[1100px] table-fixed">
        <colgroup>
          <col className="w-[25%]" />
          <col className="w-[23%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[15%]" />
          <col className="w-[13%]" />
        </colgroup>

          {/* HEADER */}
          <thead className="bg-white">
            <tr className="h-16 border-b-2 border-gray-300">
              <th className="whitespace-nowrap px-3 py-5 text-left text-lg font-bold text-gray-800 sm:px-5">
                Người mượn
              </th>

              <th className="whitespace-nowrap px-3 py-5 text-left text-lg font-bold text-gray-800 sm:px-5">
                Người trả
              </th>

              <th className="whitespace-nowrap px-2 py-5 text-center text-lg font-bold text-gray-800">
                SL mượn
              </th>

              <th className="whitespace-nowrap px-2 py-5 text-center text-lg font-bold text-gray-800">
                SL trả
              </th>

              {/* NGÀY MƯỢN + SORT */}
              <th className="whitespace-nowrap px-2 py-5 text-center text-lg font-bold text-gray-800">
                <button
                  type="button"
                  onClick={handleSortByBorrowDate}
                  className="mx-auto flex items-center justify-center gap-1 rounded-lg px-1 py-1.5 transition hover:bg-gray-100"
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
                      className="shrink-0 text-blue-600"
                    />
                  ) : (
                    <ArrowDown
                      size={20}
                      strokeWidth={2.5}
                      className="shrink-0 text-blue-600"
                    />
                  )}
                </button>
              </th>

              <th className="whitespace-nowrap px-2 py-5 text-center text-lg font-bold text-gray-800">
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
                <td
                  className="truncate px-3 py-4 font-medium text-gray-800 sm:px-5"
                  title={item.borrower_name || ''}
                >
                  {item.borrower_name}
                </td>

                {/* NGƯỜI TRẢ */}
                <td
                  className="truncate px-3 py-4 text-gray-600 sm:px-5"
                  title={item.returner_name || ''}
                >
                  {item.returner_name || ''}
                </td>

                {/* SL MƯỢN */}
                <td className="whitespace-nowrap px-2 py-4 text-center text-gray-700">
                  {item.borrowed_quantity}
                </td>

                {/* SL TRẢ */}
                <td className="whitespace-nowrap px-2 py-4 text-center text-gray-700">
                  {item.returned_quantity ?? 0}
                </td>

                {/* NGÀY MƯỢN */}
                <td className="whitespace-nowrap px-2 py-4 text-center text-gray-600">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center justify-center gap-1.5">
                    {Number(item.borrowed_quantity) > 0 && (
                      <CalendarDays size={15} className="shrink-0" />
                    )}

                    {Number(item.borrowed_quantity) === 0
                      ? '↳'
                      : formatDate(item.borrow_date)}
                  </div>

                    {Number(item.borrowed_quantity) > 0 && (
                      <span className="text-xs text-gray-500">
                        {formatTime(item.borrow_date)}
                      </span>
                    )}
                  </div>
                </td>

                {/* NGÀY TRẢ */}
                <td className="whitespace-nowrap px-2 py-4 text-center text-gray-600">
                  {item.return_date ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center justify-center gap-1.5">
                        <CalendarDays size={15} className="shrink-0" />
                        {formatDate(item.return_date)}
                      </div>

                      <span className="text-xs text-gray-500">
                        {formatTime(item.return_date)}
                      </span>
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