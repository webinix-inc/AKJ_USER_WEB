import React from 'react';

const StaticUser = () => {
  const stats = [
    { value: '10000+', label: 'Mock Tests', bgColor: '#FFEFE9' },
    { value: '2000+', label: 'Video Lectures', bgColor: '#E9F8FF' },
    { value: '10+', label: 'Books', bgColor: '#F4EFFF' },
  ];

  return (
    <div className="text-center py-10 px-4">
      <h2 className="text-2xl sm:text-3xl font-semibold">
        A Platform Trusted by Students Worldwide
      </h2>
      <p className="text-gray-600 mt-2 text-sm sm:text-base">
        Don't Just Take Our Word for It. Delve into the Numbers and Witness the Excellence for Yourself!
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="w-full p-10 sm:p-14 rounded-xl text-center"
            style={{ backgroundColor: stat.bgColor }}
          >
            <h3 className="text-xl sm:text-2xl font-bold">{stat.value}</h3>
            <p className="mt-2 text-gray-600 text-sm sm:text-base">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaticUser;
