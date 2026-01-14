import { useLocation, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { useCourseContext } from "../../Context/CourseContext";
import "./Home.css";

import "swiper/css";
import { Autoplay } from "swiper/modules";

import { useEffect, useState, Suspense, lazy } from "react";
import { AiOutlineVideoCamera } from "react-icons/ai";
import { FaEye } from "react-icons/fa";
import HOC from "../../Components/HOC/HOC";
import { useUser } from "../../Context/UserContext";
import {
  getOptimizedCourseImage,
  handleImageError,
} from "../../utils/imageUtils";
import ProfileCompletionModal from "../Profile/ProfileCompletionModal";

// Lazy load below-the-fold components for better initial load performance
const FreeVideoPlayer = lazy(() =>
  import("../../Components/FreeClass/FreeVideoPlayer")
);
const PurchasedCoursesCarousel = lazy(() =>
  import("./PurchasedCoursesCarousel")
);
const Testimonial = lazy(() => import("./Testimonial"));
// Banner imports removed - not needed for dashboard

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
    min-height: 340px !important;
  }
  .swiper-wrapper {
    align-items: stretch !important;
  }
`;

// Inject styles if needed
if (
  typeof document !== "undefined" &&
  !document.getElementById("home-dashboard-styles")
) {
  const style = document.createElement("style");
  style.id = "home-dashboard-styles";
  style.textContent = customStyles;
  document.head.appendChild(style);
}

const batchData = [];

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { courses, fetchPublicCourses } = useCourseContext();
  const { isAuthenticated } = useUser();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userId, setUserId] = useState(null);

  // Authentication state tracking

  // Banner functionality removed - not needed for dashboard

  // Optimized course loading
  useEffect(() => {
    // Only fetch once if no courses are loaded
    if (!courses || courses.length === 0) {
      fetchPublicCourses(false); // Don't force refresh on mount
    }
  }, []); // Remove courses dependency to prevent infinite loop

  // Banner useEffect removed - not needed for dashboard

  const handleExplore = (id) => {
    const course = courses.find((course) => course._id === id);
    navigate(`/explorecourses/${id}`, {
      state: { ...course },
    });
  };

  const isSignup = location.state?.signup || false;
  useEffect(() => {
    if (isSignup) {
      const userIdFromState = location.state?.userId;
      if (userIdFromState) {
        setUserId(userIdFromState);
        setShowProfileModal(true);
      }
    }
  }, [isSignup, location.state]);

  // Component rendering optimization

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Hero Section - Light Theme */}
      <div className="relative overflow-hidden gradient-apple-primary rounded-apple-2xl mb-1 mt-1 shadow-apple-lg border border-apple-gray-200">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23374151' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "60px 60px",
            }}
          ></div>
        </div>
        <div className="relative px-6 py-4 sm:px-8 lg:px-12">
          <div className="text-center animate-apple-slide-up">
            <h1 className="app-title text-apple-gray-800 mb-4 font-apple">
              Welcome to{" "}
              <span className="text-apple-blue-600">AKJ Classes</span>
            </h1>
            <p className="app-body text-apple-gray-600 max-w-2xl mx-auto mb-6 font-apple">
              Unlock your potential with our comprehensive courses and expert
              guidance designed for student success
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/allFreeCourses")}
                className="btn-apple-accent px-6 py-3 text-base font-semibold hover-lift"
              >
                Explore Free Classes
              </button>
              <button
                onClick={() => navigate("/mycourses")}
                className="glass-apple-dark px-6 py-3 text-base font-semibold text-white rounded-apple hover:bg-brand-primary transition-all duration-300 ease-apple hover-lift"
              >
                My Courses
              </button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-apple-gray-50 to-transparent rounded-b-apple-2xl"></div>
      </div>

      {/* Main Content Container - Full Width with Consistent Spacing */}
      <div className="w-full space-apple-md">
        <PurchasedCoursesCarousel />

        {/* Free Classes Section */}
        <div className="w-full">
          <div className="text-center compact-container animate-apple-slide-up">
            <h2 className="app-subtitle text-brand-primary mb-2 font-apple">
              Watch <span className="text-brand-accent">Free</span> Classes
            </h2>
            <p className="app-body text-apple-gray-600 max-w-2xl mx-auto font-apple">
              Get started with our free video lessons and discover the quality
              of our teaching
            </p>
          </div>
          <div className="card-apple p-4 hover-glow animate-apple-fade-in w-full">
            <FreeVideoPlayer />
          </div>
        </div>

        {/* Popular Courses Section */}
        <div className="w-full">
          <div className="text-center mb-6 animate-apple-slide-up">
            <h2 className="text-apple-title text-apple-gray-900 mb-2 font-apple">
              Popular{" "}
              <span className="gradient-apple-accent bg-clip-text text-transparent">
                Courses
              </span>
            </h2>
            <p className="text-apple-body text-apple-gray-600 max-w-2xl mx-auto font-apple">
              Join thousands of students in our most loved courses designed for
              academic excellence
            </p>
          </div>
          <div className="card-apple p-6 hover-glow animate-apple-fade-in w-full">
            <Swiper
              spaceBetween={24}
              slidesPerView={1}
              breakpoints={{
                640: { slidesPerView: 2, spaceBetween: 20 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 24 },
                1280: { slidesPerView: 5, spaceBetween: 24 },
              }}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              modules={[Autoplay]}
              className="pb-4"
              style={{ minHeight: "340px" }}
            >
              {courses?.length > 0 ? (
                courses.map((course, index) => (
                  <SwiperSlide key={course?._id || index}>
                    <div className="card-apple-interactive flex flex-col h-full">
                      <div className="relative overflow-hidden flex-shrink-0 rounded-t-apple-lg">
                        <img
                          src={getOptimizedCourseImage(course)}
                          alt={course.title}
                          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500 ease-apple"
                          crossOrigin="anonymous"
                          loading="lazy"
                          onError={(e) => handleImageError(e, course)}
                          style={{
                            backgroundColor: "#f3f4f6",
                            minHeight: "200px",
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* View Icon */}
                        <div className="absolute top-3 right-3">
                          <div className="glass-apple rounded-full p-2 shadow-apple transform group-hover:scale-110 transition-transform duration-300">
                            <FaEye className="text-apple-blue-600 text-sm" />
                          </div>
                        </div>

                        {/* Popular Badge */}
                        <div className="absolute top-3 left-3">
                          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-white/20 backdrop-blur-sm">
                            POPULAR
                          </div>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex-1 space-apple-sm">
                          <h6 className="text-apple-subtitle text-apple-gray-900 mb-2 truncate-apple-2 group-hover:text-apple-blue-700 transition-colors duration-300 font-apple">
                            {course.title}
                          </h6>

                          <p className="text-apple-body text-apple-gray-600 mb-3 line-clamp-2">
                            {course.shortDescription ||
                              "Elevate your preparation with curated lessons, live sessions, and structured study paths."}
                          </p>

                          {/* Pricing */}
                          {course.price && (
                            <div className="flex items-center gap-3 mb-4">
                              <span className="text-2xl font-bold text-apple-blue-600 font-apple">
                                ₹{course.price}
                              </span>
                              {course.oldPrice && (
                                <>
                                  <span className="text-apple-caption text-apple-gray-500 line-through font-apple">
                                    ₹{course.oldPrice}
                                  </span>
                                  <div className="bg-apple-red/10 text-apple-red px-2 py-1 rounded-full text-xs font-semibold border border-apple-red/20">
                                    {Math.round(
                                      ((course.oldPrice - course.price) /
                                        course.oldPrice) *
                                        100
                                    )}
                                    % OFF
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* CTA Button */}
                        <button
                          onClick={() => handleExplore(course?._id)}
                          className="btn-apple-primary w-full py-3 text-base font-semibold hover-lift group relative overflow-hidden"
                        >
                          <span className="relative z-10 font-apple">
                            Explore Course
                          </span>
                          <div className="absolute inset-0 gradient-apple-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-apple"></div>
                        </button>
                      </div>
                    </div>
                  </SwiperSlide>
                ))
              ) : (
                <SwiperSlide>
                  <div
                    className="card-apple border-2 border-dashed border-apple-gray-300 p-8 text-center flex flex-col items-center justify-center"
                    style={{ minHeight: "380px" }}
                  >
                    <div className="w-16 h-16 gradient-apple-primary rounded-full flex items-center justify-center mb-4 shadow-apple border border-apple-gray-200">
                      <AiOutlineVideoCamera className="text-2xl text-apple-gray-600" />
                    </div>
                    <h3 className="text-apple-subtitle text-apple-gray-800 mb-2 font-apple">
                      No courses available
                    </h3>
                    <p className="text-apple-body text-apple-gray-600 font-apple">
                      Popular courses will appear here when available
                    </p>
                  </div>
                </SwiperSlide>
              )}
            </Swiper>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="py-6">
              <div className="text-center mb-6">
                <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"></div>
              </div>
              <div className="max-w-2xl mx-auto">
                <div className="card-apple p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <Testimonial />
        </Suspense>

        {/* Call to Action Section */}
        <div className="w-full">
          <div className="gradient-apple-primary rounded-apple-2xl p-8 text-center relative overflow-hidden shadow-apple-lg animate-apple-slide-up border border-apple-gray-200">
            <div className="absolute inset-0 opacity-5">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23374151' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: "60px 60px",
                }}
              ></div>
            </div>
            <div className="relative z-10">
              <h2 className="text-apple-title text-apple-gray-800 mb-4 font-apple">
                Ready to Start Your{" "}
                <span className="text-apple-blue-600">Learning Journey</span>?
              </h2>
              <p className="text-apple-body text-apple-gray-600 max-w-2xl mx-auto mb-6 font-apple">
                Join thousands of students who have transformed their careers
                with our expert-led courses and personalized guidance
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/allFreeCourses")}
                  className="btn-apple-accent px-6 py-3 text-base font-semibold hover-lift"
                >
                  Start Learning Today
                </button>
                <button
                  onClick={() => navigate("/studystore")}
                  className="glass-apple-dark px-6 py-3 text-base font-semibold text-white rounded-apple hover:bg-white/20 transition-all duration-300 ease-apple hover-lift"
                >
                  Browse Study Store
                </button>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-brand-accent/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-brand-accent-light/20 rounded-full blur-xl"></div>
            <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-apple-pulse"></div>
            <div className="absolute top-1/4 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-apple-ping"></div>
          </div>
        </div>
      </div>

      {/* Profile Completion Modal */}
      {showProfileModal && userId && (
        <ProfileCompletionModal
          userId={userId}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
};

export default HOC(Home);
