import React from 'react';

const FilterCourses = () => {
  const filters = [
    {
      title: 'Live Courses',
      icon: '▶️',
      bgColor: 'bg-red-500',
    },
    {
      title: 'Test Series',
      icon: '✏️',
      bgColor: 'bg-blue-500',
    },
    {
      title: 'Recorded Courses',
      icon: '▶️',
      bgColor: 'bg-green-500',
    },
  ];

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Filter courses</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {filters.map((filter, index) => (
          <div
            key={index}
            className={`relative ${filter.bgColor} text-white rounded-lg p-6 shadow-lg flex flex-col justify-between transition-transform hover:scale-105`}
          >
            {/* Background Texture */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none rounded-lg"></div>

            {/* Content */}
            <div className="z-10">
              <div className="text-3xl mb-4">{filter.icon}</div>
              <div className="text-lg font-semibold">{filter.title}</div>
            </div>

            {/* Arrow */}
            <div className="z-10 mt-4 flex justify-end">
              <span className="text-lg font-bold transition-transform transform group-hover:translate-x-2">→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterCourses;
