import React, { useEffect, useState, useMemo } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { useCourseContext } from "../../Context/CourseContext";
import { FaSearch, FaShoppingCart } from "react-icons/fa";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useNavigate } from "react-router-dom"; // For navigation
import { getOptimizedCourseImage, handleImageError } from "../../utils/imageUtils";

// CourseCard Component
const CourseCard = ({ course, onExplore, onBuyNow }) => (
  <div className="h-full bg-white border border-gray-300 rounded-lg p-4 flex flex-col justify-between mx-6">
    <div className="relative">
      <img
        src={getOptimizedCourseImage(course)}
        alt={`${course.title} thumbnail`}
        className="w-full h-48 object-cover rounded-t-lg"
        crossOrigin="anonymous"
        onError={(e) => handleImageError(e, course)}
      />
      {course.badge && (
        <span className="absolute top-2 right-2 bg-yellow-300 text-black text-xs font-bold py-1 px-2 rounded">
          {course.badge}
        </span>
      )}
    </div>
    <div className="p-4 flex-1">
      <h3 className="text-lg font-bold mb-2">{course.title}</h3>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-green-600">
          {course.price || "Free"}
        </span>
        {course.discount && (
          <span className="text-sm text-gray-500">{course.discount}</span>
        )}
      </div>
    </div>
    <div className="flex justify-between mt-4">
      <button
        className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
        onClick={() => onExplore(course._id)}
      >
        <FaSearch className="mr-2" />
        Explore
      </button>
      <button
        className="flex items-center bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition duration-300"
        onClick={() => onBuyNow(course._id)}
      >
        <FaShoppingCart className="mr-2" />
        Buy Now
      </button>
    </div>
  </div>
);

// SkeletonLoader Component
const SkeletonLoader = ({ count = 3 }) => (
  <div className="grid grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <Skeleton key={index} height={300} />
    ))}
  </div>
);

// RecentCourses Component
const RecentCourses = () => {
  const { courses, loading, error, fetchCourses } = useCourseContext();
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate(); // For navigation

  useEffect(() => {
    if (!courses || courses.length === 0) {
      fetchCourses();
    }
  }, []); // Remove fetchCourses from dependencies to prevent infinite loop

  const visibleCourses = useMemo(() => {
    const endIndex = Math.min((currentSlide + 1) * 3, courses?.length || 0);
    return courses?.slice(0, endIndex) || [];
  }, [currentSlide, courses]);

  // Handlers for buttons
  const handleExplore = (courseId) => {
    navigate(`/explorecourses/${courseId}`); // Navigate to course details page
  };

  const handleBuyNow = (courseId) => {
    navigate(`/checkout/${courseId}`); // Navigate to checkout page
  };

  if (loading) {
    return (
      <div className="w-full px-4 py-8">
        <h2 className="text-xl font-bold mb-4">Recent Courses</h2>
        <SkeletonLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        An error occurred: {error.message || "Unable to load courses."}
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No courses available at the moment.
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <h2 className="text-xl font-bold mb-4">Recent Courses</h2>
      <Carousel
        showThumbs={false}
        showStatus={false}
        infiniteLoop
        autoPlay
        interval={5000}
        showIndicators={false}
        dynamicHeight={false}
        emulateTouch
        swipeable
        centerMode
        centerSlidePercentage={33.33}
        className="carousel-container"
        onChange={(index) => setCurrentSlide(index)}
      >
        {visibleCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onExplore={handleExplore}
            onBuyNow={handleBuyNow}
          />
        ))}
      </Carousel>
    </div>
  );
};

export default RecentCourses;