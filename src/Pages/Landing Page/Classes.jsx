import React, { useEffect, useRef, useState } from "react";
import { MdArrowForward } from "react-icons/md";
import { useCourseContext } from "../../Context/CourseContext";
import { FaSpinner, FaTag } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getOptimizedCourseImage, handleImageError } from "../../utils/imageUtils";

const CourseCard = () => {
  const navigate = useNavigate();
  const { courses, loading, error, fetchPublicCourses } = useCourseContext();
  const iframeRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoId = "wLO95MeWVik";

  useEffect(() => {
    // Use public course fetching for landing page
    fetchPublicCourses();
  }, [fetchPublicCourses]);

  const togglePlayPause = () => {
    if (iframeRef.current) {
      const action = isPlaying ? "pauseVideo" : "playVideo";
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: action, args: [] }),
        "*"
      );
      setIsPlaying(!isPlaying);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
          <span className="text-2xl font-semibold text-gray-800">
            Fetching Popular Courses
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 px-4">Error: {error}</div>;
  }

  return (
    <div className="w-full max-w-[1300px] mx-auto px-2 sm:px-4 lg:px-6 py-16">
      {/* Header Section */}
      <div className="text-center mb-16">
        <h2 className="text-4xl lg:text-5xl font-bold text-[#023d50] mb-4">
          Popular <span className="text-[#fc9721]">Courses</span>
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-[#fc9721] to-[#ff953a] rounded-full mx-auto mb-8"></div>
        <button
          onClick={() => navigate("/explorecourses")}
          className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#023d50] to-[#0086b2] text-white text-base font-semibold rounded-full hover:from-[#fc9721] hover:to-[#ff953a] transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          View All Courses
          <MdArrowForward className="ml-3 text-lg" />
        </button>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 mb-20">
        {courses?.slice(0, 3).map((course, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border-2 border-gray-100 hover:border-[#fc9721] transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl"
          >
            {/* Ribbon */}
            <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-gradient-to-r from-[#023d50] to-[#0086b2] text-white text-xs font-bold rounded-full">
              ONLINE
            </div>

            {/* Image */}
            <div className="relative overflow-hidden">
              <img
                src={getOptimizedCourseImage(course)}
                alt={course.title}
                className="w-full h-56 lg:h-64 object-cover transition-transform duration-300 hover:scale-105"
                crossOrigin="anonymous"
                onError={(e) => handleImageError(e, course)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-grow">
              <h3 className="text-xl font-bold text-[#023d50] mb-4 line-clamp-2 leading-tight min-h-[3.5rem]">
                {course.title}
              </h3>

              {/* Pricing */}
              <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-bold text-[#0086b2]">
                        ₹{course.price}
                      </span>
                      <span className="text-base text-gray-500 line-through">
                        ₹{course.oldPrice}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      Full Batch Access
                    </div>
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <FaTag className="text-xs" />
                    {course.discount}% OFF
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-auto">
                <button
                  className="flex-1 bg-white border-2 border-[#023d50] text-[#023d50] py-3 px-4 rounded-xl font-semibold hover:bg-[#023d50] hover:text-white transition-all duration-300"
                  onClick={() =>
                    navigate(`/explorecourses/${course._id}`, {
                      state: course,
                    })
                  }
                >
                  EXPLORE
                </button>
                <button
                  className="flex-1 bg-gradient-to-r from-[#fc9721] to-[#ff953a] text-white py-3 px-4 rounded-xl font-semibold hover:from-[#ff953a] hover:to-[#fc9721] transition-all duration-300 transform hover:scale-105"
                  onClick={() => navigate("/login")}
                >
                  BUY NOW
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* YouTube Section */}
      <div className="w-full">
        <div className="text-center mb-12">
          <h3 className="text-3xl lg:text-4xl font-bold text-[#023d50] mb-4">
            Experience Our <span className="text-[#fc9721]">Teaching</span>
          </h3>
          <div className="w-20 h-1 bg-gradient-to-r from-[#fc9721] to-[#ff953a] rounded-full mx-auto"></div>
        </div>
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl w-full h-[300px] sm:h-[450px] lg:h-[600px] overflow-hidden shadow-2xl">
          <iframe
            ref={iframeRef}
            className="w-full h-full rounded-3xl"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&mute=1&controls=0&enablejsapi=1&modestbranding=1&showinfo=0&rel=0`}
            title="YouTube Video Player"
            frameBorder="0"
            allow="autoplay; picture-in-picture"
            allowFullScreen
          ></iframe>
          <div className="absolute inset-0 border-4 border-[#fc9721]/20 rounded-3xl pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
