import { ArrowRight } from 'lucide-react';

function DepartmentCard({ department, onClick }) {
  const departmentColors = {
    1: {
      card: 'bg-blue-500 hover:bg-blue-600',
      icon: 'bg-blue-500 text-white',
      arrow: 'text-white group-hover:text-white',
    },
    2: {
      card: 'bg-green-500 hover:bg-green-600',
      icon: 'bg-green-500 text-white',
      arrow: 'text-white group-hover:text-white',
    },
    3: {
      card: 'bg-purple-500 hover:bg-purple-600',
      icon: 'bg-purple-500 text-white',
      arrow: 'text-white group-hover:text-white',
    },
    4: {
      card: 'bg-indigo-500 hover:bg-indigo-600',
      icon: 'bg-indigo-500 text-white',
      arrow: 'text-white group-hover:text-white',
    },
    5: {
      card: 'bg-pink-500 hover:bg-pink-600',
      icon: 'bg-pink-500 text-white',
      arrow: 'text-white group-hover:text-white',
    },
    6: {
      card: 'bg-red-500 hover:bg-red-600',
      icon: 'bg-red-500 text-white',
      arrow: 'text-white group-hover:text-white',
    },
  };

  const colors = departmentColors[department.department_id] || {
    card: 'bg-blue-500 hover:bg-blue-600',
    icon: 'bg-blue-500 text-white',
    arrow: 'text-white group-hover:text-white',
  };

  return (
    <button
      onClick={onClick}
      className={`group rounded-xl border border-transparent p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${colors.card}`}
    >
      <div className="mb-4 flex items-center justify-between">
 <div
  className={`flex h-12 w-12 items-center justify-center rounded-lg ${colors.icon}`}
>
  <img
    src="/chutieu.jpg"
    alt="Chủ Tiểu"
    className="h-10 w-10 object-contain"
  />
</div>

        <ArrowRight
          size={22}
          className={`${colors.arrow} transition group-hover:translate-x-1`}
        />
      </div>

      <h3 className="text-lg font-semibold text-white">
        {department.department_name}
      </h3>

      <p className="mt-2 text-sm text-white/90">
        Quản lý thiết bị của {department.department_name}
      </p>
    </button>
  );
}

export default DepartmentCard;