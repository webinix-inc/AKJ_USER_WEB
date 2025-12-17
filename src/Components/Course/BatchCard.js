import React, { useEffect, useMemo, useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useNavigate } from "react-router-dom";
// import { useCourseContext } from "../../Context/CourseContext"; // Removed - data comes from parent
import { FaRegCalendarAlt, FaTag } from "react-icons/fa";
import { notification } from "antd";
import { useUser } from "../../Context/UserContext";
import { getOptimizedCourseImage, handleImageError } from "../../utils/imageUtils";
import api from "../../api/axios";
import InstallmentPaymentModal from "./InstallmentPaymentModal";

const BatchCard = ({
  _id,
  title,
  description,
  courseImage,
  courseVideo,
  endDate,
  price,
  oldPrice,
  discount,
  buttonColor = "blue",
  isLoading = false,
  rootFolder,
}) => {
  const navigate = useNavigate();

  // Remove unused course context methods since data comes from parent
  // const { courses, fetchCourses, fetchPublicCourses } = useCourseContext();
  const { profileData } = useUser();
  const [purchasedCourseIds, setPurchasedCourseIds] = useState(new Set());
  const [coursePaymentInfo, setCoursePaymentInfo] = useState(new Map());

  // Remove individual API calls from BatchCard - data should come from parent context
  // This prevents N×M API calls where N = number of BatchCard components

  // FIX: Remove excessive event listeners that cause cascading API calls
  // Components should rely on profileData from context, not trigger additional fetches
  // useEffect(() => {
  //   const handleProfileUpdate = (event) => {
  //     console.log('🔄 BatchCard: Received profile update event:', event.detail);
  //     fetchUserProfile(); // REMOVED - causes cascading API calls
  //   };
  //   window.addEventListener('profileUpdated', handleProfileUpdate);
  //   const handleFocus = () => {
  //     console.log('🔄 BatchCard: Page focused, refreshing profile...');
  //     fetchUserProfile(); // REMOVED - causes cascading API calls
  //   };
  //   window.addEventListener('focus', handleFocus);
  //   return () => {
  //     window.removeEventListener('profileUpdated', handleProfileUpdate);
  //     window.removeEventListener('focus', handleFocus);
  //   };
  // }, [fetchUserProfile]);

  // Memoize expensive computations to prevent recalculation on every render
  const { purchasedIds, paymentInfoMap } = useMemo(() => {
    if (!profileData?.purchasedCourses) {
      return { purchasedIds: new Set(), paymentInfoMap: new Map() };
    }

    const purchasedIds = new Set();
    const paymentInfoMap = new Map();
    
    // Single loop for both operations - more efficient
    profileData.purchasedCourses.forEach((purchasedCourse) => {
      purchasedIds.add(purchasedCourse.course);
      paymentInfoMap.set(purchasedCourse.course, {
        paymentType: purchasedCourse.paymentType,
        totalInstallments: purchasedCourse.totalInstallments,
        amountPaid: purchasedCourse.amountPaid,
        purchaseDate: purchasedCourse.purchaseDate,
        installments: purchasedCourse.installments || [] // 🔥 Include installments array to check if all are paid
      });
    });

    return { purchasedIds, paymentInfoMap };
  }, [profileData?.purchasedCourses]);

  // Update state only when computed values change
  useEffect(() => {
    setPurchasedCourseIds(purchasedIds);
    setCoursePaymentInfo(paymentInfoMap);
  }, [purchasedIds, paymentInfoMap]);

  const handleExploreClick = () => {
    navigate(`/explorecourses/${_id}`, {
      state: {
        _id,
        title,
        description,
        endDate,
        price,
        oldPrice,
        discount,
        courseImage,
        courseVideo,
        rootFolder,
      },
    });
  };

  const handleBuyNowClick = () => {
    console.log('🛒 BatchCard: Buy Now clicked for course:', {
      courseId: _id,
      title,
      price,
      oldPrice,
      discount
    });
    
    if (!_id) {
      console.error('❌ BatchCard: Course ID is missing, cannot navigate to checkout');
      alert('Error: Course information is missing. Please refresh the page and try again.');
      return;
    }
    
    navigate(`/checkout/${_id}`, {
      state: { _id, title, price, oldPrice, discount },
    });
  };

  const isEnrolled = purchasedCourseIds.has(_id);
  const paymentInfo = coursePaymentInfo.get(_id);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  
  // 🔥 CRITICAL: Get planType from user's purchasedCourses for enrolled users
  const enrolledPlanType = useMemo(() => {
    if (!profileData?.purchasedCourses || !_id) return null;
    const purchasedCourse = profileData.purchasedCourses.find((pc) => {
      const courseIdStr = pc.course?.toString?.() || pc.course;
      const currentCourseId = _id?.toString?.() || _id;
      return courseIdStr === currentCourseId && pc.paymentType === 'installment';
    });
    return purchasedCourse?.planType || null;
  }, [profileData?.purchasedCourses, _id]);
  
  // 🔥 NEW: Determine payment status for button display
  const getPaymentStatus = () => {
    if (!isEnrolled) return { status: 'not_purchased', text: 'Buy Now', color: 'bg-[#153356] text-white' };
    
    if (!paymentInfo) return { status: 'enrolled', text: 'Enrolled', color: 'bg-gray-400 text-white' };
    
    // Full payment
    if (paymentInfo.paymentType === 'full' || paymentInfo.totalInstallments <= 0) {
      return { status: 'enrolled', text: '✅ Enrolled', color: 'bg-green-500 text-white' };
    }
    
    // Installment payment - Check if all installments are paid
    if (paymentInfo.paymentType === 'installment' && paymentInfo.totalInstallments > 0) {
      const installments = paymentInfo.installments || [];
      
      // Check if all installments are paid
      const allInstallmentsPaid = installments.length > 0 && 
                                  installments.length === paymentInfo.totalInstallments &&
                                  installments.every(inst => inst.isPaid === true);
      
      if (allInstallmentsPaid) {
        return { status: 'enrolled', text: '✅ Enrolled Completely', color: 'bg-emerald-500 text-white' };
      } else {
        return { status: 'installment', text: '💳 Pay Installment', color: 'bg-blue-500 text-white' };
      }
    }
    
    // Fallback for installment payment without installments array
    return { status: 'installment', text: '💳 Pay Installment', color: 'bg-blue-500 text-white' };
  };
  
  const paymentStatus = getPaymentStatus();

  const handleInstallmentClick = async () => {
    // Check if installment plans exist before opening modal
    try {
      const response = await api.get(`/admin/installments/${_id}`);
      const plansData = response.data?.data || response.data || [];
      
      if (!Array.isArray(plansData) || plansData.length === 0) {
        notification.warning({
          message: "No Installment Plans",
          description: "This course doesn't have installment plans configured. Please contact support or choose full payment.",
          duration: 4,
        });
        return; // Don't open modal if no plans exist
      }
      
      // Plans exist, open the modal
      setIsInstallmentModalOpen(true);
    } catch (error) {
      console.error("Error checking installment plans:", error);
      notification.error({
        message: "Error",
        description: "Failed to check installment plans. Please try again.",
        duration: 4,
      });
    }
  };

  const displayPrice =
    typeof price === "number"
      ? price
      : Number(price) || 0;

  const displayOldPrice =
    typeof oldPrice === "number"
      ? oldPrice
      : Number(oldPrice);

  return (
    <div className="card-apple flex flex-col group" style={{ transform: 'none', cursor: 'default' }}>
      {/* Image Section */}
      <div className="relative overflow-hidden flex-shrink-0 rounded-t-apple-lg">
        {isLoading ? (
          <Skeleton height="200" />
        ) : (
          <LazyLoadImage
            src={getOptimizedCourseImage({_id, courseImage}) || "https://via.placeholder.com/300"}
            alt={title}
            className="w-full h-[150px] object-contain group-hover:scale-105 transition-transform duration-500 ease-apple"
            effect="blur"
            crossOrigin="anonymous"
            onError={(e) => handleImageError(e, {_id, courseImage})}
            loading="lazy"
            style={{
              backgroundColor: '#f3f4f6',
              maxHeight: '150px'
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        {/* View Icon */}
        {!isLoading && (
          <div className="absolute top-3 right-3">
            <div className="glass-apple rounded-full p-2 shadow-apple transform group-hover:scale-110 transition-transform duration-300">
              <FaRegCalendarAlt className="text-apple-blue-600 text-sm" />
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        {!isLoading && (
          <div className="absolute top-3 left-3">
            <div className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg border border-white/20 backdrop-blur-sm">
              🌐 ONLINE
            </div>
          </div>
        )}
        
        {/* Discount Badge */}
        {!isLoading && discount && (
          <div className="absolute bottom-3 right-3">
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center">
              <FaTag className="mr-1" size={8} />
              {discount}% OFF
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1 space-apple-sm">
          {/* Title */}
          <h6 className="text-apple-subtitle text-apple-gray-900 mb-2 truncate-apple-2 group-hover:text-apple-blue-700 transition-colors duration-300 font-apple">
            {isLoading ? <Skeleton width="90%" height={16} count={2} /> : title}
          </h6>
          
          
          {/* Pricing Section */}
          {!isLoading && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-apple-blue-600">
                    ₹{displayPrice.toLocaleString("en-IN")}
                  </span>
                  {Number.isFinite(displayOldPrice) && displayOldPrice > displayPrice && (
                    <span className="text-sm text-apple-gray-500 line-through">
                      ₹{displayOldPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-apple-gray-600 font-medium">Full Batch Access</p>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-2 relative z-10">
          {isLoading ? (
            <Skeleton height={40} count={2} />
          ) : (
            <>
              <button
                onClick={handleExploreClick}
                className="w-full py-2.5 btn-apple-secondary text-sm font-medium hover:bg-apple-gray-100 active:scale-95 transition-all duration-200 shadow-apple relative z-10"
                style={{ pointerEvents: 'auto' }}
              >
                🔍 Explore Course
              </button>
              
              <button
                onClick={
                  paymentStatus.status === 'not_purchased' 
                    ? handleBuyNowClick 
                    : paymentStatus.status === 'installment'
                    ? handleInstallmentClick
                    : undefined
                }
                disabled={paymentStatus.status === 'enrolled'}
                className={`w-full py-3 text-base font-semibold group relative overflow-hidden rounded-apple transition-all duration-200 active:scale-95 ${
                  paymentStatus.status === 'enrolled'
                    ? 'bg-apple-green-100 text-apple-green-700 cursor-not-allowed'
                    : paymentStatus.status === 'installment'
                    ? 'btn-apple-primary hover:bg-apple-blue-700'
                    : 'btn-apple-primary hover:bg-apple-blue-700'
                }`}
                style={{ pointerEvents: 'auto' }}
              >
                <span className="relative z-10 font-apple">
                  {paymentStatus.text}
                </span>
                {paymentStatus.status === 'not_purchased' && (
                  <div className="absolute inset-0 gradient-apple-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-apple pointer-events-none"></div>
                )}
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Installment Payment Modal */}
      <InstallmentPaymentModal
        isOpen={isInstallmentModalOpen}
        onClose={() => setIsInstallmentModalOpen(false)}
        courseId={_id}
        courseTitle={title}
        coursePrice={price}
        installmentIndex={null}
        planType={enrolledPlanType || null} // 🔥 CRITICAL: Pass planType from user's enrolled plan
      />
    </div>
  );
};

export default React.memo(BatchCard);
