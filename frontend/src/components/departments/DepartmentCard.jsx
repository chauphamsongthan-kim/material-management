import { ArrowRight } from 'lucide-react';

function DepartmentCard({ department, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-xl font-bold text-blue-600">
          {department.department_name.charAt(0)}
        </div>

        <ArrowRight
          size={22}
          className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
        />
      </div>

      <h3 className="text-lg font-semibold text-gray-800">
        {department.department_name}
      </h3>

      <p className="mt-2 text-sm text-gray-500">
        Quản lý thiết bị của {department.department_name}
      </p>
    </button>
  );
}

export default DepartmentCard;