import DOMPurify from "dompurify";
import htmlTruncate from "html-truncate";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../../api/axios";
import { useCourseContext } from "../../../Context/CourseContext";
import { useUser } from "../../../Context/UserContext";
import { getOptimizedBookImage, getOptimizedCourseImage, handleImageError } from "../../../utils/imageUtils";
import InstallmentPaymentModal from "../../Course/InstallmentPaymentModal";

const Description = ({ description }) => {
  const demoVideosRef = useRef(null);
  const teachersRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [faqLoading, setFaqLoading] = useState(true);
  const [faqError, setFaqError] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [openFAQ, setOpenFAQ] = useState(null);
  const location = useLocation();
  const batch = location.state;

  const navigate = useNavigate();
  const { profileData, fetchUserProfile } = useUser();
  const [purchasedCourseIds, setPurchasedCourseIds] = useState(new Set());

  useEffect(() => {
    // FIX: Remove fetchUserProfile() - UserContext handles this centrally
    // fetchUserProfile(); // REMOVED - causes excessive API calls for unauthenticated users
  }, []);

  useEffect(() => {
    if (profileData?.purchasedCourses) {
      const purchasedIds = new Set(
        profileData.purchasedCourses.map((course) => course.course)
      );
      setPurchasedCourseIds(purchasedIds);
    }
  }, [profileData]);

  const toggleReadMore = () => {
    setIsExpanded((prev) => !prev);
  };

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const response = await api.get("/admin/books");
        const normalizedBatchTitle = batch.title?.trim().toLowerCase();
        const filteredBooks = response.data.filter((book) => {
          const normalizedCourseName = book.courseName?.trim().toLowerCase();
          const normalizedCourseNamesArray = Array.isArray(book.courseNames)
            ? book.courseNames.map((name) => name.trim().toLowerCase())
            : [];
          return (
            normalizedCourseName === normalizedBatchTitle ||
            normalizedCourseNamesArray.includes(normalizedBatchTitle)
          );
        });
        setBooks(filteredBooks);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchFAQs = async () => {
      setFaqLoading(true);
      setFaqError(null);
      try {
        console.log('🔄 Fetching FAQs for course:', batch._id);
        
        // Fix: Use the correct API endpoint path (baseURL already includes /api/v1)
        const response = await api.get(`/admin/faqs/${batch._id}`);
        console.log('✅ FAQs response:', response.data);
        
        // Handle different response structures
        const faqData = response.data?.data || response.data || [];
        setFaqs(Array.isArray(faqData) ? faqData : []);
        
        if (faqData.length === 0) {
          console.log('📝 No FAQs found for this course');
        }
      } catch (error) {
        console.error("❌ Error fetching FAQs:", error);
        console.error("Error details:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          courseId: batch._id
        });
        
        // Provide more specific error messages
        let errorMessage = "Failed to fetch FAQs. Please try again later.";
        
        if (error.response?.status === 404) {
          errorMessage = "No FAQs available for this course yet.";
        } else if (error.response?.status === 401 || error.response?.status === 403) {
          errorMessage = "Authentication required to view FAQs.";
        } else if (error.response?.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (error.code === 'NETWORK_ERROR') {
          errorMessage = "Network connection issue. Please check your internet.";
        }
        
        setFaqError(errorMessage);
        setFaqs([]); // Set empty array on error
      } finally {
        setFaqLoading(false);
      }
    };

    if (batch?.title) {
      fetchBooks();
    } else {
      setBooks([]);
    }

    if (batch?._id) {
      console.log('📋 Batch data for FAQ fetch:', { id: batch._id, title: batch.title });
      fetchFAQs();
    } else {
      console.log('⚠️ No batch ID available for FAQ fetch');
      setFaqs([]);
      setFaqLoading(false);
    }
  }, [batch?.title, batch?._id]);

  const limit = 300;
  const sanitizedDescription = DOMPurify.sanitize(description || '');
  const truncatedDescription = htmlTruncate(sanitizedDescription, limit);
  const displayText = isExpanded ? sanitizedDescription : truncatedDescription;

  const scroll = (ref, direction) => {
    ref.current.scrollBy({ left: direction * 300, behavior: "smooth" });
  };

  const toggleFAQ = (index) => {
    setOpenFAQ((prev) => (prev === index ? null : index));
  };

  const freeVideos =
    batch?.courseVideo?.filter((video) => video.type === "Free") || [];

  const isEnrolled = purchasedCourseIds.has(batch?._id);

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
      <div className="flex-1 lg:w-[65%]">
        {/* Course Description - Apple-inspired */}
        <div className="card-apple p-6 mb-6 shadow-apple animate-apple-fade-in">
          <h2 className="app-subtitle text-brand-primary mb-4 flex items-center font-apple">
            📖 <span className="ml-3">Course Description</span>
          </h2>
          <div
            className="text-apple-gray-700 leading-relaxed prose prose-lg max-w-none font-apple"
            dangerouslySetInnerHTML={{ __html: displayText }}
          />
          {description && sanitizedDescription && sanitizedDescription.length > limit && (
            <button 
              className="mt-4 btn-apple-primary hover-lift shadow-apple font-apple" 
              onClick={toggleReadMore}
            >
              {isExpanded ? "📖 Read Less" : "📚 Read More"}
            </button>
          )}
        </div>

        {freeVideos.length > 0 && (
          <SectionWithScroll
            title="Free Videos"
            scrollLeft={() => scroll(demoVideosRef, -1)}
            scrollRight={() => scroll(demoVideosRef, 1)}
            ref={demoVideosRef}
          >
            {freeVideos.map((video, index) => (
              <video
                key={index}
                src={video.url}
                controls
                className="w-1/2 h-auto object-cover rounded"
              />
            ))}
          </SectionWithScroll>
        )}
        {teachersData.length > 0 && (
          <SectionWithScroll
            title="Know Your Teachers"
            scrollLeft={() => scroll(teachersRef, -1)}
            scrollRight={() => scroll(teachersRef, 1)}
            ref={teachersRef}
          >
            {teachersData.map((teacher, index) => (
              <TeacherCard key={index} teacher={teacher} />
            ))}
          </SectionWithScroll>
        )}
        {/* 
        <div className="mt-6">
          <h2 className="text-lg font-bold">
            Recommended Study Material to Follow
          </h2>
          <div className="flex gap-4 p-4 w-[100%]">
            {loading ? (
              <p>Loading materials...</p>
            ) : books.length > 0 ? (
              books.map((material, index) => (
                <div
                  className="bg-white rounded-lg shadow-md transition-shadow duration-300 h-[469px] w-60 flex flex-col"
                  key={index}
                >
                  <div className="relative flex-1 flex justify-center items-center">
                    <img
                      src={material.imageUrl || "https://placehold.co/200x300"}
                      alt={material.name || "No Title"}
                      className="h-[250px] w-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-grow">
                    <div>
                      <h6 className="text-base font-medium">{material.name}</h6>
                      <p className="text-sm text-gray-500">{material.author}</p>
                      <p className="text-sm text-apple-gray-600 font-apple">
                        Study Material Available
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (isEnrolled) {
                          window.location.href = `/studystore/books/${material._id}`;
                        } else {
                          alert(
                            "Please enroll in the course first to buy materials."
                          );
                        }
                      }}
                      disabled={!isEnrolled}
                      className={`py-2 text-white rounded-md shadow-md mt-auto ${
                        isEnrolled
                          ? "bg-indigo-600 hover:bg-indigo-500"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {isEnrolled ? "Buy Now" : "Enroll to Buy"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No recommended materials available.</p>
            )}
          </div>
        </div> */}
        {/* Study Materials Section */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#023d50] flex items-center">
              📚 <span className="ml-2">Recommended Study Materials</span>
            </h2>
            {books.length > 2 && (
              <a
                href="/studystore/categories"
                className="px-3 py-1.5 bg-gradient-to-r from-[#023d50] to-[#0086b2] text-white rounded-full hover:from-[#1D0D76] hover:to-[#023d50] transition-all duration-300 transform hover:scale-105 font-medium text-xs"
              >
                View All Books →
              </a>
            )}
          </div>
          <div className="flex gap-4 p-4 w-full flex-wrap">
            {loading ? (
              <p>Loading materials...</p>
            ) : books.length > 0 ? (
              books.slice(0, 2).map((material, index) => (
                <div
                  className="bg-white rounded-lg shadow-md transition-shadow duration-300 h-[500px] w-60 flex flex-col"
                  key={index}
                >
                  <div className="relative flex justify-center items-center h-[250px] overflow-hidden">
                    <img
                      src={getOptimizedBookImage(material)}
                      alt={material.name || "No Title"}
                      className="h-full w-full object-cover"
                      crossOrigin="anonymous"
                      onError={(e) => handleImageError(e, material)}
                    />
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-grow">
                    <div>
                      {/* Fixed 3-line space for name */}
                      <h6 className="text-base font-medium h-[72px] overflow-hidden line-clamp-3">
                        {material.name}
                      </h6>
                      <p className="text-sm text-gray-500 mt-1">
                        {material.author}
                      </p>
                      <p className="text-sm text-apple-gray-600 font-apple mt-1">
                        Study Material Available
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (isEnrolled) {
                          window.location.href = `/studystore/books/${material._id}`;
                        } else {
                          alert(
                            "Please enroll in the course first to buy materials."
                          );
                        }
                      }}
                      disabled={!isEnrolled}
                      className={`py-2 text-white rounded-md shadow-md mt-4 ${
                        isEnrolled
                          ? "bg-indigo-600 hover:bg-indigo-500"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {isEnrolled ? "Buy Now" : "Enroll to Buy"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No recommended materials available.</p>
            )}
          </div>
        </div>

        <FAQSection
          faqData={faqs}
          openFAQ={openFAQ}
          toggleFAQ={toggleFAQ}
          loading={faqLoading}
          error={faqError}
        />
      </div>
      <RightSection batch={batch} />
    </div>
  );
};

const TeacherCard = React.memo(({ teacher }) => (
  <div className="min-w-[200px] bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center border border-gray-100">
    <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-3 border-[#0086b2]">
      <img src={teacher.image} alt={teacher.name} className="w-full h-full object-cover" />
    </div>
    <h3 className="text-base font-bold text-[#023d50] mb-1">{teacher.name}</h3>
    <p className="text-xs text-gray-600 leading-relaxed">{teacher.details}</p>
    <div className="mt-3 w-10 h-0.5 bg-gradient-to-r from-[#fc9721] to-[#ff953a] rounded-full mx-auto"></div>
  </div>
));

const SectionWithScroll = React.forwardRef(
  ({ title, children, scrollLeft, scrollRight }, ref) => (
    <div className="bg-gray-50 rounded-xl p-4 mb-6">
      <h2 className="text-lg font-bold text-[#023d50] mb-4 flex items-center">
        {title === "Free Videos" ? "🎥" : "👨‍🏫"} <span className="ml-2">{title}</span>
      </h2>
      <div className="relative">
        <button
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white hover:bg-gray-100 p-2 rounded-full shadow-md transition-all duration-300 hover:scale-110"
        >
          <span className="text-[#023d50] font-medium text-sm">←</span>
        </button>
        <div
          className="flex overflow-x-scroll no-scrollbar gap-4 px-8 py-3"
          ref={ref}
          style={{ scrollBehavior: "smooth" }}
        >
          {children}
        </div>
        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white hover:bg-gray-100 p-2 rounded-full shadow-md transition-all duration-300 hover:scale-110"
        >
          <span className="text-[#023d50] font-medium text-sm">→</span>
        </button>
      </div>
    </div>
  )
);

const FAQSection = ({ faqData, openFAQ, toggleFAQ, loading, error }) => (
  <div className="bg-gray-50 rounded-xl p-4 mb-6">
    <h2 className="text-lg font-bold text-[#023d50] mb-4 flex items-center">
      ❓ <span className="ml-2">Frequently Asked Questions</span>
    </h2>
    {loading ? (
      <div className="mt-3">
        <div className="animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
        <p className="text-gray-500 mt-2 text-sm">Loading FAQs...</p>
      </div>
    ) : error ? (
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-sm text-red-500 hover:text-red-700 underline"
        >
          Try again
        </button>
      </div>
    ) : faqData && faqData.length > 0 ? (
      <div className="mt-2">
        {faqData.map((faq, index) => (
          <div key={faq._id || index} className="mb-4">
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full text-left bg-gray-100 p-4 rounded-lg flex justify-between items-center hover:bg-gray-200 transition-colors"
            >
              <span className="font-semibold">{faq.question}</span>
              <span className="text-xl font-bold">{openFAQ === index ? "−" : "+"}</span>
            </button>
            <div
              style={{
                maxHeight: openFAQ === index ? "200px" : "0px",
                overflow: "hidden",
                transition: "max-height 0.3s ease",
              }}
            >
              {openFAQ === index && (
                <div className="bg-white p-4 rounded-lg shadow mt-2 border-l-4 border-blue-500">
                  <p className="text-gray-600">{faq.answer}</p>
                  {faq.category && faq.category !== 'General' && (
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {faq.category}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-gray-500">No FAQs available for this course yet.</p>
        <p className="text-sm text-gray-400 mt-1">Check back later for updates.</p>
      </div>
    )}
  </div>
);
const RightSection = ({ batch }) => {
  const { courses, fetchCourses } = useCourseContext();
  const { profileData, fetchUserProfile } = useUser();
  const [purchasedCourseIds, setPurchasedCourseIds] = useState(new Set());
  const [installmentDetails, setInstallmentDetails] = useState(null);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [selectedInstallmentIndex, setSelectedInstallmentIndex] = useState(null);
  const [courseData, setCourseData] = useState(batch); // Store course data
  const navigate = useNavigate();
  const params = useParams(); // Get course ID from URL params
  const location = useLocation();

  useEffect(() => {
    // FIX: Remove fetchUserProfile() - UserContext handles this centrally
    // fetchUserProfile(); // REMOVED - causes excessive API calls for unauthenticated users
    fetchCourses();
  }, []);

  // Memoize course ID to prevent unnecessary re-renders
  const courseId = useMemo(() => {
    return batch?._id || location.state?._id || params.id;
  }, [batch?._id, location.state?._id, params.id]);

  // Fetch course data if batch is empty or incomplete (only once)
  const hasFetchedCourseData = useRef(false);
  const batchTitle = batch?.title;
  const batchPrice = batch?.price;
  
  useEffect(() => {
    // Skip if already fetched or no course ID
    if (hasFetchedCourseData.current || !courseId) return;
    
    const fetchCourseData = async () => {
      // If we have a course ID but batch is empty/incomplete, fetch the course
      if (!batch || !batchTitle || !batchPrice) {
        try {
          console.log('🔄 RightSection: Fetching course data for ID:', courseId);
          const response = await api.get(`/admin/courses/${courseId}`);
          if (response.data && response.data.data) {
            setCourseData(response.data.data);
            hasFetchedCourseData.current = true;
            console.log('✅ RightSection: Course data fetched successfully');
          } else if (response.data) {
            setCourseData(response.data);
            hasFetchedCourseData.current = true;
            console.log('✅ RightSection: Course data fetched successfully');
          }
        } catch (error) {
          console.error('❌ RightSection: Error fetching course data:', error);
          // Fallback: use batch if available, even if incomplete
          if (batch) {
            setCourseData(batch);
            hasFetchedCourseData.current = true;
          }
        }
      } else if (batch) {
        // Use batch if it exists and has data
        setCourseData(batch);
        hasFetchedCourseData.current = true;
      }
    };

    fetchCourseData();
  }, [courseId, batchTitle, batchPrice, batch]); // Include batch for fallback

  // Memoize purchased course IDs to prevent unnecessary re-renders
  const purchasedCourseIdsMemo = useMemo(() => {
    const purchasedCourses = profileData?.purchasedCourses || [];
    if (!purchasedCourses.length) return new Set();
    return new Set(
      purchasedCourses.map(
        (purchasedCourse) => {
          const courseId = purchasedCourse.course?.toString?.() || purchasedCourse.course;
          return courseId;
        }
      )
    );
  }, [profileData?.purchasedCourses]);

  useEffect(() => {
    setPurchasedCourseIds(purchasedCourseIdsMemo);
  }, [purchasedCourseIdsMemo]);

  // Memoize course ID and user ID to prevent unnecessary API calls
  const currentCourseId = useMemo(() => {
    return courseData?._id || batch?._id || courseId;
  }, [courseData?._id, batch?._id, courseId]);

  const userId = useMemo(() => {
    return profileData?._id;
  }, [profileData?._id]);

  // Track if we've already fetched installment details to prevent duplicate calls
  const hasFetchedInstallments = useRef(false);
  const lastFetchedCourseId = useRef(null);
  const lastFetchedUserId = useRef(null);

  // Fetch installment details (only when course ID or user ID changes)
  useEffect(() => {
    const fetchInstallmentDetails = async () => {
      // Skip if already fetched for this course/user combination
      if (hasFetchedInstallments.current && 
          lastFetchedCourseId.current === currentCourseId && 
          lastFetchedUserId.current === userId) {
        return;
      }

      if (!currentCourseId || !userId) return;

      try {
        console.log('🔄 RightSection: Fetching installment timeline for course:', currentCourseId);
        // Remove cache-busting to prevent unnecessary re-fetches
        const response = await api.get(
          `/admin/installments/${currentCourseId}/user/${userId}/timeline`
        );
        setInstallmentDetails(response.data.timeline);
        hasFetchedInstallments.current = true;
        lastFetchedCourseId.current = currentCourseId;
        lastFetchedUserId.current = userId;
        console.log('✅ RightSection: Installment timeline fetched successfully');
      } catch (error) {
        console.error("Error fetching installment details:", error);
        // Don't set hasFetchedInstallments to true on error, so it can retry
      }
    };

    fetchInstallmentDetails();
  }, [currentCourseId, userId]); // Only depend on IDs, not full objects

  // Listen for timeline update events (after payment) - separate effect
  useEffect(() => {
    const handleTimelineUpdate = (event) => {
      const eventCourseId = event.detail?.courseId?.toString?.() || event.detail?.courseId;
      const currentId = currentCourseId?.toString?.() || currentCourseId;
      
      if (eventCourseId === currentId && userId) {
        console.log('🔄 Description: Refreshing timeline after payment');
        // Reset fetch flag to allow re-fetch
        hasFetchedInstallments.current = false;
        lastFetchedCourseId.current = null;
        lastFetchedUserId.current = null;
        
        // Fetch fresh data
        api.get(`/admin/installments/${currentCourseId}/user/${userId}/timeline`)
          .then(response => {
            setInstallmentDetails(response.data.timeline);
            hasFetchedInstallments.current = true;
            lastFetchedCourseId.current = currentCourseId;
            lastFetchedUserId.current = userId;
          })
          .catch(error => {
            console.error("Error refreshing installment details:", error);
          });
      }
    };

    window.addEventListener('installmentTimelineUpdated', handleTimelineUpdate);

    return () => {
      window.removeEventListener('installmentTimelineUpdated', handleTimelineUpdate);
    };
  }, [currentCourseId, userId]); // Only depend on IDs

  const handleBuyNowClick = () => {
    // Use courseData (which may be fetched) or fallback to batch
    const course = courseData || batch;
    const courseId = course?._id || params.id;
    
    console.log('🛒 RightSection: Buy Now clicked for course:', {
      courseId: courseId,
      title: course?.title,
      price: course?.price,
      oldPrice: course?.oldPrice,
      discount: course?.discount
    });
    
    if (!courseId) {
      console.error('❌ RightSection: Course ID is missing, cannot navigate to checkout');
      alert('Error: Course information is missing. Please refresh the page and try again.');
      return;
    }
    
    // Navigate to Buy Now page (checkout page) - same as BatchCard
    console.log('🛒 RightSection: Navigating to checkout page:', `/checkout/${courseId}`);
    navigate(`/checkout/${courseId}`, {
      state: { 
        _id: courseId, 
        title: course?.title, 
        price: course?.price, 
        oldPrice: course?.oldPrice, 
        discount: course?.discount 
      },
    });
  };

  const handlePayInstallmentClick = async (installmentIndex = null) => {
    // Check if installment plans exist before opening modal
    const course = courseData || batch;
    const courseId = course?._id || params.id;
    
    if (!courseId) {
      console.error("Course ID is missing");
      return;
    }
    
    try {
      const response = await api.get(`/admin/installments/${courseId}`);
      const plansData = response.data?.data || response.data || [];
      
      if (!Array.isArray(plansData) || plansData.length === 0) {
        // Don't show notification here - just don't open the modal
        // The user said they don't want this modal
        console.log("No installment plans found for course:", courseId);
        return; // Don't open modal if no plans exist
      }
      
      // Plans exist, open the modal
      setSelectedInstallmentIndex(installmentIndex);
      setIsInstallmentModalOpen(true);
    } catch (error) {
      console.error("Error checking installment plans:", error);
      // Don't show error notification - just don't open the modal
      // The user said they don't want this modal
    }
  };

  // Use courseData (which may be fetched) or fallback to batch
  const course = courseData || batch;
  
  // Convert course ID to string for consistent comparison
  const courseIdString = course?._id?.toString?.() || course?._id;
  const isEnrolled = courseIdString ? purchasedCourseIds?.has(courseIdString) : false;
  
  // 🔥 NEW: Check if user made full payment vs installment payment
  // Handle both ObjectId and string comparisons
  const purchasedCourse = profileData?.purchasedCourses?.find(
    (purchased) => {
      const purchasedCourseId = purchased.course?.toString?.() || purchased.course;
      const currentCourseId = course?._id?.toString?.() || course?._id;
      return purchasedCourseId === currentCourseId;
    }
  );
  
  // Debug logging
  console.log('🔍 [Description] Debug installment payment:', {
    isEnrolled,
    courseId: course?._id,
    purchasedCourse: purchasedCourse ? {
      courseId: purchasedCourse.course?.toString?.() || purchasedCourse.course,
      paymentType: purchasedCourse.paymentType,
      totalInstallments: purchasedCourse.totalInstallments,
      amountPaid: purchasedCourse.amountPaid,
      installmentsCount: purchasedCourse.installments?.length || 0,
      installments: purchasedCourse.installments
    } : null,
    profilePurchasedCourses: profileData?.purchasedCourses?.map(pc => ({
      courseId: pc.course?.toString?.() || pc.course,
      paymentType: pc.paymentType,
      totalInstallments: pc.totalInstallments
    }))
  });
  
  const isFullPayment = purchasedCourse?.paymentType === 'full' || 
                       purchasedCourse?.totalInstallments <= 0 ||
                       !purchasedCourse?.totalInstallments;
  
  // Determine next unpaid installment from user's purchasedCourses data
  let nextInstallmentNumber = null;
  let nextInstallmentAmount = null;
  let nextInstallmentDueDate = null;
  let allInstallmentsPaid = false;
  
  // Check if this is an installment payment course
  if (!isFullPayment && purchasedCourse && purchasedCourse.totalInstallments > 0) {
    // Get installments array (might be empty initially)
    const installments = purchasedCourse.installments || [];
    
    // Find all paid installment numbers
    const paidInstallmentNumbers = installments
      .filter(inst => inst.isPaid === true)
      .map(inst => inst.installmentNumber)
      .filter(num => num != null)
      .sort((a, b) => a - b);
    
    // Check if all installments are paid
    allInstallmentsPaid = installments.length > 0 && 
                          installments.length === purchasedCourse.totalInstallments &&
                          installments.every(inst => inst.isPaid === true);
    
    // Find the next unpaid installment (should be the next number after the highest paid)
    const highestPaid = paidInstallmentNumbers.length > 0 
      ? Math.max(...paidInstallmentNumbers) 
      : 0;
    
    // Next installment should be highestPaid + 1, but not exceed totalInstallments
    // Only set nextInstallmentNumber if not all installments are paid
    if (!allInstallmentsPaid && highestPaid < purchasedCourse.totalInstallments) {
      nextInstallmentNumber = highestPaid + 1;
      
      // Try to get installment details from API response for due date
      const installmentFromAPI = installmentDetails?.find(
        (inst) => inst.installmentIndex === (nextInstallmentNumber - 1)
      );
      
      if (installmentFromAPI) {
        nextInstallmentAmount = installmentFromAPI.amount;
        nextInstallmentDueDate = installmentFromAPI.dueDate;
      } else if (installments.length > 0) {
        // Fallback: estimate next installment amount (average of paid installments)
        const paidAmounts = installments
          .filter(inst => inst.isPaid === true)
          .map(inst => inst.amount)
          .filter(amt => amt != null && amt > 0);
        if (paidAmounts.length > 0) {
          nextInstallmentAmount = paidAmounts.reduce((a, b) => a + b, 0) / paidAmounts.length;
        }
      } else if (purchasedCourse.amountPaid && course?.price) {
        // If no installments array yet, estimate based on course price and installments
        const estimatedInstallmentAmount = (course.price - purchasedCourse.amountPaid) / (purchasedCourse.totalInstallments - highestPaid);
        nextInstallmentAmount = estimatedInstallmentAmount;
      }
    }
  }
  
  // Also check API response for additional details
  const nextInstallmentFromAPI = !isFullPayment ? installmentDetails?.find(
    (installment) => !installment.isPaid
  ) : null;
  
  // Use API response due date if available, otherwise calculate from purchase date
  let dueDate = null;
  if (nextInstallmentDueDate) {
    dueDate = new Date(nextInstallmentDueDate);
  } else if (nextInstallmentFromAPI?.dueDate) {
    dueDate = new Date(nextInstallmentFromAPI.dueDate);
  } else if (purchasedCourse?.purchaseDate && nextInstallmentNumber) {
    // Calculate due date: purchaseDate + (nextInstallmentNumber - 1) months
    dueDate = new Date(purchasedCourse.purchaseDate);
    dueDate.setMonth(dueDate.getMonth() + (nextInstallmentNumber - 1));
  }
  
  const formattedDueDate = dueDate
    ? dueDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  // Calculate total course price from installment plan
  const calculateTotalCoursePrice = () => {
    if (!purchasedCourse?.totalInstallments || purchasedCourse.totalInstallments <= 0) {
      return course?.price || null;
    }

    const installments = purchasedCourse.installments || [];
    
    // If installments array has data, calculate from it
    if (installments.length > 0) {
      // Get the amount from the first installment (all should be equal)
      const firstInstallment = installments[0];
      if (firstInstallment?.amount) {
        return firstInstallment.amount * purchasedCourse.totalInstallments;
      }
    }
    
    // Fallback: if amountPaid exists and we know how many installments, estimate
    // This assumes amountPaid is the amount per installment (for first payment)
    if (purchasedCourse.amountPaid && purchasedCourse.totalInstallments) {
      // If only one installment is paid, amountPaid might be per-installment
      const paidCount = installments.filter(inst => inst.isPaid === true).length;
      if (paidCount === 1) {
        return purchasedCourse.amountPaid * purchasedCourse.totalInstallments;
      }
    }
    
    // Final fallback to course price
    return course?.price || null;
  };

  const totalCoursePrice = calculateTotalCoursePrice();

  return (
    <div className="sticky top-4 w-full sm:w-1/3 bg-white rounded-apple-xl border border-apple-gray-200 shadow-apple overflow-hidden h-max">
      <img
        className="w-full h-48 object-cover"
        src={getOptimizedCourseImage(course)}
        alt="Course"
        crossOrigin="anonymous"
        onError={(e) => handleImageError(e, course)}
      />
      <div className="p-4">
        <h3 className="text-lg font-bold text-apple-gray-800 mb-3 font-apple">{course?.title || 'Loading...'}</h3>
        <span className="bg-apple-blue-50 text-apple-blue-700 text-xs font-semibold px-3 py-1 rounded-apple border border-apple-blue-200">
          Hinglish
        </span>

        {isEnrolled && nextInstallmentNumber ? (
          <>
            <button
              onClick={() => {
                // Open installment payment modal with correct index
                const installmentIndex = nextInstallmentNumber - 1; // Convert to 0-based index
                handlePayInstallmentClick(installmentIndex);
              }}
              className="w-full bg-apple-blue-600 text-white py-3 rounded-apple mt-4 hover:bg-apple-blue-700 transition-all duration-300 ease-apple hover-lift font-apple"
            >
              Pay Your {nextInstallmentNumber === 2 ? '2nd' : nextInstallmentNumber === 3 ? '3rd' : nextInstallmentNumber === 4 ? '4th' : `${nextInstallmentNumber}th`} Installment
              {nextInstallmentAmount && ` (₹${Math.round(nextInstallmentAmount).toLocaleString('en-IN')})`}
            </button>
            <p className="text-apple-red text-sm mt-2 text-center font-apple">
              Due Date: <span className="font-bold">{formattedDueDate}</span>
            </p>
            <p className="text-gray-600 text-xs mt-1 text-center font-apple">
              Total Paid: ₹{purchasedCourse?.amountPaid?.toLocaleString('en-IN') || 0} / ₹{totalCoursePrice ? totalCoursePrice.toLocaleString('en-IN') : 'N/A'}
            </p>
          </>
        ) : isEnrolled && !isFullPayment && purchasedCourse?.totalInstallments > 0 && !allInstallmentsPaid ? (
          <>
            {/* Show button only if not all installments are paid */}
            <button
              onClick={() => {
                // Open installment payment modal - will find next unpaid automatically
                handlePayInstallmentClick(null);
              }}
              className="w-full bg-apple-blue-600 text-white py-3 rounded-apple mt-4 hover:bg-apple-blue-700 transition-all duration-300 ease-apple hover-lift font-apple"
            >
              Pay Next Installment
            </button>
            <p className="text-gray-600 text-xs mt-1 text-center font-apple">
              Total Paid: ₹{purchasedCourse?.amountPaid?.toLocaleString('en-IN') || 0} / ₹{totalCoursePrice ? totalCoursePrice.toLocaleString('en-IN') : 'N/A'}
            </p>
          </>
        ) : isEnrolled && !isFullPayment && purchasedCourse?.totalInstallments > 0 && allInstallmentsPaid ? (
          <>
            {/* All installments paid - show completion message */}
            <div className="w-full bg-emerald-50 border border-emerald-200 rounded-apple py-4 mt-4 text-center">
              <div className="text-emerald-600 font-bold text-lg mb-2">✅ All Installments Paid!</div>
              <p className="text-sm text-gray-600">You have completed all your installment payments.</p>
              <p className="text-gray-600 text-xs mt-2 text-center font-apple">
                Total Paid: ₹{purchasedCourse?.amountPaid?.toLocaleString('en-IN') || 0} / ₹{totalCoursePrice ? totalCoursePrice.toLocaleString('en-IN') : 'N/A'}
              </p>
            </div>
          </>
        ) : isEnrolled ? (
          <button
            disabled
            className={`w-full py-3 rounded-apple mt-4 font-apple ${
              isFullPayment 
                ? 'bg-emerald-500 text-white' 
                : 'bg-apple-gray-500 text-white'
            }`}
          >
            {isFullPayment ? '✅ Enrolled (Full Access)' : '✅ Enrolled'}
          </button>
        ) : (
          <button
            onClick={handleBuyNowClick}
            className="w-full py-3 text-base font-semibold group relative overflow-hidden rounded-apple transition-all duration-200 active:scale-95 btn-apple-primary hover:bg-apple-blue-700 font-apple"
          >
            <span className="relative z-10 font-apple">Buy Now</span>
            <div className="absolute inset-0 gradient-apple-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-apple pointer-events-none"></div>
          </button>
        )}
      </div>
      
      {/* Installment Payment Modal */}
      <InstallmentPaymentModal
        isOpen={isInstallmentModalOpen}
        onClose={() => {
          setIsInstallmentModalOpen(false);
          setSelectedInstallmentIndex(null);
        }}
        courseId={course?._id}
        courseTitle={course?.title}
        coursePrice={totalCoursePrice}
        installmentIndex={selectedInstallmentIndex}
        planType={purchasedCourse?.planType || null} // 🔥 CRITICAL: Pass planType from user's enrolled plan
      />
    </div>
  );
};

const teachersData = [
  // Add teacher data as needed
];

export default Description;
