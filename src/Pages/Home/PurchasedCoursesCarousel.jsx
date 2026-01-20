import React, { useEffect, useState, useRef } from "react";
import { AiOutlineBook } from "react-icons/ai";
import { FaExclamationTriangle, FaGraduationCap, FaShoppingCart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "swiper/css";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import api from "../../api/axios";
import apiRequestManager from "../../utils/apiRequestManager";
import { getOptimizedCourseImage, handleImageError } from "../../utils/imageUtils";

// Add custom styles for line-clamp and card heights
const customStyles = `
  .line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
  .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .swiper-slide {
    height: auto !important;
    min-height: 300px !important;
    display: flex !important;
    width: 370px !important;
  }
  .swiper-wrapper {
    align-items: stretch !important;
  }
  .swiper-slide > div {
    height: 100%;
    width: 100%;
  }
  @media (max-width: 1024px) {
    .swiper-slide {
      width: 320px !important;
    }
  }
  @media (max-width: 768px) {
    .swiper-slide {
      width: 280px !important;
    }
  }
  @media (max-width: 640px) {
    .swiper-slide {
      width: 100% !important;
    }
  }
`;

// Inject styles if needed
if (typeof document !== 'undefined' && !document.getElementById('purchased-courses-styles')) {
  const style = document.createElement('style');
  style.id = 'purchased-courses-styles';
  style.textContent = customStyles;
  document.head.appendChild(style);
}

const PurchasedCoursesCarousel = () => {
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Fix #4: Intersection Observer for autoplay optimization
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  // Fetch purchased courses using the dedicated API
  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        // Use apiRequestManager for better caching and deduplication
        const response = await apiRequestManager.executeRequest(
          () => api.get('/user/purchased-courses'),
          'GET',
          '/user/purchased-courses',
          {},
          true
        );
        
        if (response.data && response.data.data) {
          setPurchasedCourses(response.data.data);
        } else {
          setPurchasedCourses([]);
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to load purchased courses');
        setPurchasedCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedCourses();
  }, []);
  
  // Fix #4: Setup Intersection Observer for autoplay optimization
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
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
        courseType: course.courseType // Include courseType for potential future use
      },
    });
  };

  if (loading) {
    return (
      <div className="home4">
        <div className="home5">
          <h6>Purchased Courses</h6>
        </div>
        <div className="home6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading purchased courses...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="home4">
        <div className="home5">
          <h6>Purchased Courses</h6>
        </div>
        <div className="home6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <FaExclamationTriangle className="text-red-500 text-3xl mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Courses</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4" ref={containerRef}>
      <div className="text-center mb-4">
        <h2 className="text-lg md:text-xl font-bold text-brand-primary mb-1">
          My <span className="bg-gradient-to-r from-teal-500 to-teal-600 bg-clip-text text-transparent">Courses</span>
        </h2>
        <p className="text-xs text-gray-600 max-w-lg mx-auto">
          Continue your learning journey with your purchased courses
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-4">
        <Swiper
          spaceBetween={12}
          slidesPerView="auto"
          autoplay={isVisible ? {
            delay: 4000,
            disableOnInteraction: false,
          } : false}
          modules={[Autoplay]}
          breakpoints={{
            1400: {
              slidesPerView: 4,
              spaceBetween: 16,
            },
            1200: {
              slidesPerView: 3,
              spaceBetween: 14,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 12,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 10,
            },
            640: {
              slidesPerView: 1,
              spaceBetween: 8,
            },
          }}
          className="pb-4"
        >
          {purchasedCourses.length > 0 ? (
            purchasedCourses.map((course, index) => (
              <SwiperSlide key={index}>
                <div className="card-apple-interactive flex flex-col h-full">
                  <div className="relative overflow-hidden flex-shrink-0 rounded-t-apple-lg aspect-video w-full">
                    <img
                      src={getOptimizedCourseImage(course)}
                      alt={course.title}
                      width="370"
                      height="208"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-apple"
                      crossOrigin="anonymous"
                      loading="lazy"
                      onError={(e) => handleImageError(e, course)}
                      style={{ 
                        backgroundColor: '#f3f4f6',
                        minHeight: '100%'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* View Icon */}
                    <div className="absolute top-3 right-3">
                      <div className="glass-apple rounded-full p-2 shadow-apple transform group-hover:scale-110 transition-transform duration-300">
                        <FaGraduationCap className="text-apple-blue-600 text-sm" />
                      </div>
                    </div>
                    
                    {/* Enrolled/Batch Badge */}
                    <div className="absolute top-3 left-3">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-white/20 backdrop-blur-sm">
                        {course.courseType === "Batch" ? "BATCH" : "ENROLLED"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex-1 space-apple-sm">
                      <h6 className="text-apple-subtitle text-apple-gray-900 mb-2 truncate-apple-2 group-hover:text-apple-blue-700 transition-colors duration-300 font-apple">
                        {course.title}
                      </h6>
                      
                      
                    </div>
                    
                    {/* CTA Button */}
                    <button
                      onClick={() => handleExploreClick(course)}
                      className="btn-apple-primary w-full py-3 text-base font-semibold hover-lift group relative overflow-hidden"
                    >
                      <span className="relative z-10 font-apple">Continue Learning</span>
                      <div className="absolute inset-0 gradient-apple-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-apple"></div>
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))
          ) : (
            <SwiperSlide>
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border-2 border-dashed border-gray-300 p-2 text-center flex flex-col items-center justify-center" style={{ minHeight: '220px' }}>
                <div className="w-12 h-12 bg-gradient-to-br from-[#023d50] to-[#0086b2] rounded-full flex items-center justify-center mb-3">
                  <FaShoppingCart className="text-lg text-white" />
                </div>
                <h3 className="text-base font-bold text-[#023d50] mb-2">No Courses Yet</h3>
                <p className="text-gray-600 mb-3 max-w-sm text-xs">
                  You haven't purchased any courses yet. Explore our comprehensive course catalog to start your learning journey!
                </p>
                <button 
                  onClick={() => navigate('/explorecourses')}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#023d50] to-[#0086b2] text-white rounded-full font-medium hover:from-[#1D0D76] hover:to-[#023d50] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-xs"
                >
                  <AiOutlineBook className="mr-1 text-xs" />
                  Browse Courses
                </button>
              </div>
            </SwiperSlide>
          )}
        </Swiper>
      </div>
    </div>
  );
};

export default PurchasedCoursesCarousel;
