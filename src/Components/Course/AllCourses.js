import React, { useEffect, useState } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { useCourseContext } from "../../Context/CourseContext.js";
import { useUser } from "../../Context/UserContext.js";
import { FaSearch, FaShoppingCart, FaCheck } from "react-icons/fa"; // Import icons from react-icons
import { getOptimizedCourseImage, handleImageError } from "../../utils/imageUtils";

const AllCourses = () => {
  const { courses, loading, error, fetchCourses } = useCourseContext();
  const { profileData, fetchUserProfile, reloadProfile } = useUser();
  const [purchasedCourseIds, setPurchasedCourseIds] = useState(new Set());

  // Fetch courses on component mount only if not already loaded
  useEffect(() => {
    if (!courses || courses.length === 0) {
      fetchCourses();
    }
    // FIX: Remove fetchUserProfile() - UserContext handles this centrally
    // fetchUserProfile(); // REMOVED - causes excessive API calls
  }, []); // Remove fetchCourses from dependencies to prevent infinite loop

  // Update purchased course IDs when profile data changes
  useEffect(() => {
    if (profileData?.purchasedCourses) {
      const purchasedIds = new Set(
        profileData.purchasedCourses.map(
          (purchasedCourse) => purchasedCourse.course
        )
      );
      setPurchasedCourseIds(purchasedIds);
    }
  }, [profileData]);

  // FIX: Remove excessive event listeners that cause cascading API calls
  // Components should rely on profileData from context, not trigger additional fetches
  // useEffect(() => {
  //   const handleProfileUpdate = (event) => {
  //     console.log('🔄 AllCourses: Received profile update event:', event.detail);
  //     reloadProfile(); // REMOVED - causes cascading API calls
  //   };
  //   window.addEventListener('profileUpdated', handleProfileUpdate);
  //   const handleFocus = () => {
  //     console.log('🔄 AllCourses: Page focused, refreshing profile...');
  //     reloadProfile(); // REMOVED - causes cascading API calls
  //   };
  //   window.addEventListener('focus', handleFocus);
  //   return () => {
  //     window.removeEventListener('profileUpdated', handleProfileUpdate);
  //     window.removeEventListener('focus', handleFocus);
  //   };
  // }, [reloadProfile]);

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
      <h2 className="text-xl font-bold mb-4">All Courses</h2>
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
        {courses.map((course) => {
          const isEnrolled = purchasedCourseIds.has(course._id);
          
          return (
            <div
              key={course._id} // Use _id for consistency
              className="h-full bg-white border border-gray-300 rounded-lg p-4 flex flex-col justify-between mx-6"
            >
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
                {isEnrolled && (
                  <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold py-1 px-2 rounded flex items-center">
                    <FaCheck className="mr-1" />
                    Enrolled
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
                {/* Dynamic button based on enrollment status */}
                {isEnrolled ? (
                  <button className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg cursor-default">
                    <FaCheck className="mr-2" />
                    Enrolled
                  </button>
                ) : (
                  <button className="flex items-center bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition duration-300">
                    <FaShoppingCart className="mr-2" /> {/* Cart icon */}
                    Buy Now
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </Carousel>
    </div>
  );
};

export default AllCourses;