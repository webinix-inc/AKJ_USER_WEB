import { Button, notification } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { createRoot } from "react-dom/client";
import api from "../../api/axios";
import { usePayment } from "../../Context/PaymentContext";
import { useSubscription } from "../../Context/SubscriptionContext";
import { useUser } from "../../Context/UserContext";
import Image1 from "../../Image2/LOGO.jpeg";
import ApplyCouponComponent from "./Coupons/ApplyCoupon";
import PaymentReceipt from "./PaymentReceipt";

const BuyNowPage = () => {
  const navigate = useNavigate();
  const { fetchInstallments, installments, subscriptions, fetchSubscriptions, loading, error } =
    useSubscription();
  const { userData, fetchUserProfile } = useUser();
  const [filteredInstallments, setFilteredInstallments] = useState([]);
  const [selectedValidity, setSelectedValidity] = useState(null);
  const [courseSubscriptions, setCourseSubscriptions] = useState([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPriceSummaryModalOpen, setIsPriceSummaryModalOpen] = useState(false);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false); // New state for installment modal
  const [selectedPlanId, setSelectedPlanId] = useState(null); // 🔥 NEW: Track selected plan ID
  const [appliedCoupon, setAppliedCoupon] = useState(null); // State to store applied coupon
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5); // Start with 5 seconds
  const [enrollmentChecking, setEnrollmentChecking] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState({
    attempts: 0,
    maxAttempts: 3,
    lastMessage: "",
  });
  const redirectIntervalRef = useRef(null);

  const [total, setTotal] = useState(0);
  const [coursePrice, setCoursePrice] = useState(0);
  const [courseOldPrice, setCourseOldPrice] = useState(0);

  const {
    createOrder,
    initiatePayment,
    verifyPaymentSignature,
    loading: paymentLoading,
  } = usePayment();

  const location = useLocation();
  const params = useParams();

  // Get course ID from either location.state or URL params
  const _id = location.state?._id || params.id;

  const { planType } = location.state || {};

  const courseDetails = courseSubscriptions[0]?.course;

  // Fetch installments and subscriptions when course ID is available
  useEffect(() => {
    const fetchData = async () => {
      console.log('🛒 BuyNowPage: Component initialized with:', {
        courseIdFromState: location.state?._id,
        courseIdFromParams: params.id,
        finalCourseId: _id,
        planType,
        userId: userData?.userId,
        locationState: location.state
      });
      
      if (_id) {
        console.log('🛒 BuyNowPage: Fetching installments and subscriptions for course:', _id);
        try {
          // 🔥 CRITICAL: Only pass userId if user is ALREADY ENROLLED (has purchasedCourses entry)
          // At purchase time, don't pass userId so all plans are shown
          const fetchOptions = {};
          
          // 🔥 CRITICAL: Check if user is ACTUALLY ENROLLED (has installments array with data)
          // Just having purchasedCourses entry is not enough - need installments array
          const userPurchasedCourse = userData?.purchasedCourses?.find((pc) => {
            const pcCourseId = pc.course?.toString?.() || pc.course;
            const currentCourseId = _id?.toString?.() || _id;
            return pcCourseId === currentCourseId && pc.paymentType === 'installment';
          });
          
          // Only pass userId if user is ACTUALLY ENROLLED (has installments array with length > 0)
          const isEnrolled = userPurchasedCourse?.installments && userPurchasedCourse.installments.length > 0;
          
          if (isEnrolled && userData?.userId) {
            fetchOptions.userId = userData.userId;
            console.log('✅ [BuyNowPage] User is ENROLLED with plan:', userPurchasedCourse.planType, '- passing userId to filter to enrolled plan');
          } else {
            console.log('ℹ️ [BuyNowPage] User not enrolled yet - showing all plans for selection');
            // Don't pass userId - we need ALL plans visible for selection
          }
          
          if (planType) {
            fetchOptions.planType = planType;
            console.log('✅ [BuyNowPage] Passing planType to filter plans:', planType);
          }
          // 🔥 CRITICAL: Don't pass installmentPlanId during initial fetch - we need ALL plans
          // installmentPlanId should only be used when user is enrolled and we want to show their specific plan
          // For new purchases, we need all plans to be visible
          
          await Promise.all([
            fetchInstallments(_id, fetchOptions),
            fetchSubscriptions()
          ]);
          console.log('🛒 BuyNowPage: Data fetching completed');
        } catch (error) {
          console.error('❌ BuyNowPage: Error during data fetching:', error);
        }
      } else {
        console.error('❌ BuyNowPage: No course ID found in location.state or URL params');
        console.error('❌ BuyNowPage: Debug info:', {
          locationState: location.state,
          params: params,
          pathname: location.pathname
        });
      }
    };
    fetchData();
  }, [_id, userData?.userId, planType, userData?.purchasedCourses]); // 🔥 Added purchasedCourses to detect enrollment changes

  // FIX: BuyNowPage needs fresh user data for payment processing - restore with conditions
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Only fetch if userData is missing or doesn't have userId (critical for payments)
        if (!userData || !userData.userId) {
          console.log('🛒 BuyNowPage: Fetching user profile for payment processing...');
          await fetchUserProfile(false); // Don't force refresh unless necessary
        } else {
          console.log('🛒 BuyNowPage: User data already available for payments');
        }
      } catch (error) {
        console.error("Error fetching user profile for BuyNowPage:", error);
      }
    };
    loadProfile();
  }, []); // Only run once on mount

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
      if (redirectIntervalRef.current) {
        clearInterval(redirectIntervalRef.current);
        redirectIntervalRef.current = null;
      }
      // Cleanup: Clear enrollment status on unmount
      if (_id) {
        localStorage.removeItem(`enrollment-checking-${_id}`);
      }
    };
  }, []);

  useEffect(() => {
    if (installments.length > 0) {
      // 🔥 CRITICAL: Show ALL plans initially - user can select any plan
      let filtered = installments;
      
      // 🔥 CRITICAL: Check if user is ACTUALLY ENROLLED (has installments array with data)
      // Only set selected plan if user is enrolled, but ALWAYS show all plans
      if (userData?.purchasedCourses && _id) {
        const courseIdString = _id?.toString?.() || _id;
        const userPurchasedCourse = userData.purchasedCourses.find((pc) => {
          const pcCourseId = pc.course?.toString?.() || pc.course;
          return pcCourseId === courseIdString && pc.paymentType === 'installment';
        });
        
        // Only consider enrolled if installments array exists and has data
        const isActuallyEnrolled = userPurchasedCourse?.installments && userPurchasedCourse.installments.length > 0;
        
        if (isActuallyEnrolled && userPurchasedCourse?.planType) {
          // User has enrolled - set their enrolled plan as selected, but show all plans
          const enrolledPlan = installments.find(p => p.planType === userPurchasedCourse.planType);
          if (enrolledPlan?._id && !selectedPlanId) {
            setSelectedPlanId(enrolledPlan._id.toString());
          }
          console.log(`✅ [BuyNowPage] User ENROLLED with plan: ${userPurchasedCourse.planType}, showing all plans`);
        } else if (planType && !selectedPlanId) {
          // If planType is provided in location.state, set it as selected but show all plans
          const matchingPlan = installments.find(p => p.planType === planType);
          if (matchingPlan?._id) {
            setSelectedPlanId(matchingPlan._id.toString());
          }
          console.log(`✅ [BuyNowPage] Using planType from location.state: ${planType}, showing all plans`);
        }
      } else if (planType && !selectedPlanId) {
        // If planType is provided in location.state, set it as selected but show all plans
        const matchingPlan = installments.find(p => p.planType === planType);
        if (matchingPlan?._id) {
          setSelectedPlanId(matchingPlan._id.toString());
        }
        console.log(`✅ [BuyNowPage] Using planType from location.state: ${planType}, showing all plans`);
      }
      
      // Always show all plans - no filtering
      setFilteredInstallments(filtered);
      console.log(`📋 [BuyNowPage] Showing all installments:`, {
        total: installments.length,
        filtered: filtered.length,
        selectedPlanId,
        plans: filtered.map(p => ({ 
          id: p._id, 
          planType: p.planType,
          totalAmount: p.totalAmount,
          numberOfInstallments: p.numberOfInstallments
        }))
      });
      
      // 🔥 CRITICAL: Verify all plans have amounts
      filtered.forEach(plan => {
        if (!plan.totalAmount || !plan.numberOfInstallments) {
          console.warn(`⚠️ [BuyNowPage] Plan ${plan.planType} (ID: ${plan._id}) missing amount data:`, {
            totalAmount: plan.totalAmount,
            numberOfInstallments: plan.numberOfInstallments
          });
        }
      });
    }
  }, [installments, selectedValidity, planType, userData?.purchasedCourses, _id]); // 🔥 Removed selectedPlanId - don't refilter when plan is selected

  // useEffect(() => {
  //   if (subscriptions.length > 0 && _id) {
  //     const filteredSubscriptions = subscriptions.filter(
  //       (sub) => sub?.course?._id === _id
  //     );
  //     setCourseSubscriptions(filteredSubscriptions);

  //     if (filteredSubscriptions.length > 0) {
  //       const firstValidity = filteredSubscriptions[0].validities[0]?.validity;
  //       setSelectedValidity(firstValidity);
  //     }
  //   }
  // }, [subscriptions, _id]);

  useEffect(() => {
    console.log('🛒 BuyNowPage: Processing subscriptions...', {
      subscriptionsCount: subscriptions.length,
      courseId: _id,
      installmentsCount: installments.length,
      subscriptions: subscriptions.map(sub => ({
        courseId: sub?.course?._id,
        courseIdType: typeof sub?.course?._id,
        courseTitle: sub?.course?.title
      }))
    });
    
    if (subscriptions.length > 0 && _id) {
      // Convert _id to string for comparison (handles both string and ObjectId)
      const courseIdString = _id?.toString?.() || _id;
      
      const filteredSubscriptions = subscriptions.filter(
        (sub) => {
          const subCourseId = sub?.course?._id?.toString?.() || sub?.course?._id;
          const matches = subCourseId === courseIdString;
          console.log('🔍 BuyNowPage: Comparing course IDs:', {
            subscriptionCourseId: subCourseId,
            currentCourseId: courseIdString,
            matches
          });
          return matches;
        }
      );
      
      console.log('🛒 BuyNowPage: Filtered subscriptions for course:', {
        filteredCount: filteredSubscriptions.length,
        filteredSubscriptions: filteredSubscriptions.map(sub => ({
          courseId: sub?.course?._id,
          title: sub?.course?.title,
          validitiesCount: sub?.validities?.length
        }))
      });
      
      setCourseSubscriptions(filteredSubscriptions);

      if (filteredSubscriptions.length > 0) {
        const firstValidity = filteredSubscriptions[0].validities[0]?.validity;
        const firstSubscription = filteredSubscriptions[0];
        setSelectedValidity(firstValidity);

        // Set course pricing
        const course = firstSubscription.course;
        if (course) {
          setCoursePrice(course.price);
          setCourseOldPrice(course.oldPrice);
        }

        // set first total Price
        const firstInstallment = installments.find(
          (inst) => inst.planType === `${firstValidity} months`
        );

        if (firstInstallment) {
          setTotal(firstInstallment.totalAmount.toFixed(0));
        }
        
        console.log('🛒 BuyNowPage: Setup complete', {
          selectedValidity: firstValidity,
          coursePrice: course?.price,
          totalAmount: firstInstallment?.totalAmount,
          subscriptionFound: true
        });
      } else {
        console.log('⚠️ BuyNowPage: No subscriptions found for course ID:', {
          courseId: _id,
          courseIdString,
          totalSubscriptions: subscriptions.length,
          subscriptionCourseIds: subscriptions.map(sub => sub?.course?._id?.toString?.() || sub?.course?._id)
        });
      }
    } else {
      console.log('⚠️ BuyNowPage: Missing data for subscription filtering:', {
        hasSubscriptions: subscriptions.length > 0,
        hasCourseId: !!_id,
        courseId: _id
      });
    }
  }, [subscriptions.length, _id, installments.length]);

  // Helper function to generate PDF from receipt data
  const generateReceiptPDF = async (receiptData) => {
    // Create a hidden container for the receipt
    const receiptContainer = document.createElement('div');
    receiptContainer.style.position = 'fixed';
    receiptContainer.style.left = '-9999px';
    receiptContainer.style.top = '0';
    receiptContainer.style.width = '210mm';
    receiptContainer.style.backgroundColor = '#ffffff';
    document.body.appendChild(receiptContainer);

    // Use createRoot to render the receipt (React 18)
    const root = createRoot(receiptContainer);
    root.render(<PaymentReceipt receiptData={receiptData} />);

    // Wait for rendering, then generate PDF
    setTimeout(async () => {
      try {
        const receiptElement = receiptContainer.querySelector('.payment-receipt');
        if (!receiptElement) {
          throw new Error('Receipt element not found');
        }

        const html2canvas = (await import('html2canvas')).default;
        const jsPDF = (await import('jspdf')).default;

        const canvas = await html2canvas(receiptElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: receiptElement.scrollWidth,
          height: receiptElement.scrollHeight
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        // Generate filename
        const filename = `Payment_Receipt_${receiptData.courseTitle.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
        
        pdf.save(filename);

        // Cleanup
        root.unmount();
        document.body.removeChild(receiptContainer);

        notification.success({
          message: "Receipt Downloaded",
          description: "Your payment receipt has been downloaded successfully.",
          duration: 3,
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        notification.error({
          message: "Download Failed",
          description: "Failed to generate receipt. Please try again.",
          duration: 4,
        });
        
        // Cleanup on error
        try {
          root.unmount();
          if (document.body.contains(receiptContainer)) {
            document.body.removeChild(receiptContainer);
          }
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
    }, 1000);
  };

  const handlePayment = async ({
    amount,
    courseId,
    userId,
    planType,
    installmentPlanId, // 🔥 NEW: Selected plan ID
    paymentMode,
    installmentIndex = null,
    totalInstallments = null,
    courseDetails, // Adding courseDetails for the state
  }) => {
    try {
      // Create order with the appropriate paymentMode and installment details
      const orderData = await createOrder({
        amount,
        courseId,
        userId,
        planType,
        installmentPlanId, // 🔥 NEW: Pass selected plan ID
        paymentMode,
        installmentIndex,
        totalInstallments,
      });

      // Trigger the payment using Razorpay
      const paymentResponse = await initiatePayment(orderData);
      console.log("Payment successful:", paymentResponse);
      
      // Verify payment signature with backend
      console.log("Verifying payment signature...");
      setEnrollmentChecking(true);
      setEnrollmentStatus({
        attempts: 0,
        maxAttempts: 3,
        lastMessage: "Setting up your course access...",
      });
      
      // Store enrollment status in localStorage for CourseDetails and PurchasedCourses to pick up
      const enrollmentData = {
        courseId: courseId,
        isChecking: true,
        attempts: 0,
        maxAttempts: 10,
        lastMessage: "Setting up your course access...",
        timestamp: Date.now()
      };
      localStorage.setItem(`enrollment-checking-${courseId}`, JSON.stringify(enrollmentData));
      
      // Emit custom event for CourseDetails and PurchasedCourses to listen
      window.dispatchEvent(new CustomEvent('enrollmentStarted', { 
        detail: { courseId, enrollmentData } 
      }));
      
      try {
        const verificationResponse = await verifyPaymentSignature(paymentResponse);
        console.log("Payment verification successful:", verificationResponse);
        
        // 🔥 NEW: Use course access API to check if access is granted
        // This is more reliable than checking purchasedCourses
        let retryCount = 0;
        const maxRetries = 15; // Increased retries for better reliability (30 seconds total)
        const checkInterval = 2000; // Check every 2 seconds
        let hasAccess = false;
        
        // Helper function to check course access via API
        const checkCourseAccess = async () => {
          try {
            const response = await api.post(`/stream/check-course-access/${courseId}`, {
              userId: userId
            });
            const hasAccessResult = response.data?.hasAccess === true;
            console.log(`🔍 [BuyNowPage] Course access check result:`, {
              hasAccess: hasAccessResult,
              reason: response.data?.reason,
              message: response.data?.message
            });
            return hasAccessResult;
          } catch (error) {
            console.warn("❌ [BuyNowPage] Error checking course access:", error);
            return false;
          }
        };
        
        // First check immediately (backend should have enrolled already)
        const updateMessage = "Verifying course access...";
        setEnrollmentStatus({
          attempts: 0,
          maxAttempts: maxRetries,
          lastMessage: updateMessage,
        });
        
        // Update localStorage
        const enrollmentData = {
          courseId: courseId,
          isChecking: true,
          attempts: 0,
          maxAttempts: maxRetries,
          lastMessage: updateMessage,
          timestamp: Date.now()
        };
        localStorage.setItem(`enrollment-checking-${courseId}`, JSON.stringify(enrollmentData));
        
        // Emit update event
        window.dispatchEvent(new CustomEvent('enrollmentUpdate', { 
          detail: { courseId, enrollmentData } 
        }));
        
        hasAccess = await checkCourseAccess();
        
        // Keep checking until access is granted or max retries reached
        while (retryCount < maxRetries && !hasAccess) {
          retryCount++;
          const statusMessage = retryCount <= 3 
            ? "Granting course access..."
            : retryCount <= 6
            ? "Finalizing course access..."
            : "Almost done, please wait...";
          
          setEnrollmentStatus({
            attempts: retryCount,
            maxAttempts: maxRetries,
            lastMessage: statusMessage,
          });

          // Update localStorage with progress
          const enrollmentData = {
            courseId: courseId,
            isChecking: true,
            attempts: retryCount,
            maxAttempts: maxRetries,
            lastMessage: statusMessage,
            timestamp: Date.now()
          };
          localStorage.setItem(`enrollment-checking-${courseId}`, JSON.stringify(enrollmentData));
          
          // Emit update event
          window.dispatchEvent(new CustomEvent('enrollmentUpdate', { 
            detail: { courseId, enrollmentData } 
          }));

          console.log(`🔄 Checking course access, attempt ${retryCount}/${maxRetries}`);
          
          // Wait before next check
          await new Promise((resolve) => setTimeout(resolve, checkInterval));
          
          // 🔥 CRITICAL: Refresh user profile before checking access to get latest data
          await fetchUserProfile(true);
          
          // Wait a bit for profile to update
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          // Check course access via API
          hasAccess = await checkCourseAccess();
          
          // Log the check result for debugging
          console.log(`🔍 [BuyNowPage] Access check attempt ${retryCount}/${maxRetries}: ${hasAccess ? '✅ GRANTED' : '❌ NOT GRANTED'}`);
        }
        
        // 🔥 CRITICAL: Only turn off loader if access is confirmed
        if (hasAccess) {
          console.log("✅ Course access confirmed!");
          setEnrollmentChecking(false);
          
          // Clear enrollment status from localStorage
          localStorage.removeItem(`enrollment-checking-${courseId}`);
          
          // Emit completion event
          window.dispatchEvent(new CustomEvent('enrollmentCompleted', { 
            detail: { courseId, success: true } 
          }));
          
          // Final profile refresh before redirect - this will update userData
          await fetchUserProfile(true);
          
          // 🔥 CRITICAL: Wait for profile to update, then refetch installments
          // After payment, user is enrolled, so backend will return only their enrolled plan
          await new Promise((resolve) => setTimeout(resolve, 1500));
          try {
            // Refetch user profile to get updated purchasedCourses with installments
            await fetchUserProfile(true);
            
            // Wait a bit more for state to update
            await new Promise((resolve) => setTimeout(resolve, 500));
            
            // Refetch installments - backend will filter to enrolled plan based on userId
            // The backend checks if user has installments array, and if yes, filters to that plan
            await fetchInstallments(courseId, { userId: userData.userId });
            console.log('✅ [BuyNowPage] Refetched installments after enrollment - backend should filter to enrolled plan');
          } catch (error) {
            console.error('⚠️ [BuyNowPage] Error refetching installments after enrollment:', error);
          }
          
          // Trigger global profile refresh for all components
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('profileUpdated', { 
              detail: { reason: 'payment_success', courseId, hasAccess: true } 
            }));
          }
          
          setIsPaymentModalOpen(false);
          setIsInstallmentModalOpen(false);
          
          // 🔥 AUTO-DOWNLOAD RECEIPT: Automatically download receipt after payment success
          console.log('📄 Setting up auto-download receipt...', { verificationResponse, orderData, paymentResponse });
          try {
            // Wait a bit for order to be saved in backend
            setTimeout(async () => {
              try {
                console.log('📄 Starting receipt download...');
                
                // Get order details from verification response - check both data and order properties
                const orderFromResponse = verificationResponse?.order || verificationResponse?.data?.order;
                const orderId = orderFromResponse?.orderId || orderData?.orderId || paymentResponse?.orderId;
                const paymentId = orderFromResponse?.paymentId || paymentResponse?.razorpay_payment_id || paymentResponse?.paymentId;
                const trackingNumber = orderFromResponse?.trackingNumber || 'N/A';
                
                console.log('📄 Receipt data:', { orderId, paymentId, trackingNumber });
                
                if (!orderId) {
                  console.warn('⚠️ Order ID not found, fetching from API...');
                  // Try to fetch order from API
                  try {
                    if (userId && courseId) {
                      const ordersResponse = await api.get(`/admin/orders/paid`);
                      const paidOrders = ordersResponse.data?.data || [];
                      const userOrder = paidOrders.find(order => {
                        const orderUserId = order.userId?._id?.toString?.() || order.userId?.toString?.() || order.userId;
                        const orderCourseId = order.courseId?._id?.toString?.() || order.courseId?.toString?.() || order.courseId;
                        const userIdStr = userId?.toString?.() || userId;
                        const currentCourseId = courseId?.toString?.() || courseId;
                        return orderUserId === userIdStr && 
                               orderCourseId === currentCourseId && 
                               order.status === 'paid';
                      });
                      
                      if (userOrder) {
                        console.log('✅ Found order from API:', userOrder);
                        const finalOrderId = userOrder.orderId;
                        const finalPaymentId = userOrder.paymentId;
                        const finalTrackingNumber = userOrder.trackingNumber;
                        
                        // Prepare receipt data
                        const receiptData = {
                          courseTitle: courseDetails?.title || 'Course',
                          installmentNumber: 1,
                          totalInstallments: 1,
                          amount: amount || (userOrder.amount / 100) || courseDetails?.price || 0,
                          paymentDate: userOrder.paidAt || userOrder.updatedAt || new Date(),
                          transactionId: finalPaymentId || 'N/A',
                          orderId: finalOrderId || 'N/A',
                          trackingNumber: finalTrackingNumber || 'N/A',
                          studentName: userData?.firstName && userData?.lastName 
                            ? `${userData.firstName} ${userData.lastName}` 
                            : userData?.name || 'N/A',
                          studentEmail: userData?.email || 'N/A',
                          planType: planType || 'Full Payment',
                          coursePrice: courseDetails?.price || amount || 0,
                          amountPaid: amount || courseDetails?.price || 0,
                          remainingAmount: 0
                        };
                        
                        console.log('📄 Generating receipt PDF with data:', receiptData);
                        // Auto-download receipt
                        await generateReceiptPDF(receiptData);
                        return;
                      }
                    }
                  } catch (fetchError) {
                    console.error('⚠️ Error fetching order from API:', fetchError);
                  }
                }
                
                // Prepare receipt data with available information
                const receiptData = {
                  courseTitle: courseDetails?.title || 'Course',
                  installmentNumber: 1,
                  totalInstallments: 1,
                  amount: amount || courseDetails?.price || 0,
                  paymentDate: new Date(),
                  transactionId: paymentId || 'N/A',
                  orderId: orderId || 'N/A',
                  trackingNumber: trackingNumber,
                  studentName: userData?.firstName && userData?.lastName 
                    ? `${userData.firstName} ${userData.lastName}` 
                    : userData?.name || 'N/A',
                  studentEmail: userData?.email || 'N/A',
                  planType: planType || 'Full Payment',
                  coursePrice: courseDetails?.price || amount || 0,
                  amountPaid: amount || courseDetails?.price || 0,
                  remainingAmount: 0
                };
                
                console.log('📄 Generating receipt PDF with data:', receiptData);
                // Auto-download receipt
                await generateReceiptPDF(receiptData);
              } catch (receiptError) {
                console.error('❌ Error auto-downloading receipt:', receiptError);
                console.error('❌ Receipt error details:', receiptError.stack);
                // Don't show error to user - receipt can be downloaded manually later
              }
            }, 2000); // Wait 2 seconds for backend to process order
          } catch (error) {
            console.error('❌ Error setting up auto-download receipt:', error);
          }
          
          // Show success notification with redirect countdown
          setOverlayVisible(true);
          setRedirectCountdown(5);
          
          notification.success({
            message: "Payment Successful!",
            description: "Course access granted. Redirecting in 5 seconds...",
            placement: "top",
            duration: 5,
            key: `payment-success-${courseId}`,
          });
          
          // Start countdown and redirect
          startRedirectCountdown({ 
            courseDetails: {
              _id: courseDetails._id,
              title: courseDetails.title,
              description: courseDetails.description,
              startDate: courseDetails.startDate,
              endDate: courseDetails.endDate,
              price: courseDetails.price,
              oldPrice: courseDetails.oldPrice,
              discount: courseDetails.discount,
              courseImage: courseDetails.courseImage,
              rootFolder: courseDetails.rootFolder,
              courseVideo: courseDetails.courseVideo,
            }
          });
        } else {
          // Access not confirmed after max retries - but payment was successful
          console.warn("⚠️ Course access not confirmed after max retries, but payment was successful");
          
          // Update notification with final status
          const finalMessage = "Access is being processed. You will be redirected...";
          setEnrollmentStatus({
            attempts: maxRetries,
            maxAttempts: maxRetries,
            lastMessage: finalMessage,
          });
          
          // Update localStorage with final status
          const finalEnrollmentData = {
            courseId: courseId,
            isChecking: true,
            attempts: maxRetries,
            maxAttempts: maxRetries,
            lastMessage: finalMessage,
            timestamp: Date.now()
          };
          localStorage.setItem(`enrollment-checking-${courseId}`, JSON.stringify(finalEnrollmentData));
          
          // Emit update event
          window.dispatchEvent(new CustomEvent('enrollmentUpdate', { 
            detail: { courseId, enrollmentData: finalEnrollmentData } 
          }));
          
          // Wait a bit more and do final check
          await new Promise((resolve) => setTimeout(resolve, 3000));
          hasAccess = await checkCourseAccess();
          
          setEnrollmentChecking(false);
          
          // Clear enrollment status from localStorage
          localStorage.removeItem(`enrollment-checking-${courseId}`);
          
          // Emit completion event
          window.dispatchEvent(new CustomEvent('enrollmentCompleted', { 
            detail: { courseId, success: hasAccess } 
          }));
          
          await fetchUserProfile(true);
          
          setIsPaymentModalOpen(false);
          setIsInstallmentModalOpen(false);
          
          if (hasAccess) {
            notification.success({
              message: "Payment Successful!",
              description: "Course access granted. Redirecting in 5 seconds...",
              placement: "top",
              duration: 5,
              key: `payment-success-${courseId}`,
            });
          } else {
            notification.warning({
              message: "Payment Successful!",
              description: "Course access is being set up. Please refresh the page if access doesn't appear.",
              placement: "top",
              duration: 8,
              key: `payment-warning-${courseId}`,
            });
          }
          
          setOverlayVisible(true);
          setRedirectCountdown(5);
          
          startRedirectCountdown({ 
            courseDetails: {
              _id: courseDetails._id,
              title: courseDetails.title,
              description: courseDetails.description,
              startDate: courseDetails.startDate,
              endDate: courseDetails.endDate,
              price: courseDetails.price,
              oldPrice: courseDetails.oldPrice,
              discount: courseDetails.discount,
              courseImage: courseDetails.courseImage,
              rootFolder: courseDetails.rootFolder,
              courseVideo: courseDetails.courseVideo,
            }
          });
        }
      } catch (verificationError) {
        console.error("Payment verification failed:", verificationError);
        setEnrollmentChecking(false);
        
        // Clear enrollment status from localStorage
        localStorage.removeItem(`enrollment-checking-${courseId}`);
        
        // Emit completion event
        window.dispatchEvent(new CustomEvent('enrollmentCompleted', { 
          detail: { courseId, success: false, error: true } 
        }));
        
        setIsPaymentModalOpen(false);
        setIsInstallmentModalOpen(false);
        
        // Payment was successful, but verification had an issue
        setOverlayVisible(true);
        setRedirectCountdown(5);
        
        notification.success({
          message: "Payment Successful!",
          description: "Your payment was processed. Redirecting in 5 seconds...",
          placement: "top",
          duration: 5,
          key: `payment-success-${courseId}`,
        });
        
        // Start countdown and redirect after 5 seconds
        startRedirectCountdown({ 
          courseDetails: {
            _id: courseDetails._id,
            title: courseDetails.title,
            description: courseDetails.description,
            startDate: courseDetails.startDate,
            endDate: courseDetails.endDate,
            price: courseDetails.price,
            oldPrice: courseDetails.oldPrice,
            discount: courseDetails.discount,
            courseImage: courseDetails.courseImage,
            rootFolder: courseDetails.rootFolder,
            courseVideo: courseDetails.courseVideo,
          }
        });
      }
    } catch (error) {
      console.error("Payment error:", error);
      setEnrollmentChecking(false);
      
      // Clear enrollment status from localStorage
      if (courseId) {
        localStorage.removeItem(`enrollment-checking-${courseId}`);
        window.dispatchEvent(new CustomEvent('enrollmentCompleted', { 
          detail: { courseId, success: false, error: true } 
        }));
      }
      
      setIsPaymentModalOpen(false);
      setIsInstallmentModalOpen(false);

      // Display error notification (only once)
      notification.error({
        message: "Payment Failed",
        description: "Please try again. If the issue persists, contact support.",
        placement: "top",
        duration: 5,
        key: `payment-error-${courseId || 'unknown'}`,
      });
    }
  };

  const startRedirectCountdown = ({ courseDetails, redirectUrl }) => {
    if (redirectIntervalRef.current) {
      clearInterval(redirectIntervalRef.current);
      redirectIntervalRef.current = null;
    }

    setRedirectCountdown(5);
    redirectIntervalRef.current = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(redirectIntervalRef.current);
          redirectIntervalRef.current = null;
          setOverlayVisible(false);
          if (courseDetails) {
            navigate(`/explorecourses/${courseDetails._id}?fromPayment=true`, {
              state: {
                _id: courseDetails._id,
                title: courseDetails.title,
                description: courseDetails.description,
                startDate: courseDetails.startDate,
                endDate: courseDetails.endDate,
                price: courseDetails.price,
                oldPrice: courseDetails.oldPrice,
                discount: courseDetails.discount,
                courseImage: courseDetails.courseImage,
                rootFolder: courseDetails.rootFolder,
                courseVideo: courseDetails.courseVideo,
                fromPayment: true, // Flag to show loader in CourseDetails
              },
            });
          } else if (redirectUrl) {
            window.location.href = redirectUrl;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Removed showPopup function - notifications are now handled directly in handlePayment
  // This prevents duplicate toast notifications

  const handleBuyNow = async () => {
    // const amount =
    //   parseInt(finalPrice) +
    //   parseInt(calculateInternetHandlingCharges()) +
    //   parseInt(calculateGST());
    const amount = total;
    
    // 🔥 Get the selected plan info for full payment
    const selectedPlan = filteredInstallments.find(inst => 
      inst._id?.toString() === selectedPlanId?.toString()
    ) || filteredInstallments[0];
    
    await handlePayment({
      courseDetails,
      amount,
      courseId: _id,
      userId: userData.userId,
      planType: selectedPlan?.planType || selectedValidityDetails?.validity ? `${selectedValidityDetails.validity} months` : null,
      installmentPlanId: selectedPlan?._id || selectedPlanId, // 🔥 Pass selected plan ID
      paymentMode: "full", // Full payment mode
    });
  };

  const handleProceedToPay = () => {
    // Validate that a subscription plan is selected
    if (!selectedValidity) {
      notification.warning({
        message: "Selection Required",
        description: "Please select a subscription plan before proceeding to payment.",
        placement: "top",
      });
      return;
    }

    // Validate that subscription data is available
    if (!subscription) {
      notification.error({
        message: "Subscription Error",
        description: "No subscription plans are available for this course. Please try refreshing the page.",
        placement: "top",
      });
      return;
    }

    console.log('🛒 BuyNowPage: Proceeding to payment with:', {
      selectedValidity,
      total,
      courseId: _id,
      subscription: subscription?.course?.title
    });

    setIsPaymentModalOpen(true);
  };

  const handleOpenPriceSummary = () => {
    setIsPriceSummaryModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsPriceSummaryModalOpen(false);
  };
  const handleOpenInstallmentModal = async () => {
    // Check if installment plans exist before opening modal
    if (!_id) {
      console.error("Course ID is missing");
      return;
    }
    
    try {
      const response = await api.get(`/admin/installments/${_id}`);
      const plansData = response.data?.data || response.data || [];
      
      if (!Array.isArray(plansData) || plansData.length === 0) {
        // Don't open modal if no plans exist
        console.log("No installment plans found for course:", _id);
        return;
      }
      
      // Plans exist, open the modal
      setIsInstallmentModalOpen(true);
    } catch (error) {
      console.error("Error checking installment plans:", error);
      // Don't open modal on error
    }
  };

  // this is deprecated function and is currently not in use
  // const calculateTotalPayable = () => {
  //   // const originalPrice = fullPayAmount;
  //   const originalPrice = total;
  //   const discount =
  //     appliedCoupon?.discountType === "Flat"
  //       ? appliedCoupon.discountAmount
  //       : (originalPrice * appliedCoupon?.discountAmount) / 100;

  //   return appliedCoupon
  //     ? (originalPrice - discount).toFixed(2)
  //     : originalPrice;
  // };

  function getInstallmentPrice(planType) {
    const installment = installments.find((inst) => inst.planType === planType);
    if (installment) {
      return (
        installment.totalAmount / installment.numberOfInstallments
      ).toFixed(0);
    }
    console.warn(`⚠️ [getInstallmentPrice] No installment found for planType: ${planType}. Available plans:`, 
      installments.map(i => i.planType));
    return null; // Return null if no matching installment plan is found
  }

  function getTotalPrice(planType) {
    const installment = installments.find((inst) => inst.planType === planType);
    if (installment) {
      console.log(
        "Total Payable amount (Using getTotalPrice) : ",
        installment.totalAmount.toFixed(0)
      );
      return installment.totalAmount.toFixed(0);
    }
    console.warn(`⚠️ [getTotalPrice] No installment found for planType: ${planType}. Available plans:`, 
      installments.map(i => i.planType));
    return null; // Return null if no matching installment plan is found
  }

  console.log(appliedCoupon?.currentDiscount);

  const handleCouponApply = (
    couponCode,
    currentDiscount,
    discountType,
    discountValue
  ) => {
    const addedCoupon = {
      couponCode,
      currentDiscount,
      discountType,
      ...(discountType === "Percentage"
        ? { discountPercentage: discountValue }
        : { discountAmount: discountValue }),
    };
    // setAppliedCoupon({ couponCode, currentDiscount, discountType });
    setAppliedCoupon(addedCoupon);
    console.log("Applied coupon initial setup : ", appliedCoupon);
  };

  // Don't block the entire page - show loading only if we don't have course ID
  // If we have course ID, show the page structure and let subscriptions load in the background
  if (loading && !_id) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course information...</p>
        </div>
      </div>
    );
  }
  
  if (error) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
        <div className="text-red-500 mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-red-600 mb-2">Subscription Loading Error</h2>
        <p className="text-gray-600 mb-4">We couldn't load the subscription plans for this course.</p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700"><strong>Error:</strong> {error}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Possible causes:</strong><br/>
            • Subscription plans not configured for this course<br/>
            • Backend server issues<br/>
            • Network connectivity problems
          </p>
        </div>
        <div className="space-y-3">
          <button 
            onClick={() => {
              console.log('🔄 Retrying subscription fetch...');
              fetchSubscriptions();
              fetchInstallments(_id);
            }} 
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Retry Loading
          </button>
          <button 
            onClick={() => navigate('/explorecourses')} 
            className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            Browse Other Courses
          </button>
        </div>
      </div>
    </div>
  );
  
  if (!_id) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="text-yellow-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-800 font-semibold">No course found</p>
        <p className="text-gray-600 mt-2">Course ID is missing from the URL or navigation state.</p>
        <button 
          onClick={() => navigate('/explorecourses')} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Browse Courses
        </button>
      </div>
    </div>
  );

  const subscription = courseSubscriptions[0];
  
  // Enhanced debugging for subscription data
  console.log('🛒 BuyNowPage: Subscription Debug Info:', {
    courseSubscriptions,
    courseSubscriptionsLength: courseSubscriptions.length,
    subscription,
    subscriptionExists: !!subscription,
    validities: subscription?.validities,
    validitiesLength: subscription?.validities?.length,
    features: subscription?.features,
    course: subscription?.course,
    courseId: _id,
    allSubscriptions: subscriptions.map(sub => ({
      courseId: sub?.course?._id,
      courseTitle: sub?.course?.title,
      validitiesCount: sub?.validities?.length
    }))
  });
  
  // Fallback: If no subscription found but we have course data from location.state, show basic info
  const courseFromState = location.state;
  const hasCourseData = courseFromState && (courseFromState.title || courseFromState._id);
  
  const selectedValidityDetails = subscription?.validities?.find(
    (v) => v.validity === selectedValidity
  );

  // This calculation is also deprecated
  const finalPrice = appliedCoupon
    ? (
        selectedValidityDetails?.price -
        selectedValidityDetails?.discount -
        appliedCoupon?.currentDiscount
      ).toFixed(0)
    : selectedValidityDetails?.price - selectedValidityDetails?.discount;

  // Get GST and Internet Handling percentages from subscription
  const gstPercentage = subscription?.gst || 0;
  const internetHandlingPercentage = subscription?.internetHandling || 0;

  // Calculate GST per month on the base price per month
  const calculateGSTPerMonth = (basePricePerMonth) => {
    return (basePricePerMonth * (gstPercentage / 100)).toFixed(2);
  };

  // Calculate Internet handling charges per month on the base price per month
  const calculateInternetHandlingPerMonth = (basePricePerMonth) => {
    return (basePricePerMonth * (internetHandlingPercentage / 100)).toFixed(2);
  };

  // Calculate total charges per month
  const calculateTotalPerMonth = (basePricePerMonth) => {
    const gstPerMonth = parseFloat(calculateGSTPerMonth(basePricePerMonth));
    const handlingPerMonth = parseFloat(calculateInternetHandlingPerMonth(basePricePerMonth));
    return (basePricePerMonth + gstPerMonth + handlingPerMonth).toFixed(2);
  };

  // For backward compatibility (deprecated but still used in some places)
  const calculateInternetHandlingCharges = () => {
    if (!selectedValidityDetails) return "0.00";
    const basePrice = appliedCoupon 
      ? (selectedValidityDetails?.price - selectedValidityDetails?.discount - appliedCoupon?.currentDiscount)
      : (selectedValidityDetails?.price - selectedValidityDetails?.discount);
    return (basePrice * 0.025).toFixed(2);
  };
  
  const calculateGST = () => {
    if (!selectedValidityDetails) return "0.00";
    const basePrice = appliedCoupon 
      ? (selectedValidityDetails?.price - selectedValidityDetails?.discount - appliedCoupon?.currentDiscount)
      : (selectedValidityDetails?.price - selectedValidityDetails?.discount);
    return (basePrice * 0.18).toFixed(2);
  };

  // deprecated
  const calculateDiscountedPrice = () => {
    if (appliedCoupon) {
      const discount = appliedCoupon?.currentDiscount;

      return (selectedValidityDetails?.price - discount).toFixed(2);
    }
    return selectedValidityDetails?.price;
  };

  const fullPayAmount = calculateDiscountedPrice();

  const calculatePricePerMonth = (price, validity) =>
    parseInt(price / validity);

  // Calculate discounted price (after discount percentage, before GST and handling)
  // Discount is a percentage, so: price * (1 - discount/100)
  const getDiscountedPrice = () => {
    if (!selectedValidityDetails) return 0;
    const discountPercentage = selectedValidityDetails.discount || 0;
    // Calculate price after discount percentage is applied
    const discountedPrice = selectedValidityDetails.price * (1 - discountPercentage / 100);
    // Apply coupon discount if any
    const finalPrice = appliedCoupon 
      ? discountedPrice - (appliedCoupon.currentDiscount || 0)
      : discountedPrice;
    return finalPrice;
  };

  // Calculate discounted price per month (deprecated - kept for backward compatibility)
  // This is the actual price set (after discount) divided by validity months
  const calculateDiscountedPricePerMonth = () => {
    if (!selectedValidityDetails) return 0;
    const discountedPrice = getDiscountedPrice();
    const validity = selectedValidityDetails.validity || 1;
    return Math.round(discountedPrice / validity);
  };

  // Get the matching installment plan for selected validity
  const getSelectedInstallmentPlan = () => {
    if (!selectedValidity) return null;
    return installments.find(
      (inst) => inst.planType === `${selectedValidity} months`
    );
  };

  // Calculate discounted price per installment
  const calculateDiscountedPricePerInstallment = () => {
    const installmentPlan = getSelectedInstallmentPlan();
    if (!installmentPlan || !installmentPlan.numberOfInstallments) return 0;
    const discountedPrice = getDiscountedPrice();
    return Math.round(discountedPrice / installmentPlan.numberOfInstallments);
  };

  // Calculate GST per installment
  const calculateGSTPerInstallment = (basePricePerInstallment) => {
    return (basePricePerInstallment * (gstPercentage / 100)).toFixed(2);
  };

  // Calculate Internet handling charges per installment
  const calculateInternetHandlingPerInstallment = (basePricePerInstallment) => {
    return (basePricePerInstallment * (internetHandlingPercentage / 100)).toFixed(2);
  };

  // Calculate total charges per installment
  const calculateTotalPerInstallment = (basePricePerInstallment) => {
    const gstPerInstallment = parseFloat(calculateGSTPerInstallment(basePricePerInstallment));
    const handlingPerInstallment = parseFloat(calculateInternetHandlingPerInstallment(basePricePerInstallment));
    return (basePricePerInstallment + gstPerInstallment + handlingPerInstallment).toFixed(2);
  };

  console.log("demanded subcription data for this course : ", subscription);
  console.log(
    "demanded selectedValidityDetails data for this course : ",
    selectedValidityDetails
  );
  console.log("Initial Total", total);
  console.log("Initial coursePrice", coursePrice);
  console.log("Initial courseOldPrice ", courseOldPrice);

  // const calculateDiscountOnCoupon = (originalPrice) => {
  //   const discount =
  //     appliedCoupon?.discountType === "Flat"
  //       ? appliedCoupon.discountAmount
  //       : (originalPrice * appliedCoupon?.discountAmount) / 100;

  //   setAppliedCoupon((prev) => ({
  //     ...prev,
  //     discountAmount: discount,
  //   }));
  // };

  const calculateDiscountOnCoupon = (originalPrice) => {
    const discount =
      appliedCoupon.discountType === "Flat"
        ? appliedCoupon.discountAmount
        : (originalPrice * appliedCoupon.discountPercentage) / 100;

    setAppliedCoupon((prev) => ({
      ...prev,
      currentDiscount: discount,
    }));

    // console.log("Applied coupon on click : ", appliedCoupon);
  };

  // console.log("Applied coupon is here :", appliedCoupon);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <img src={Image1} alt="Logo" className="w-16 h-16 rounded-xl shadow-md" />
              <div>
                <h1 className="text-2xl font-bold text-[#023d50]">AKJ Classes</h1>
                <p className="text-sm text-gray-600">Choose Your Learning Plan</p>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="w-full px-6 sm:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-full">
          {/* Pricing Plans - Left Side (3 columns) */}
          <div className="lg:col-span-3 space-y-8">
            {/* Course Title & Description */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="text-center mb-4">
                <h2 className="text-3xl font-bold text-[#023d50] mb-3">
                  {subscription?.course?.title || 'Course Subscription'}
                </h2>
                <p className="text-gray-600 text-lg">
                  Choose the perfect plan for your learning journey
                </p>
              </div>
              
              {/* Plan Benefits - Compact */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-bold text-[#023d50] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Plan Benefits
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {subscription?.features?.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700 font-medium">{feature?.name}</span>
                    </div>
                  )) || (
                    <>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-700 font-medium">Live Classes</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-700 font-medium">PDF Notes</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-700 font-medium">Assignments</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-700 font-medium">Tests</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            {!planType && (
              <div className="space-y-6">
                {loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Plans...</h3>
                  <p className="text-gray-500">Please wait while we fetch your course plans.</p>
                </div>
              ) : !subscription ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Subscription Plans...</h3>
                  <p className="text-gray-500 mb-4">
                    {hasCourseData 
                      ? `We're fetching subscription plans for "${courseFromState?.title || 'this course'}". Please wait...`
                      : "We're currently setting up subscription plans for this course. Please check back later or contact support."
                    }
                  </p>
                  {hasCourseData && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
                      <p className="text-sm text-blue-800">
                        <strong>Course Info:</strong><br/>
                        • Course ID: {_id}<br/>
                        • Course Title: {courseFromState?.title || 'N/A'}<br/>
                        • Price: ₹{courseFromState?.price || 'N/A'}<br/>
                        • Subscriptions loaded: {subscriptions.length}<br/>
                        • Filtered subscriptions: {courseSubscriptions.length}
                      </p>
                    </div>
                  )}
                  <div className="space-x-2">
                    <button
                      onClick={() => {
                        console.log('🔄 Retrying subscription fetch...');
                        if (_id) {
                          fetchSubscriptions();
                          fetchInstallments(_id);
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 mr-2"
                    >
                      Retry Loading
                    </button>
                    <button
                      onClick={() => navigate(-1)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              ) : !subscription.validities || subscription.validities.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-orange-500 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Pricing Plans Configured</h3>
                  <p className="text-gray-500 mb-4">
                    This course has subscription data but no pricing plans (validities) are configured.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Technical Info:</strong><br/>
                      • Subscription found: {subscription ? 'Yes' : 'No'}<br/>
                      • Course ID: {_id}<br/>
                      • Validities array: {subscription?.validities ? 'Empty' : 'Missing'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        console.log('🔄 Retrying data fetch...');
                        fetchSubscriptions();
                        fetchInstallments(_id);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 mr-2"
                    >
                      Retry Loading
                    </button>
                    <button
                      onClick={() => navigate(-1)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
                ) : (
                 <>
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
                  {subscription.validities.map((validity, index) => {
                    const installmentPrice = getInstallmentPrice(
                      `${validity.validity} months`
                    );
                    const totalPrice = getTotalPrice(`${validity.validity} months`);
                    const price = subscription.course.price;
                    const oldPrice = subscription.course.oldPrice;
                    const isSelected = selectedValidity === validity.validity;
                    const isPopular = index === 1; // Make second plan popular

                    // 🔥 CRITICAL: If prices are not available, show course price as fallback
                    const displayTotalPrice = totalPrice || (price ? price.toFixed(0) : '0');
                    const displayInstallmentPrice = installmentPrice || (price && validity.validity ? (price / validity.validity).toFixed(0) : null);

                    return (
                      <div
                        key={validity.validity}
                        onClick={() => {
                          console.log("Course price from subscription:", subscription.course.price);
                          setSelectedValidity(validity.validity);
                          // Use totalPrice if available, otherwise use course price
                          setTotal(totalPrice || price || 0);
                          
                          // 🔥 Set the selected plan ID when validity is selected
                          const matchingPlan = installments.find(
                            inst => inst.planType === `${validity.validity} months`
                          );
                          if (matchingPlan?._id) {
                            setSelectedPlanId(matchingPlan._id.toString());
                            console.log(`✅ [BuyNowPage] Selected plan ID: ${matchingPlan._id} for ${validity.validity} months`);
                          } else {
                            console.warn(`⚠️ [BuyNowPage] No matching plan found for ${validity.validity} months`);
                          }
                          
                          if (appliedCoupon) {
                            calculateDiscountOnCoupon(totalPrice || price || 0);
                          }
                        }}
                         className={`relative rounded-xl p-6 border-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl min-h-[320px] ${
                           isSelected
                             ? 'border-[#0086b2] bg-gradient-to-br from-blue-50 to-cyan-50 shadow-xl'
                             : 'border-gray-200 bg-white hover:border-[#fc9721] shadow-md'
                         }`}
                      >
                        {isPopular && (
                          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <div className="bg-gradient-to-r from-[#fc9721] to-[#ff953a] text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Most Popular
                            </div>
                          </div>
                        )}

                        <div className="text-center mb-6">
                          <h3 className="text-xl font-bold text-[#023d50] mb-4">{validity.validity} Months</h3>
                          
                          {displayInstallmentPrice && displayInstallmentPrice !== displayTotalPrice && (
                            <div className="mb-4">
                              <div className="flex justify-center items-baseline gap-2 mb-1">
                                <span className="text-sm text-gray-600">From</span>
                                <span className="text-2xl font-bold text-[#0086b2]">₹{displayInstallmentPrice}</span>
                                <span className="text-xs text-gray-500">/installment</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-2">Total (incl. taxes)</p>
                            <div className="flex justify-center items-center gap-2 mb-3">
                              <span className="text-2xl font-bold text-[#023d50]">₹{displayTotalPrice}</span>
                              {oldPrice && oldPrice > parseFloat(displayTotalPrice) && (
                                <span className="text-lg text-gray-500 line-through">₹{oldPrice}</span>
                              )}
                            </div>
                            {oldPrice && oldPrice > parseFloat(displayTotalPrice) && (
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                {Math.round(((oldPrice - parseFloat(displayTotalPrice)) / oldPrice) * 100)}% OFF
                              </span>
                            )}
                            {displayTotalPrice && validity.validity && (
                              <div className="mt-3 text-xs text-gray-600">
                                ₹{Math.round(parseFloat(displayTotalPrice) / validity.validity)}/month
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          className={`w-full py-3 px-4 rounded-lg font-semibold text-base transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#0086b2] to-[#023d50] text-white'
                              : 'bg-gradient-to-r from-[#023d50] to-[#0086b2] text-white hover:from-[#fc9721] hover:to-[#ff953a]'
                          }`}
                        >
                            {isSelected ? "✓ Selected" : "Select Plan"}
                          </button>
                      </div>
                    );
                  })}
                  </div>
                </>
                )
              }
              </div>
            )}

          </div>

          {/* Order Summary - Right Side (1 column, sticky) */}
          <div className="lg:col-span-1">
            {selectedValidityDetails && !planType && (
              <div className="sticky top-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-[#023d50] mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Order Summary
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Selected Plan</span>
                    <span className="font-bold text-[#023d50]">{selectedValidityDetails.validity} Months</span>
                  </div>
                  
                  {/* Detailed Installment Breakdown */}
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3 border border-blue-200">
                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Installment Breakdown</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Base Price/Installment</span>
                        <span className="font-medium text-gray-800">
                          ₹{calculateDiscountedPricePerInstallment()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">GST ({gstPercentage}%)</span>
                        <span className="font-medium text-gray-800">
                          ₹{calculateGSTPerInstallment(calculateDiscountedPricePerInstallment())}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Handling ({internetHandlingPercentage}%)</span>
                        <span className="font-medium text-gray-800">
                          ₹{calculateInternetHandlingPerInstallment(calculateDiscountedPricePerInstallment())}
                        </span>
                      </div>
                      
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800 text-sm">Total/Installment</span>
                          <span className="font-bold text-[#023d50]">
                            ₹{calculateTotalPerInstallment(calculateDiscountedPricePerInstallment())}
                          </span>
                        </div>
                        {getSelectedInstallmentPlan() && (
                          <div className="text-xs text-gray-500 mt-1 text-center">
                            {getSelectedInstallmentPlan().numberOfInstallments} Installments
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="font-medium text-green-700 text-sm">Coupon Discount</span>
                      <span className="font-bold text-green-600">-₹{appliedCoupon.currentDiscount}</span>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-semibold text-gray-700">Total ({selectedValidityDetails.validity} months)</span>
                      <div className="text-right">
                        {appliedCoupon ? (
                          <>
                            <span className="text-xl font-bold text-[#023d50]">
                              ₹{(total - appliedCoupon.currentDiscount).toFixed(0)}
                            </span>
                            <div className="text-xs text-gray-500 line-through">₹{total}</div>
                          </>
                        ) : (
                          <span className="text-xl font-bold text-[#023d50]">₹{total}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Coupon Section */}
                  {!planType && selectedValidity && (
                    <div className="mt-4">
                      <ApplyCouponComponent
                        courseId={_id}
                        orderAmount={total}
                        onCouponApply={handleCouponApply}
                      />
                    </div>
                  )}

                  {/* Floating Proceed Button */}
                  <button
                    onClick={handleProceedToPay}
                    disabled={!selectedValidity || !subscription}
                    className={`w-full py-4 px-4 rounded-lg font-bold text-lg transition-all duration-300 shadow-lg mt-4 ${
                      selectedValidity && subscription
                        ? "bg-gradient-to-r from-[#023d50] via-[#0086b2] to-[#1D0D76] hover:from-[#1D0D76] hover:via-[#023d50] hover:to-[#0086b2] text-white transform hover:scale-105"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {selectedValidity ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Proceed to Payment
                      </div>
                    ) : (
                      "Select a Plan First"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Options Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#023d50]">Choose Payment Method</h2>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {!planType && (
                <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#023d50] mb-2">Full Payment</h3>
                      <p className="text-gray-600 text-sm">Pay the complete amount at once</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-4 p-3 bg-white rounded-lg">
                    <span className="font-medium text-gray-700">Total Amount</span>
                    <span className="text-2xl font-bold text-[#023d50]">
                      {appliedCoupon ? (
                        <>
                          ₹{(total - appliedCoupon?.currentDiscount).toFixed(0)}
                          <span className="text-sm text-gray-500 line-through ml-2">₹{total}</span>
                        </>
                      ) : (
                        `₹${total}`
                      )}
                    </span>
                  </div>
                  <Button
                    type="primary"
                    block
                    size="large"
                    onClick={handleBuyNow}
                    loading={paymentLoading}
                    className="bg-gradient-to-r from-[#023d50] to-[#0086b2] hover:from-[#0086b2] hover:to-[#023d50] border-none h-12 text-lg font-bold"
                  >
                    {paymentLoading ? "Processing..." : "Pay Now"}
                  </Button>
                </div>
              )}

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200 hover:border-green-400 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#023d50] mb-2">Pay in Installments</h3>
                    <p className="text-gray-600 text-sm">Split your payment into easy monthly installments</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsPaymentModalOpen(false); // Close payment modal
                    handleOpenInstallmentModal(); // Open installment modal
                  }}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  View Installment Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Installment Payment Modal */}
      {isInstallmentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#023d50]">Choose Installment Plan</h2>
                <button
                  onClick={() => setIsInstallmentModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* 🔥 CRITICAL: Show ALL installment plans with their amounts */}
              {installments.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-700 mb-2">No Installment Plans Available</p>
                  <p className="text-gray-500">Installment plans are not configured for this duration.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 🔥 CRITICAL: Show ALL plans, not just filtered ones - user can select any plan */}
                  {installments.map((installmentPlan) => {
                // Check if user is already enrolled - if so, use their original plan prices
                let userPurchasedCourse = null;
                let isEnrolledUser = false;
                
                if (userData?.purchasedCourses) {
                  userPurchasedCourse = userData.purchasedCourses.find((pc) => {
                    const courseIdStr = pc.course?.toString?.() || pc.course;
                    const currentCourseId = courseDetails?._id?.toString?.() || courseDetails?._id;
                    return courseIdStr === currentCourseId && pc.paymentType === 'installment';
                  });
                  
                  if (userPurchasedCourse?.installments && userPurchasedCourse.installments.length > 0) {
                    isEnrolledUser = true;
                  }
                }
                
                // Merge `userPayments` data with `installments`
                // For enrolled users, use original amounts from purchasedCourses
                // For new users, use current plan amounts
                const baseInstallments = isEnrolledUser && userPurchasedCourse?.installments
                  ? userPurchasedCourse.installments.map((userInst, idx) => {
                      const planInst = installmentPlan.installments[idx] || {};
                      return {
                        amount: userInst.amount, // Use original amount
                        dueDate: planInst.dueDate || `DOP + ${idx} month${idx > 1 ? 's' : ''}`,
                        isPaid: userInst.isPaid || false,
                        paidOn: userInst.paidDate || null,
                      };
                    })
                  : installmentPlan.installments;
                
                const installmentsWithUserStatus = baseInstallments.map((installment, index) => {
                  // Check if this installment has a matching `userPayment`
                  const userPayment = installmentPlan.userPayments?.find(
                    (payment) =>
                      payment.installmentIndex === index &&
                      payment.userId.toString() === userData.userId.toString()
                  );

                  return {
                    ...installment,
                    isPaid: userPayment ? userPayment.isPaid : (installment.isPaid || false),
                  };
                });
                
                // Calculate total and remaining amounts
                let planTotal = installmentPlan.totalAmount;
                let planRemaining = installmentPlan.remainingAmount;
                
                if (isEnrolledUser && userPurchasedCourse?.installments) {
                  // For enrolled users: Calculate from original installments
                  planTotal = userPurchasedCourse.installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
                  const paidAmount = userPurchasedCourse.installments
                    .filter(inst => inst.isPaid)
                    .reduce((sum, inst) => sum + (inst.amount || 0), 0);
                  planRemaining = planTotal - paidAmount;
                }

                // Find the first unpaid installment for payment eligibility
                const firstUnpaidInstallment = installmentsWithUserStatus.find(
                  (installment) => !installment.isPaid
                );

                const isSelected = selectedPlanId === installmentPlan._id?.toString();
                
                return (
                  <div
                    key={installmentPlan._id}
                    className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 transition-all ${
                      isSelected 
                        ? 'border-green-500 shadow-lg ring-4 ring-green-200' 
                        : 'border-blue-200 hover:border-blue-400'
                    }`}
                  >
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="mb-4 flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-bold">Selected Plan</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-[#023d50]">{installmentPlan.planType} Plan</h3>
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {installmentPlan.installments?.length || 0} Installments
                      </span>
                    </div>
                    {/* Total Amount Display */}
                    {planTotal && (
                      <div className="mb-4 p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-700 font-semibold">Total Amount:</span>
                          <span className="text-2xl font-bold text-[#023d50]">
                            ₹{Math.round(planTotal).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {planRemaining !== undefined && planRemaining !== null && (
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-gray-600">Remaining:</span>
                            <span className="text-lg font-semibold text-orange-600">
                              ₹{Math.round(planRemaining).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                        {isEnrolledUser && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <span className="text-xs text-gray-500 italic">
                              * Using your original enrollment prices
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Installment Timeline */}
                    <div className="mb-4 space-y-2">
                      {installmentsWithUserStatus.map((installment, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            installment.isPaid
                              ? 'bg-green-50 border-green-200'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              installment.isPaid
                                ? 'bg-green-500 text-white'
                                : 'bg-blue-500 text-white'
                            }`}>
                              {installment.isPaid ? '✓' : index + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">
                                Installment {index + 1}
                              </div>
                              <div className="text-sm text-gray-600">
                                Due: {installment.dueDate}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-[#023d50]">
                              ₹{Math.floor(installment.amount).toLocaleString('en-IN')}
                            </div>
                            <div className={`text-xs font-medium ${
                              installment.isPaid ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {installment.isPaid ? 'Paid' : 'Pending'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Select Plan Button (if not selected) or Payment Button */}
                    {!isSelected ? (
                      <button
                        onClick={() => {
                          setSelectedPlanId(installmentPlan._id.toString());
                          console.log(`✅ [BuyNowPage] Plan selected: ${installmentPlan.planType} (ID: ${installmentPlan._id})`);
                          // Save to localStorage for persistence
                          localStorage.setItem(`selectedPlan_${_id}`, installmentPlan._id.toString());
                          localStorage.setItem(`selectedPlanType_${_id}`, installmentPlan.planType);
                        }}
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg transform hover:scale-105 text-lg"
                      >
                        Select This Plan
                      </button>
                    ) : firstUnpaidInstallment ? (
                      <button
                        onClick={() =>
                          handlePayment({
                            courseDetails,
                            amount: firstUnpaidInstallment.amount,
                            courseId: installmentPlan.courseId,
                            userId: userData.userId,
                            planType: installmentPlan.planType,
                            installmentPlanId: installmentPlan._id, // 🔥 NEW: Pass plan ID
                            paymentMode: "installment",
                            installmentIndex:
                              installmentsWithUserStatus.indexOf(
                                firstUnpaidInstallment
                              ),
                            totalInstallments:
                              installmentsWithUserStatus.length,
                          })
                        }
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg transform hover:scale-105 text-lg"
                      >
                        Pay Installment {installmentsWithUserStatus.indexOf(firstUnpaidInstallment) + 1} - ₹{Math.floor(firstUnpaidInstallment.amount).toLocaleString('en-IN')}
                      </button>
                    ) : (
                      <div className="w-full py-4 bg-green-100 text-green-700 rounded-lg font-bold text-center">
                        ✅ All Installments Paid
                      </div>
                    )}
                  </div>
                );
              })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Price Summary Modal */}
      {/* {isPriceSummaryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-80">
            <h3 className="text-xl font-bold mb-4">Price Summary</h3>
            <ul className="text-gray-700 mb-4">
              <li className="flex justify-between">
                <span>Course price</span>
                <span>₹{courseOldPrice}</span>
              </li>
              <li className="flex justify-between">
                <span>Current price</span>
                <span>₹{coursePrice}</span>
              </li>
              {appliedCoupon && (
                <li className="flex justify-between">
                  <span>Coupon discount </span>
                  <span>- ₹{appliedCoupon?.currentDiscount}</span>
                </li>
              )}

              <li className="flex justify-between">
                <span>GST</span>
                <span>₹ {calculateGST()}</span>
              </li>
              <li className="flex justify-between">
                <span>Internet Handling Charges</span>
                <span>₹ {calculateInternetHandlingCharges()}</span>
              </li>
              <li className="flex justify-between font-bold border-t pt-2">
                <span>Amount Payable</span>
                <span>₹ {total}</span>
              </li>
            </ul>
            <button
              onClick={handleCloseModals}
              className="mt-4 w-full py-2 bg-blue-500 text-white rounded-lg font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )} */}

      {/* Loading Overlay for Payment Processing (only for payment, not enrollment) */}
      {paymentLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[9999]">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md mx-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Processing Payment</h2>
            <p className="text-gray-600">Please wait while we process your payment...</p>
          </div>
        </div>
      )}

      {/* Redirect Countdown Overlay */}
      {overlayVisible && !enrollmentChecking && !paymentLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
            <h2 className="text-2xl font-bold mb-2">Payment Successful</h2>
            <p className="text-lg text-gray-700 mb-2">
              Redirecting in {redirectCountdown} seconds...
            </p>
            <div className="py-4">
              <div className="flex flex-col items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                  Preparing your course
                </div>
              </div>
            </div>
            <p className="text-gray-500 text-sm">
              You will be redirected to the course shortly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyNowPage;
