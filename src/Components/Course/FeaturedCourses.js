import React, { useEffect } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { useCourseContext } from "../../Context/CourseContext.js";
import { FaSearch, FaShoppingCart } from "react-icons/fa"; // Import icons from react-icons
import { getOptimizedCourseImage, handleImageError } from "../../utils/imageUtils";

const FeaturedCourses = () => {
  const { courses, loading, error, fetchCourses } = useCourseContext();

  // Fetch courses on component mount only if not already loaded
  useEffect(() => {
    if (!courses || courses.length === 0) {
      fetchCourses();
    }
  }, []); // Remove fetchCourses from dependencies to prevent infinite loop

  console.log("Course Details", courses);

  // Handle loading and error states
  if (loading) {
    return <div className="text-center py-8">Loading courses...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        An error occurred: {error.message || "Unable to load courses."}
      </div>
    );
  }

  // Handle empty courses gracefully
  if (!courses || courses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No courses available at the moment.
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <h2 className="text-xl font-bold mb-4">Featured Courses</h2>
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
      >
        {courses.map((course) => (
          <div
            key={course.id}
            className="h-full bg-white border border-gray-300 rounded-lg p-4 flex flex-col justify-between mx-6"
          >
            <div className="relative">
              <img
                src={getOptimizedCourseImage(course)}
                alt={`${course.title} thumbnail`}
                className="w-full h-48 object-cover rounded-t-lg"
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
                  <span className="text-sm text-gray-500">
                    {course.discount}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between mt-4">
              {/* Explore button with icon */}
              <button className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300">
                <FaSearch className="mr-2" /> {/* Search icon */}
                Explore
              </button>
              {/* Buy Now button with icon */}
              <button className="flex items-center bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition duration-300">
                <FaShoppingCart className="mr-2" /> {/* Cart icon */}
                Buy Now
              </button>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default FeaturedCourses;