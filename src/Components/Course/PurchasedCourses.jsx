import React, { useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { useNavigate } from "react-router-dom";
import { notification } from "antd";
import HOC from "../../Components/HOC/HOC";
import api from "../../api/axios";
import { getOptimizedCourseImage, handleImageError } from "../../utils/imageUtils";

const PurchasedCoursesCarousel = () => {
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const enrollmentNotifications = useRef({}); // Track notifications for each course

  // Listen for enrollment status updates and show notifications for any course being enrolled
  useEffect(() => {
    const checkAllEnrollmentStatus = () => {
      // Check all localStorage keys for enrollment status
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('enrollment-checking-')) {
          const courseId = key.replace('enrollment-checking-', '');
          const enrollmentDataStr = localStorage.getItem(key);
          if (enrollmentDataStr) {
            try {
              const enrollmentData = JSON.parse(enrollmentDataStr);
              if (enrollmentData.isChecking) {
                showEnrollmentNotification(courseId, enrollmentData);
              }
            } catch (error) {
              console.error('Error parsing enrollment data:', error);
            }
          }
        }
      }
    };
    
    const showEnrollmentNotification = (courseId, enrollmentData) => {
      // Don't show duplicate notifications
      if (enrollmentNotifications.current[courseId]) {
        return;
      }
      
      const progressPercent = Math.round((enrollmentData.attempts / enrollmentData.maxAttempts) * 100);
      const notificationKey = `enrollment-${courseId}`;
      enrollmentNotifications.current[courseId] = notificationKey;
      
      // Find course title from purchasedCourses if available
      const course = purchasedCourses.find(c => c._id === courseId);
      const courseTitle = course?.title || 'Course';
      
      notification.info({
        key: notificationKey,
        message: "Granting Course Access",
        description: (
          <div>
            <div className="mb-1 text-sm font-medium">{courseTitle}</div>
            <div className="mb-1 text-xs text-gray-600">{enrollmentData.lastMessage}</div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            {enrollmentData.attempts > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Checking access... ({enrollmentData.attempts}/{enrollmentData.maxAttempts})
              </div>
            )}
          </div>
        ),
        placement: "topRight",
        duration: 0, // Don't auto-close
        icon: <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>,
      });
    };
    
    const handleEnrollmentStart = (event) => {
      showEnrollmentNotification(event.detail.courseId, event.detail.enrollmentData);
    };
    
    const handleEnrollmentUpdate = (event) => {
      const { courseId, enrollmentData } = event.detail;
      if (enrollmentNotifications.current[courseId]) {
        const progressPercent = Math.round((enrollmentData.attempts / enrollmentData.maxAttempts) * 100);
        const course = purchasedCourses.find(c => c._id === courseId);
        const courseTitle = course?.title || 'Course';
        
        notification.info({
          key: enrollmentNotifications.current[courseId],
          message: "Granting Course Access",
          description: (
            <div>
              <div className="mb-1 text-sm font-medium">{courseTitle}</div>
              <div className="mb-1 text-xs text-gray-600">{enrollmentData.lastMessage}</div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              {enrollmentData.attempts > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Checking access... ({enrollmentData.attempts}/{enrollmentData.maxAttempts})
                </div>
              )}
            </div>
          ),
          placement: "topRight",
          duration: 0,
          icon: <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>,
        });
      } else {
        showEnrollmentNotification(courseId, enrollmentData);
      }
    };
    
    const handleEnrollmentComplete = (event) => {
      const { courseId } = event.detail;
      if (enrollmentNotifications.current[courseId]) {
        notification.close(enrollmentNotifications.current[courseId]);
        delete enrollmentNotifications.current[courseId];
      }
    };
    
    // Check on mount and when purchasedCourses changes
    checkAllEnrollmentStatus();
    
    // Listen for events
    window.addEventListener('enrollmentStarted', handleEnrollmentStart);
    window.addEventListener('enrollmentUpdate', handleEnrollmentUpdate);
    window.addEventListener('enrollmentCompleted', handleEnrollmentComplete);
    
    // Also check localStorage periodically (in case events are missed)
    const interval = setInterval(() => {
      checkAllEnrollmentStatus();
    }, 2000);
    
    return () => {
      window.removeEventListener('enrollmentStarted', handleEnrollmentStart);
      window.removeEventListener('enrollmentUpdate', handleEnrollmentUpdate);
      window.removeEventListener('enrollmentCompleted', handleEnrollmentComplete);
      clearInterval(interval);
      // Close all notifications on unmount
      Object.values(enrollmentNotifications.current).forEach(key => {
        notification.close(key);
      });
      enrollmentNotifications.current = {};
    };
  }, [purchasedCourses]);

  // 🔧 FIX: Use the same API as dashboard for consistency
  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🛒 [My Courses] Fetching purchased courses...');
        
        const response = await api.get('/user/purchased-courses');
        console.log('✅ [My Courses] Purchased courses response:', response.data);
        
        if (response.data && response.data.data) {
          setPurchasedCourses(response.data.data);
          console.log(`📚 [My Courses] Found ${response.data.data.length} purchased courses`);
          console.log('🔍 [My Courses] Course types:', response.data.data.map(c => ({ title: c.title, type: c.courseType })));
        } else {
          setPurchasedCourses([]);
        }
      } catch (error) {
        console.error('❌ [My Courses] Error fetching purchased courses:', error);
        setError(error.response?.data?.message || 'Failed to load purchased courses');
        setPurchasedCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedCourses();
  }, []);

  const handleExploreClick = (course) => {
    // Both batch and regular courses use the same route - CourseDetails can handle both
    navigate(`/explorecourses/${course._id}`, {
      state: {
        _id: course._id,
        title: course.title,
        description: course.description,
        endDate: course.endDate,
        price: course.price,
        oldPrice: course.oldPrice,
        discount: course.discount,
        courseImage: course.courseImage,
        courseVideo: course.courseVideo,
        rootFolder: course.rootFolder,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#0086b2] mx-auto mb-4"></div>
          <p className="text-xl text-[#023d50] font-semibold">Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h3 className="text-xl font-bold text-red-600 mb-2">Error Loading Courses</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-apple-fade-in">
      {/* Hero Section - Light Theme */}
      <div className="relative overflow-hidden gradient-apple-primary compact-hero rounded-apple-xl mb-4 shadow-apple mx-4 mt-4 border border-apple-gray-200">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23374151' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        <div className="relative compact-container text-center animate-apple-slide-up">
          <h1 className="app-subtitle text-apple-gray-800 mb-2 font-apple">
            My <span className="text-apple-blue-600">Courses</span>
          </h1>
          <p className="app-body text-apple-gray-600 max-w-2xl mx-auto">
            Continue your learning journey with your enrolled courses
          </p>
        </div>
      </div>

      <div className="w-full px-6">
        {purchasedCourses.length === 0 ? (
          <div className="card-apple p-8 text-center shadow-apple">
            <div className="w-16 h-16 gradient-apple-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-apple">
              <span className="text-2xl text-white">🎓</span>
            </div>
            <h3 className="app-body font-bold text-brand-primary mb-3 font-apple">No Courses Yet</h3>
            <p className="app-caption text-apple-gray-600 max-w-sm mx-auto mb-6">
              You haven't enrolled in any courses yet. Start your learning journey today and unlock your potential!
            </p>
            <button
              onClick={() => navigate('/explorecourses')}
              className="btn-apple-primary px-6 py-3 font-medium hover-lift shadow-apple"
            >
              🚀 Explore Courses
            </button>
          </div>
        ) : (
          <div className="card-apple p-6 shadow-apple">
            <div className="mb-6">
              <h2 className="app-body font-bold text-brand-primary mb-2 font-apple">Your Learning Dashboard</h2>
              <p className="app-caption text-apple-gray-600">Continue where you left off</p>
            </div>
            
            <Swiper
              spaceBetween={12}
              slidesPerView={1}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
              }}
              modules={[Autoplay]}
              breakpoints={{
                1280: {
                  slidesPerView: 4,
                  spaceBetween: 16,
                },
                1024: {
                  slidesPerView: 4,
                  spaceBetween: 12,
                },
                768: {
                  slidesPerView: 3,
                  spaceBetween: 10,
                },
                640: {
                  slidesPerView: 2,
                  spaceBetween: 8,
                },
              }}
              className="pb-3"
            >
              {purchasedCourses.map((course, index) => (
                <SwiperSlide key={index}>
                  <div
                    className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out overflow-hidden cursor-pointer transform hover:scale-[1.02] border border-gray-100 hover:border-teal-200"
                    onClick={() => handleExploreClick(course)}
                  >
                    <div className="relative h-48 overflow-hidden rounded-t-xl">
                      <img
                        src={getOptimizedCourseImage(course)}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        crossOrigin="anonymous"
                        onError={(e) => handleImageError(e, course)}
                        loading="lazy"
                        style={{
                          backgroundColor: '#f8fafc',
                          opacity: '0',
                          transition: 'opacity 0.4s ease-in-out'
                        }}
                        onLoad={(e) => { e.target.style.opacity = '1'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="absolute top-3 left-3 space-y-1.5">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-white/20 backdrop-blur-sm">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            ENROLLED
                          </span>
                        </div>
                        {!course.isPublished && (
                          <div className="bg-yellow-500/90 text-white px-2.5 py-1 rounded-full text-[0.65rem] font-semibold shadow-lg border border-white/20 backdrop-blur-sm">
                            Admin Unpublished
                          </div>
                        )}
                      </div>
                      
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg border border-white/20">
                          <span className="text-teal-600 text-lg">🎓</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h6 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-teal-600 transition-colors duration-300 leading-tight">
                          {course.title}
                        </h6>
                        {!course.isPublished && (
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                            Visible to enrolled only
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                          <span className="font-medium">Continue Learning</span>
                        </div>
                        
                        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 shadow-lg">
                          Open →
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 gradient-apple-accent opacity-0 group-hover:opacity-5 transition-opacity duration-300 ease-apple rounded-apple-lg" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>
    </div>
  );
};

export default HOC(PurchasedCoursesCarousel);
