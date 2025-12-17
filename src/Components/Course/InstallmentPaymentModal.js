import { notification, Timeline } from "antd";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import api from "../../api/axios";
import { usePayment } from "../../Context/PaymentContext";
import { useUser } from "../../Context/UserContext";
import PaymentReceipt from "./PaymentReceipt";

const InstallmentPaymentModal = ({ 
  isOpen, 
  onClose, 
  courseId, 
  courseTitle,
  coursePrice,
  installmentIndex = null, // Optional: specific installment index, if null will use next unpaid
  planType: propPlanType = null // Optional: plan type from parent
}) => {
  const { createOrder, initiatePayment, verifyPaymentSignature, loading: paymentLoading } = usePayment();
  const { userData, profileData, fetchUserProfile } = useUser();
  const [installmentDetails, setInstallmentDetails] = useState(null);
  const [nextInstallment, setNextInstallment] = useState(null);
  const [planType, setPlanType] = useState(propPlanType);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [planTotalAmount, setPlanTotalAmount] = useState(null);
  const [planRemainingAmount, setPlanRemainingAmount] = useState(null);
  const [ordersMap, setOrdersMap] = useState({}); // Store order details for each installment
  const [downloadingReceipt, setDownloadingReceipt] = useState(null); // Track which receipt is being downloaded
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false); // Track if we've attempted to fetch data

  // Fetch installment details
  useEffect(() => {
    const fetchInstallmentDetails = async () => {
      if (!isOpen || !courseId) return;

      setHasAttemptedFetch(true); // Mark that we've attempted to fetch
      setLoading(true);
      try {
        // 🔥 CRITICAL: Get user ID from userData or profileData (fallback)
        // userData has userId property, profileData has _id property
        const userId = userData?.userId || profileData?._id || null;
        
        // First, try to fetch user's timeline (if already enrolled)
        if (userId) {
          try {
            const timelineResponse = await api.get(
              `/admin/installments/${courseId}/user/${userId}/timeline`
            );
            const timeline = timelineResponse.data?.timeline || timelineResponse.data || [];
            if (timelineResponse.data?.totalAmount) {
              setPlanTotalAmount(timelineResponse.data.totalAmount);
            }
            if (timelineResponse.data?.remainingAmount !== undefined) {
              setPlanRemainingAmount(timelineResponse.data.remainingAmount);
            }
            
            if (timeline.length > 0) {
              // Calculate totalAmount from installments if not provided
              if (!planTotalAmount) {
                const calculatedTotal = timeline.reduce((sum, inst) => sum + (inst.amount || 0), 0);
                if (calculatedTotal > 0) {
                  setPlanTotalAmount(calculatedTotal);
                }
              }
              
              // Calculate remainingAmount if not provided
              if (planRemainingAmount === null) {
                const paidAmount = timeline.filter(inst => inst.isPaid).reduce((sum, inst) => sum + (inst.amount || 0), 0);
                const calculatedRemaining = (planTotalAmount || 0) - paidAmount;
                if (calculatedRemaining >= 0) {
                  setPlanRemainingAmount(calculatedRemaining);
                }
              }
              // Fetch orders to verify both status and isPaid for timeline installments
              let ordersMapForTimeline = {};
              const fullOrdersMapForTimeline = {};
              try {
                // Use the userId we got earlier (from userData or profileData)
                if (userId && courseId) {
                  const ordersResponse = await api.get(`/admin/orders/paid`);
                  const paidOrders = ordersResponse.data?.data || [];
                  
                  const userCourseOrders = paidOrders.filter(order => {
                    const orderUserId = order.userId?._id?.toString?.() || order.userId?.toString?.() || order.userId;
                    const orderCourseId = order.courseId?._id?.toString?.() || order.courseId?.toString?.() || order.courseId;
                    const currentUserId = userId?.toString?.() || userId;
                    const currentCourseId = courseId?.toString?.() || courseId;
                    
                    return orderUserId === currentUserId && 
                           orderCourseId === currentCourseId && 
                           order.paymentMode === 'installment';
                  });
                  
                  userCourseOrders.forEach(order => {
                    if (order.installmentDetails && 
                        order.installmentDetails.installmentIndex !== undefined) {
                      const idx = order.installmentDetails.installmentIndex;
                      const isFullyPaid = order.status === "paid" && 
                                          order.installmentDetails.isPaid === true;
                      if (isFullyPaid) {
                        ordersMapForTimeline[idx] = true;
                        
                        // Store full order details for receipt generation
                        fullOrdersMapForTimeline[idx] = {
                          orderId: order.orderId,
                          paymentId: order.paymentId,
                          receipt: order.receipt,
                          trackingNumber: order.trackingNumber,
                          amount: order.amount / 100, // Convert from paise to rupees
                          paymentDate: order.paidAt || order.updatedAt || order.createdAt,
                          createdAt: order.createdAt,
                          updatedAt: order.updatedAt
                        };
                      }
                    }
                  });
                  
                  // Update orders map state
                  setOrdersMap(prev => ({ ...prev, ...fullOrdersMapForTimeline }));
                }
              } catch (ordersError) {
                console.warn("Could not fetch orders for timeline:", ordersError);
              }
              
              // Check if user is enrolled and has original installments
              let userPurchasedCourse = null;
              if (userData?.purchasedCourses) {
                userPurchasedCourse = userData.purchasedCourses.find((pc) => {
                  const courseIdStr = pc.course?.toString?.() || pc.course;
                  const currentCourseId = courseId?.toString?.() || courseId;
                  return courseIdStr === currentCourseId && pc.paymentType === 'installment';
                });
              }
              
              // Ensure each installment has proper structure
              // Check BOTH: status === "paid" AND installmentDetails.isPaid === true
              // 🔥 CRITICAL: For enrolled users, ALWAYS use original amounts from purchasedCourses
              const formattedTimeline = timeline.map((inst, idx) => {
                const installmentIdx = inst.installmentIndex !== undefined ? inst.installmentIndex : idx;
                // Verify with orders if available, otherwise use timeline data
                const verifiedIsPaid = ordersMapForTimeline[installmentIdx] !== undefined
                  ? ordersMapForTimeline[installmentIdx]
                  : (inst.isPaid === true || inst.isPaid === "true");
                
                // 🔥 CRITICAL: For enrolled users, ALWAYS use original amount from purchasedCourses
                // This ensures users keep their original plan prices even if admin changes the plan
                let installmentAmount = inst.amount;
                if (userPurchasedCourse?.installments && userPurchasedCourse.installments.length > 0) {
                  // Find installment by installmentNumber (1-based) or by index
                  const savedInstallment = userPurchasedCourse.installments.find(
                    savedInst => savedInst.installmentNumber === (idx + 1) || 
                                 (savedInst.installmentNumber === inst.installmentNumber && inst.installmentNumber)
                  ) || userPurchasedCourse.installments[idx];
                  
                  if (savedInstallment?.amount) {
                    installmentAmount = savedInstallment.amount;
                  }
                }
                
                return {
                  ...inst,
                  amount: installmentAmount, // 🔒 Original amount for enrolled users
                  installmentIndex: installmentIdx,
                  isPaid: verifiedIsPaid,
                  paymentDate: inst.paymentDate || inst.paidDate || null,
                  paidDate: inst.paymentDate || inst.paidDate || null,
                };
              });
            setInstallmentDetails(formattedTimeline);
            
            // Get plan type from timeline
            if (formattedTimeline.length > 0) {
              // 🔥 CRITICAL: Priority order for planType:
              // 1. From timeline (most accurate for enrolled users)
              // 2. From user's purchasedCourses
              // 3. From propPlanType
              // 4. Default fallback
              let planTypeFromTimeline = formattedTimeline[0]?.planType;
              let planTypeFromPurchased = null;
              
              // Try to get from purchasedCourses if not in timeline
              if (!planTypeFromTimeline && userPurchasedCourse?.planType) {
                planTypeFromPurchased = userPurchasedCourse.planType;
              }
              
              const finalPlanType = planTypeFromTimeline || planTypeFromPurchased || propPlanType || "Standard";
              setPlanType(finalPlanType);
              
              // Calculate totalAmount and remainingAmount
              if (userPurchasedCourse?.installments && userPurchasedCourse.installments.length > 0) {
                // For enrolled users: Use original amounts from purchasedCourses
                const originalTotal = userPurchasedCourse.installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
                const paidAmount = userPurchasedCourse.installments
                  .filter(inst => inst.isPaid)
                  .reduce((sum, inst) => sum + (inst.amount || 0), 0);
                const remaining = originalTotal - paidAmount;
                
                setPlanTotalAmount(originalTotal);
                setPlanRemainingAmount(remaining);
              } else {
                // For new users: Calculate from timeline
                if (!planTotalAmount) {
                  const calculatedTotal = formattedTimeline.reduce((sum, inst) => sum + (inst.amount || 0), 0);
                  if (calculatedTotal > 0) {
                    setPlanTotalAmount(calculatedTotal);
                  }
                }
                
                if (planRemainingAmount === null) {
                  const paidAmount = formattedTimeline.filter(inst => inst.isPaid).reduce((sum, inst) => sum + (inst.amount || 0), 0);
                  const calculatedRemaining = (planTotalAmount || 0) - paidAmount;
                  if (calculatedRemaining >= 0) {
                    setPlanRemainingAmount(calculatedRemaining);
                  }
                }
              }
            }
              
              // Find next unpaid installment
              let unpaidInstallment = null;
              if (installmentIndex !== null) {
                // Use specific installment index
                unpaidInstallment = formattedTimeline.find(
                  (inst, idx) => idx === installmentIndex && !inst.isPaid
                );
              } else {
                // Find first unpaid installment
                unpaidInstallment = formattedTimeline.find((inst) => !inst.isPaid);
              }
              
              // 🔥 CRITICAL: Check if all installments are paid
              const allPaid = formattedTimeline.length > 0 && formattedTimeline.every(inst => inst.isPaid === true);
              if (allPaid) {
                setNextInstallment(null); // All paid - no next installment
              } else {
                setNextInstallment(unpaidInstallment);
              }
              setLoading(false);
              return; // Successfully loaded timeline, exit early
            }
          } catch (timelineError) {
            console.log("Timeline not available (user may not be enrolled yet), fetching plans...", timelineError);
            // Continue to fetch plans if timeline fails
          }
        }
        // If timeline is not available, fetch installment plans for the course directly
        try {
          const plansResponse = await api.get(`/admin/installments/${courseId}`);
          const plansData = plansResponse.data?.data || plansResponse.data || [];
          
          
          if (Array.isArray(plansData) && plansData.length > 0) {
            // 🔥 CRITICAL: Priority order for plan selection:
            // 1. propPlanType (from parent component)
            // 2. planType from user's purchasedCourses (most reliable for enrolled users)
            // 3. First plan as fallback
            
            // 🔥 CRITICAL: Priority order for planType:
            // 1. propPlanType (from parent component - most reliable)
            // 2. planType from user's purchasedCourses (for enrolled users)
            // 3. First plan as fallback (only for new users)
            
            let planTypeToUse = propPlanType;
            let userPurchasedCourse = null;
            
            // Get user's purchasedCourse to check planType
            if (userData?.purchasedCourses) {
              userPurchasedCourse = userData.purchasedCourses.find((pc) => {
                const courseIdStr = pc.course?.toString?.() || pc.course;
                const currentCourseId = courseId?.toString?.() || courseId;
                return courseIdStr === currentCourseId && pc.paymentType === 'installment';
              });
              
              // If propPlanType is not provided, use planType from purchasedCourses
              if (!planTypeToUse && userPurchasedCourse?.planType) {
                planTypeToUse = userPurchasedCourse.planType;
              }
            }
            
            // Filter or select the plan based on planTypeToUse
            let selectedPlan = null;
            
            if (planTypeToUse) {
              // Try to find exact match first
              const foundPlan = plansData.find(
                (plan) => plan.planType === planTypeToUse
              );
              
              if (foundPlan) {
                selectedPlan = foundPlan;
              } else {
                // If exact match not found, try case-insensitive match
                const caseInsensitiveMatch = plansData.find(
                  (plan) => plan.planType?.toLowerCase() === planTypeToUse?.toLowerCase()
                );
                
                if (caseInsensitiveMatch) {
                  selectedPlan = caseInsensitiveMatch;
                } else {
                  console.error(`❌ [InstallmentPaymentModal] Plan with planType "${planTypeToUse}" not found in available plans!`);
                  console.error(`❌ [InstallmentPaymentModal] Available plans:`, plansData.map(p => p.planType));
                  
                  // 🔥 CRITICAL: For enrolled users, we MUST find the correct plan - don't fallback to wrong plan
                  if (userPurchasedCourse && userPurchasedCourse.installments && userPurchasedCourse.installments.length > 0) {
                    // User is enrolled - try to match by installment amounts
                    const userFirstAmount = userPurchasedCourse.installments[0]?.amount;
                    const matchingPlan = plansData.find(p => {
                      if (!p.installments || p.installments.length !== userPurchasedCourse.installments.length) {
                        return false;
                      }
                      return p.installments[0]?.amount === userFirstAmount;
                    });
                    
                    if (matchingPlan) {
                      selectedPlan = matchingPlan;
                    } else {
                      console.error(`❌ [InstallmentPaymentModal] Could not find matching plan even by amount!`);
                      // Don't select wrong plan - return error state
                      throw new Error(`Your enrolled plan (${planTypeToUse}) is not available. Please contact support.`);
                    }
                  } else {
                    // New user - can use first plan as fallback
                    selectedPlan = plansData[0];
                    console.warn(`⚠️ [InstallmentPaymentModal] Plan "${planTypeToUse}" not found, using first plan as fallback: ${selectedPlan.planType}`);
                  }
                }
              }
            } else {
              // No planType specified - use first plan (only for new users)
              selectedPlan = plansData[0];
            }
            
            // Fetch user's orders for this course to check both status and installmentDetails.isPaid
            const ordersMap = {};
            try {
              // Use the userId we got earlier (from userData or profileData)
              const currentUserId = userId || userData?.userId || profileData?._id;
              if (currentUserId && courseId) {
                const ordersResponse = await api.get(`/admin/orders/paid`);
                const paidOrders = ordersResponse.data?.data || [];
                
                // Filter orders for this user and course
                const userCourseOrders = paidOrders.filter(order => {
                  const orderUserId = order.userId?._id?.toString?.() || order.userId?.toString?.() || order.userId;
                  const orderCourseId = order.courseId?._id?.toString?.() || order.courseId?.toString?.() || order.courseId;
                  const userIdStr = currentUserId?.toString?.() || currentUserId;
                  const currentCourseId = courseId?.toString?.() || courseId;
                  
                  return orderUserId === userIdStr && 
                         orderCourseId === currentCourseId && 
                         order.paymentMode === 'installment';
                });
                
                // Map orders by installmentIndex - store full order details for receipts
                const fullOrdersMap = {};
                userCourseOrders.forEach(order => {
                  if (order.installmentDetails && 
                      order.installmentDetails.installmentIndex !== undefined) {
                    const idx = order.installmentDetails.installmentIndex;
                    // Check BOTH conditions: status === "paid" AND installmentDetails.isPaid === true
                    const isFullyPaid = order.status === "paid" && 
                                        order.installmentDetails.isPaid === true;
                    
                    if (isFullyPaid) {
                      ordersMap[idx] = {
                        ...ordersMap[idx],
                        isPaid: true,
                        orderStatus: order.status,
                        installmentIsPaid: order.installmentDetails.isPaid,
                        paymentDate: order.updatedAt || order.createdAt,
                        paidDate: order.updatedAt || order.createdAt,
                      };
                      
                      // Store full order details for receipt generation
                      fullOrdersMap[idx] = {
                        orderId: order.orderId,
                        paymentId: order.paymentId,
                        receipt: order.receipt,
                        trackingNumber: order.trackingNumber,
                        amount: order.amount / 100, // Convert from paise to rupees
                        paymentDate: order.paidAt || order.updatedAt || order.createdAt,
                        createdAt: order.createdAt,
                        updatedAt: order.updatedAt
                      };
                    }
                  }
                });
                
                // Store full orders map in state for receipt generation
                setOrdersMap(fullOrdersMap);
              }
            } catch (ordersError) {
              console.warn("Could not fetch orders, continuing with other payment sources:", ordersError);
            }
            
            // Merge userPayments with installments to show paid status
            // Also check user's purchasedCourses for paid installments
            const userPaymentsMap = {};
            if (selectedPlan.userPayments && Array.isArray(selectedPlan.userPayments)) {
              selectedPlan.userPayments.forEach((payment) => {
                // Compare user IDs (handle both string and ObjectId)
                const paymentUserId = payment.userId?.toString?.() || payment.userId;
                const currentUserId = (userId || userData?.userId || profileData?._id)?.toString?.() || (userId || userData?.userId || profileData?._id);
                
                // Match if user IDs match
                if (paymentUserId === currentUserId) {
                  userPaymentsMap[payment.installmentIndex] = payment;
                }
              });
            }
            
            // Check if user is already enrolled - if so, use their original plan prices
            let enrolledUserPurchasedCourse = null;
            let userOriginalInstallments = null;
            let isEnrolledUser = false;
            
            if (userData?.purchasedCourses) {
              enrolledUserPurchasedCourse = userData.purchasedCourses.find((pc) => {
                const courseIdStr = pc.course?.toString?.() || pc.course;
                const currentCourseId = courseId?.toString?.() || courseId;
                return courseIdStr === currentCourseId && pc.paymentType === 'installment';
              });
              
              if (userPurchasedCourse?.installments && userPurchasedCourse.installments.length > 0) {
                isEnrolledUser = true;
                userOriginalInstallments = userPurchasedCourse.installments;
                
                // Build user payments map from purchasedCourses (original amounts)
                userOriginalInstallments.forEach((inst) => {
                  // installmentNumber is 1-based, installmentIndex is 0-based
                  const idx = (inst.installmentNumber || 1) - 1;
                  userPaymentsMap[idx] = {
                    ...userPaymentsMap[idx],
                    isPaid: inst.isPaid === true,
                    paymentDate: inst.paidDate || inst.paymentDate,
                    paidDate: inst.paidDate || inst.paymentDate,
                    originalAmount: inst.amount, // Store original amount
                  };
                });
              } else if (userPurchasedCourse) {
                // User has course but no installments yet (first payment pending)
                isEnrolledUser = true;
              }
            }
            
            // Convert plan installments to timeline format with paid status
            // 🔥 CRITICAL: For enrolled users, ALWAYS use original amounts from purchasedCourses
            // For new users, use current plan amounts
            const baseInstallments = isEnrolledUser && userOriginalInstallments && userOriginalInstallments.length > 0
              ? userOriginalInstallments.map((inst, idx) => ({
                  amount: inst.amount, // 🔒 Use original amount locked in at enrollment
                  dueDate: selectedPlan.installments?.[idx]?.dueDate || `DOP + ${idx} month${idx > 1 ? 's' : ''}`,
                  isPaid: inst.isPaid || false,
                  paidOn: inst.paidDate || null,
                  installmentNumber: inst.installmentNumber || (idx + 1),
                }))
              : (selectedPlan.installments || []).map((inst, idx) => ({
                  ...inst,
                  installmentNumber: idx + 1,
                }));
            
            const timeline = baseInstallments.map((inst, idx) => {
              // Priority: Use API response isPaid first, then check orders, then userPayments
              const orderPayment = ordersMap[idx];
              const userPayment = userPaymentsMap[idx];
              
              // Check if paid - Priority order:
              // 1. Direct from API response (selectedPlan.installments[idx].isPaid) - MOST RELIABLE
              // 2. From orders (status === "paid" AND installmentDetails.isPaid === true)
              // 3. From userPayments (for backward compatibility)
              let isPaid = false;
              
              // First priority: Check API response directly
              if (inst.isPaid === true || inst.isPaid === "true") {
                isPaid = true;
              } else if (orderPayment) {
                // Second priority: Order payment - Both status and isPaid must be true
                isPaid = orderPayment.orderStatus === "paid" && 
                         orderPayment.installmentIsPaid === true;
              } else if (userPayment) {
                // Third priority: Fallback to userPayments (for backward compatibility)
                isPaid = userPayment.isPaid === true || userPayment.isPaid === "true";
              }
              
              // Get payment date (handle both Date objects and ISO strings)
              // Priority: API response paidOn > orderPayment > userPayment
              let paymentDate = null;
              if (inst.paidOn) {
                // First priority: Use paidOn from API response
                paymentDate = inst.paidOn instanceof Date 
                  ? inst.paidOn.toISOString() 
                  : inst.paidOn;
              } else if (orderPayment?.paymentDate) {
                paymentDate = orderPayment.paymentDate instanceof Date 
                  ? orderPayment.paymentDate.toISOString() 
                  : orderPayment.paymentDate;
              } else if (userPayment?.paymentDate) {
                paymentDate = userPayment.paymentDate instanceof Date 
                  ? userPayment.paymentDate.toISOString() 
                  : userPayment.paymentDate;
              } else if (userPayment?.paidDate) {
                paymentDate = userPayment.paidDate instanceof Date 
                  ? userPayment.paidDate.toISOString() 
                  : userPayment.paidDate;
              }
              
              return {
                ...inst,
                installmentIndex: idx,
                isPaid: isPaid,
                paymentDate: paymentDate,
                paidDate: paymentDate,
                dueDate: inst.dueDate || null
              };
            });
            
            setInstallmentDetails(timeline);
            setPlanType(selectedPlan.planType || propPlanType || "Standard");
            
            // Calculate total and remaining amounts
            if (isEnrolledUser && userOriginalInstallments) {
              // For enrolled users: Use original plan total from their installments
              const originalTotal = userOriginalInstallments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
              const paidAmount = userOriginalInstallments
                .filter(inst => inst.isPaid)
                .reduce((sum, inst) => sum + (inst.amount || 0), 0);
              const remaining = originalTotal - paidAmount;
              
              setPlanTotalAmount(originalTotal);
              setPlanRemainingAmount(remaining);
              
            } else {
              // For new users: Use current plan amounts
              if (selectedPlan.totalAmount) {
                setPlanTotalAmount(selectedPlan.totalAmount);
              }
              if (selectedPlan.remainingAmount !== undefined) {
                setPlanRemainingAmount(selectedPlan.remainingAmount);
              } else {
                // Calculate remaining from timeline if not provided
                const paidAmount = timeline.filter(inst => inst.isPaid).reduce((sum, inst) => sum + (inst.amount || 0), 0);
                const total = timeline.reduce((sum, inst) => sum + (inst.amount || 0), 0);
                setPlanRemainingAmount(total - paidAmount);
              }
            }
            
            // Use nextDueInstallment from API if available, otherwise find first unpaid
            let unpaidInstallment = null;
            if (selectedPlan.nextDueInstallment) {
              // Use the nextDueInstallment from API response (most reliable)
              const nextDueIdx = selectedPlan.installments.findIndex(
                inst => inst._id?.toString() === selectedPlan.nextDueInstallment._id?.toString() ||
                        (inst.amount === selectedPlan.nextDueInstallment.amount && 
                         inst.dueDate === selectedPlan.nextDueInstallment.dueDate)
              );
              if (nextDueIdx !== -1) {
                unpaidInstallment = timeline[nextDueIdx] || null;
              }
            }
            
            // Fallback: Find first unpaid installment from timeline
            if (!unpaidInstallment) {
              unpaidInstallment = timeline.find((inst) => !inst.isPaid) || null;
            }
            
            // 🔥 CRITICAL: Only set nextInstallment if there's an unpaid installment
            // Check if all installments are paid
            const allPaid = timeline.length > 0 && timeline.every(inst => inst.isPaid === true);
            if (allPaid) {
              setNextInstallment(null); // All paid - no next installment
            } else {
              setNextInstallment(unpaidInstallment);
            }
            
            setLoading(false);
          } else {
            console.warn("⚠️ No installment plans found for course:", courseId);
            console.warn("⚠️ plansData:", plansData);
            // Don't set empty array - let it stay null so we can close modal
            setInstallmentDetails(null);
            setLoading(false);
            // Close modal if no plans found
            setTimeout(() => {
              onClose();
            }, 100);
          }
        } catch (plansError) {
          console.error("❌ Error fetching installment plans:", plansError);
          console.error("❌ Error details:", plansError.response?.data);
          // Don't show error notification - just close modal
          setInstallmentDetails(null);
          setLoading(false);
          // Close modal on error
          setTimeout(() => {
            onClose();
          }, 100);
        }
        
      } catch (error) {
        console.error("Error fetching installment details:", error);
        // Only show error if it's a critical error, not just because timeline doesn't exist
        if (error.response?.status !== 404) {
          notification.error({
            message: "Error",
            description: error.response?.data?.message || "Failed to load installment details. Please try again.",
          });
        }
        setLoading(false);
      }
    };

    fetchInstallmentDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, courseId, userData?.userId, profileData?._id, installmentIndex, propPlanType]);

  // Listen for timeline update events (after payment) to refresh data
  useEffect(() => {
    if (!isOpen || !courseId) return;

    const handleTimelineUpdate = async (event) => {
      const eventCourseId = event.detail?.courseId;
      const eventUserId = event.detail?.userId;
      const currentUserId = userData?.userId || profileData?._id;
      
      // Only refresh if this event is for the current course and user
      if (eventCourseId?.toString() === courseId?.toString() && 
          eventUserId?.toString() === currentUserId?.toString()) {
        
        // Wait a bit for backend to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Re-fetch installment details
        try {
          const userId = userData?.userId || profileData?._id;
          if (userId && courseId) {
            const timelineResponse = await api.get(
              `/admin/installments/${courseId}/user/${userId}/timeline`
            );
            const timeline = timelineResponse.data?.timeline || timelineResponse.data || [];
            if (timeline.length > 0) {
              setInstallmentDetails(timeline);
              
              // Find next unpaid installment
              const unpaidInstallment = timeline.find((inst) => !inst.isPaid);
              setNextInstallment(unpaidInstallment || null);
              
              // Update amounts
              if (timelineResponse.data?.totalAmount) {
                setPlanTotalAmount(timelineResponse.data.totalAmount);
              }
              if (timelineResponse.data?.remainingAmount !== undefined) {
                setPlanRemainingAmount(timelineResponse.data.remainingAmount);
              }
            }
          }
        } catch (error) {
          console.error("Error refreshing installment details from event:", error);
        }
      }
    };

    window.addEventListener('installmentTimelineUpdated', handleTimelineUpdate);
    
    return () => {
      window.removeEventListener('installmentTimelineUpdated', handleTimelineUpdate);
    };
  }, [isOpen, courseId, userData?.userId, profileData?._id]);

  // Auto-close modal if installmentDetails is null or empty after loading
  // BUT only if we've actually tried to fetch (not on initial mount)
  useEffect(() => {
    // Only close if:
    // 1. Modal is open
    // 2. We've attempted to fetch data (not just initial mount)
    // 3. Loading is done
    // 4. We have no data
    if (isOpen && hasAttemptedFetch && !loading) {
      const hasNoData = !installmentDetails || (Array.isArray(installmentDetails) && installmentDetails.length === 0);
      if (hasNoData) {
        // Close immediately
        onClose();
      } else {
        console.log("✅ Installment details found, keeping modal open:", installmentDetails?.length, "items");
      }
    }
  }, [installmentDetails, loading, isOpen, hasAttemptedFetch, onClose]);

  // Reset hasAttemptedFetch when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasAttemptedFetch(false);
    }
  }, [isOpen]);

  // Helper function to format due date display
  const formatDueDate = (dueDate) => {
    if (!dueDate) return "N/A";
    
    // If it's in "DOP + X months" format, show it as is
    if (typeof dueDate === 'string' && dueDate.includes('DOP')) {
      return dueDate; // Show "DOP" or "DOP + 1 month" as is
    }
    
    // If it's a date string, format it
    try {
      const date = new Date(dueDate);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    } catch {
      // If parsing fails, return as is
    }
    
    return dueDate;
  };

  // Ensure Razorpay script is loaded
  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, []);

  const handlePayment = async () => {
    if (!nextInstallment) {
      notification.error({
        message: "Error",
        description: "No installment found to pay.",
      });
      return;
    }

    // Try to get userData from multiple sources (priority order)
    let currentUserData = userData || profileData;
    
    // Helper function to check if userData has a valid user ID
    const hasValidUserId = (data) => {
      return data && (data.userId || data._id);
    };
    
    // Helper function to get user ID from data
    const getUserId = (data) => {
      return data?.userId || data?._id || null;
    };
    
    // If userData/profileData is not available, try to get it from localStorage
    if (!hasValidUserId(currentUserData)) {
      try {
        const storedUserData = localStorage.getItem("userData");
        if (storedUserData) {
          const parsed = JSON.parse(storedUserData);
          if (parsed && (parsed.userId || parsed._id)) {
            currentUserData = parsed;
          }
        }
      } catch (error) {
        console.warn("Could not parse userData from localStorage:", error);
      }
    }
    
    // If still not available, try to fetch user profile
    if (!hasValidUserId(currentUserData)) {
      try {
        const fetchedProfile = await fetchUserProfile();
        if (fetchedProfile && (fetchedProfile.userId || fetchedProfile._id)) {
          currentUserData = fetchedProfile;
          console.log("✅ Retrieved userData from fetchUserProfile:", currentUserData);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    }
    
    // Try to get user ID from token if still not available
    if (!hasValidUserId(currentUserData)) {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          // Try to decode token to get user ID (if token contains user info)
          const decoded = jwtDecode(token);
          if (decoded && decoded.id) {
            currentUserData = { userId: decoded.id }; // Use userId to match userData structure
          }
        }
      } catch (error) {
        console.warn("Could not decode token:", error);
      }
    }
    
    // Final check - if still no userData, show error
    if (!hasValidUserId(currentUserData)) {
      console.error("❌ User data not available after all attempts:", { 
        userData, 
        profileData,
        localStorage: localStorage.getItem("userData"),
        hasToken: !!localStorage.getItem("token")
      });
      notification.error({
        message: "Error",
        description: "User information is not loaded. Please refresh the page and try again.",
      });
      return;
    }

    // Check userData and courseId more thoroughly
    const userId = getUserId(currentUserData)?.toString?.() || getUserId(currentUserData);
    const currentCourseId = courseId?.toString?.() || courseId;
    if (!userId || !currentCourseId) {
      console.error("❌ Payment validation failed:", {
        userId,
        currentCourseId,
        userData: userData ? { userId: userData.userId, hasPurchasedCourses: !!userData.purchasedCourses } : null,
        courseId
      });
      notification.error({
        message: "Error",
        description: `User or course information is missing. ${!userId ? 'User ID missing. ' : ''}${!currentCourseId ? 'Course ID missing.' : ''}`,
      });
      return;
    }

    setProcessing(true);
    try {
      // Use the installmentIndex from the installment object, or calculate from position
      const actualInstallmentIndex = nextInstallment.installmentIndex !== undefined 
        ? nextInstallment.installmentIndex 
        : installmentDetails?.findIndex(inst => inst === nextInstallment) || 0;

      // Create Razorpay order
      const orderData = await createOrder({
        amount: nextInstallment.amount,
        courseId: currentCourseId,
        userId: userId,
        planType: planType || "Standard",
        paymentMode: "installment",
        installmentIndex: actualInstallmentIndex,
        totalInstallments: installmentDetails?.length || 0,
      });

      // Initiate Razorpay payment
      const paymentResponse = await initiatePayment(orderData);

      // Verify payment signature
      const verificationResult = await verifyPaymentSignature(paymentResponse);

      if (verificationResult.success) {
        notification.success({
          message: "Payment Successful!",
          description: `Your ${actualInstallmentIndex + 1}${actualInstallmentIndex === 0 ? 'st' : actualInstallmentIndex === 1 ? 'nd' : actualInstallmentIndex === 2 ? 'rd' : 'th'} installment has been paid successfully.`,
          duration: 5,
        });

        // 🔥 IMMEDIATE UI UPDATE: Update installment details state immediately (optimistic update)
        if (installmentDetails && installmentDetails.length > 0) {
          const updatedInstallments = installmentDetails.map((inst, idx) => {
            if (idx === actualInstallmentIndex) {
              return {
                ...inst,
                isPaid: true,
                paymentDate: new Date().toISOString(),
                paidDate: new Date().toISOString(),
              };
            }
            return inst;
          });
          
          // Update state immediately
          setInstallmentDetails(updatedInstallments);
          
          // Update next installment (find first unpaid)
          const nextUnpaid = updatedInstallments.find((inst) => !inst.isPaid);
          setNextInstallment(nextUnpaid || null);
          
          // Update remaining amount
          const paidAmount = updatedInstallments
            .filter(inst => inst.isPaid)
            .reduce((sum, inst) => sum + (inst.amount || 0), 0);
          if (planTotalAmount) {
            setPlanRemainingAmount(planTotalAmount - paidAmount);
          }
          
        }

        // 🔥 CRITICAL: Force refresh profile to get updated payment status (background)
        const refreshProfileWithRetry = async () => {
          const maxRetries = 3;
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              
              // Force refresh profile
              await fetchUserProfile(true);
              
              // Wait a bit for backend to process
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              
              // Check if profile was updated
              const updatedProfile = await fetchUserProfile(true);
              if (updatedProfile) {
                return true;
              }
            } catch (error) {
              console.error(`⚠️ Profile refresh attempt ${attempt} failed:`, error);
              if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
          return false;
        };
        
        // Refresh profile in background (don't block UI)
        refreshProfileWithRetry().then((success) => {
          if (success) {
            console.log("✅ Profile refresh completed");
          } else {
            console.warn("⚠️ Profile refresh failed after retries, but payment was successful");
          }
        });
       
        // Trigger global profile update event for all components
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('profileUpdated', { 
            detail: { reason: 'installment_payment_success', courseId: currentCourseId, installmentIndex: actualInstallmentIndex } 
          }));
        }
        
        // Trigger timeline refresh event
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('installmentTimelineUpdated', { 
            detail: { courseId: currentCourseId, userId: userId } 
          }));
        }

        // 🔥 AUTO-DOWNLOAD RECEIPT: Automatically download receipt after payment success
        console.log('📄 Setting up auto-download receipt...', { verificationResult, orderData, paymentResponse });
        try {
          // Wait a bit for order to be saved in backend
          setTimeout(async () => {
            try {
              console.log('📄 Starting receipt download...');
              
              // Get order details from verification response - check both data and order properties
              const orderFromResponse = verificationResult?.order || verificationResult?.data?.order;
              const orderId = orderFromResponse?.orderId || orderData?.orderId || paymentResponse?.orderId;
              const paymentId = orderFromResponse?.paymentId || paymentResponse?.razorpay_payment_id || paymentResponse?.paymentId;
              const trackingNumber = orderFromResponse?.trackingNumber || 'N/A';
              
              console.log('📄 Receipt data:', { orderId, paymentId, trackingNumber });
              
              if (!orderId) {
                console.warn('⚠️ Order ID not found, fetching from API...');
                // Try to fetch order from API
                try {
                  const userId = userData?.userId || profileData?._id;
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
                             order.paymentMode === 'installment' &&
                             order.installmentDetails?.installmentIndex === actualInstallmentIndex &&
                             order.status === 'paid';
                    });
                    
                    if (userOrder) {
                      console.log('✅ Found order from API:', userOrder);
                      const finalOrderId = userOrder.orderId;
                      const finalPaymentId = userOrder.paymentId;
                      const finalTrackingNumber = userOrder.trackingNumber;
                      
                      // Prepare receipt data
                      const receiptData = {
                        courseTitle: courseTitle || 'Course',
                        installmentNumber: actualInstallmentIndex + 1,
                        totalInstallments: installmentDetails?.length || 1,
                        amount: nextInstallment.amount || (userOrder.amount / 100) || 0,
                        paymentDate: userOrder.paidAt || userOrder.updatedAt || new Date(),
                        transactionId: finalPaymentId || 'N/A',
                        orderId: finalOrderId || 'N/A',
                        trackingNumber: finalTrackingNumber || 'N/A',
                        studentName: userData?.firstName && userData?.lastName 
                          ? `${userData.firstName} ${userData.lastName}` 
                          : profileData?.firstName && profileData?.lastName
                          ? `${profileData.firstName} ${profileData.lastName}`
                          : userData?.name || profileData?.name || 'N/A',
                        studentEmail: userData?.email || profileData?.email || 'N/A',
                        planType: planType || 'Standard',
                        coursePrice: coursePrice || planTotalAmount || 0,
                        amountPaid: (installmentDetails || [])
                          .filter(inst => inst.isPaid)
                          .reduce((sum, inst) => sum + (inst.amount || 0), 0),
                        remainingAmount: planRemainingAmount || 0
                      };
                      
                      console.log('📄 Generating receipt PDF with data:', receiptData);
                      // Auto-download receipt
                      await generateReceiptPDF(receiptData, actualInstallmentIndex);
                      return;
                    }
                  }
                } catch (fetchError) {
                  console.error('⚠️ Error fetching order from API:', fetchError);
                }
              }
              
              // Prepare receipt data with available information
              const receiptData = {
                courseTitle: courseTitle || 'Course',
                installmentNumber: actualInstallmentIndex + 1,
                totalInstallments: installmentDetails?.length || 1,
                amount: nextInstallment.amount || 0,
                paymentDate: new Date(),
                transactionId: paymentId || 'N/A',
                orderId: orderId || 'N/A',
                trackingNumber: trackingNumber,
                studentName: userData?.firstName && userData?.lastName 
                  ? `${userData.firstName} ${userData.lastName}` 
                  : profileData?.firstName && profileData?.lastName
                  ? `${profileData.firstName} ${profileData.lastName}`
                  : userData?.name || profileData?.name || 'N/A',
                studentEmail: userData?.email || profileData?.email || 'N/A',
                planType: planType || 'Standard',
                coursePrice: coursePrice || planTotalAmount || 0,
                amountPaid: (installmentDetails || [])
                  .filter(inst => inst.isPaid)
                  .reduce((sum, inst) => sum + (inst.amount || 0), 0),
                remainingAmount: planRemainingAmount || 0
              };
              
              console.log('📄 Generating receipt PDF with data:', receiptData);
              // Auto-download receipt
              await generateReceiptPDF(receiptData, actualInstallmentIndex);
            } catch (receiptError) {
              console.error('❌ Error auto-downloading receipt:', receiptError);
              console.error('❌ Receipt error details:', receiptError.stack);
              // Don't show error to user - receipt can be downloaded manually later
            }
          }, 2000); // Wait 2 seconds for backend to process order
        } catch (error) {
          console.error('❌ Error setting up auto-download receipt:', error);
        }

        // Re-fetch installment details from API to sync with backend (after UI update)
        setTimeout(async () => {
          try {
            const currentUserId = userData?.userId || profileData?._id;
            if (currentUserId && courseId) {
              // Fetch updated timeline from API
              const timelineResponse = await api.get(
                `/admin/installments/${courseId}/user/${currentUserId}/timeline`
              );
              const timeline = timelineResponse.data?.timeline || timelineResponse.data || [];
              if (timeline.length > 0) {
                setInstallmentDetails(timeline);
                // Find next unpaid installment
                const unpaidInstallment = timeline.find((inst) => !inst.isPaid);
                setNextInstallment(unpaidInstallment || null);
                
                // Update amounts
                if (timelineResponse.data?.totalAmount) {
                  setPlanTotalAmount(timelineResponse.data.totalAmount);
                }
                if (timelineResponse.data?.remainingAmount !== undefined) {
                  setPlanRemainingAmount(timelineResponse.data.remainingAmount);
                }
              }
            }
          } catch (error) {
            console.error("Error refreshing installment details from API:", error);
            // Don't show error - UI is already updated optimistically
          }
        }, 2000); // Wait 2 seconds for backend to process

        // Close modal after a short delay to allow user to see the update
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        throw new Error("Payment verification failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      notification.error({
        message: "Payment Failed",
        description: error.message || "Payment could not be processed. Please try again.",
        duration: 5,
      });
    } finally {
      setProcessing(false);
    }
  };

  // Helper function to generate PDF from receipt data
  const generateReceiptPDF = async (receiptData, installmentIndex) => {
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
        const filename = `Payment_Receipt_${receiptData.courseTitle.replace(/\s+/g, '_')}_Installment_${receiptData.installmentNumber}_${new Date().getTime()}.pdf`;
        
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
      } finally {
        setDownloadingReceipt(null);
      }
    }, 1000);
  };

  // Function to download payment receipt
  const handleDownloadReceipt = async (installmentIndex, installment) => {
    setDownloadingReceipt(installmentIndex);
    
    try {
      const order = ordersMap[installmentIndex];
      
      // If order details not available, try to fetch them
      if (!order) {
        
        // Try to fetch orders again
        try {
          const userId = userData?.userId || profileData?._id;
          if (userId && courseId) {
            const ordersResponse = await api.get(`/admin/orders/paid`);
            const paidOrders = ordersResponse.data?.data || [];
            
            const userCourseOrders = paidOrders.filter(order => {
              const orderUserId = order.userId?._id?.toString?.() || order.userId?.toString?.() || order.userId;
              const orderCourseId = order.courseId?._id?.toString?.() || order.courseId?.toString?.() || order.courseId;
              const userIdStr = userId?.toString?.() || userId;
              const currentCourseId = courseId?.toString?.() || courseId;
              
              return orderUserId === userIdStr && 
                     orderCourseId === currentCourseId && 
                     order.paymentMode === 'installment' &&
                     order.installmentDetails?.installmentIndex === installmentIndex;
            });
            
            if (userCourseOrders.length > 0) {
              const foundOrder = userCourseOrders[0];
              const orderData = {
                orderId: foundOrder.orderId,
                paymentId: foundOrder.paymentId,
                receipt: foundOrder.receipt,
                trackingNumber: foundOrder.trackingNumber,
                amount: foundOrder.amount / 100,
                paymentDate: foundOrder.paidAt || foundOrder.updatedAt || foundOrder.createdAt,
                createdAt: foundOrder.createdAt,
                updatedAt: foundOrder.updatedAt
              };
              
              // Update ordersMap
              setOrdersMap(prev => ({ ...prev, [installmentIndex]: orderData }));
              
              // Use the found order
              const receiptData = {
                courseTitle: courseTitle || 'Course',
                installmentNumber: installmentIndex + 1,
                totalInstallments: installmentDetails?.length || 1,
                amount: installment.amount || orderData.amount,
                paymentDate: orderData.paymentDate || installment.paymentDate || installment.paidDate || new Date(),
                transactionId: orderData.paymentId || 'N/A',
                orderId: orderData.orderId || 'N/A',
                trackingNumber: orderData.trackingNumber || 'N/A',
                studentName: userData?.firstName && userData?.lastName 
                  ? `${userData.firstName} ${userData.lastName}` 
                  : profileData?.firstName && profileData?.lastName
                  ? `${profileData.firstName} ${profileData.lastName}`
                  : userData?.name || profileData?.name || 'N/A',
                studentEmail: userData?.email || profileData?.email || 'N/A',
                planType: planType || 'Standard',
                coursePrice: coursePrice || planTotalAmount || 0,
                amountPaid: userData?.purchasedCourses?.find((pc) => {
                  const courseIdStr = pc.course?.toString?.() || pc.course;
                  const currentCourseId = courseId?.toString?.() || courseId;
                  return courseIdStr === currentCourseId && pc.paymentType === 'installment';
                })?.amountPaid || 0,
                remainingAmount: planRemainingAmount || 0
              };
              
              await generateReceiptPDF(receiptData, installmentIndex);
              return;
            }
          }
        } catch (fetchError) {
          console.error('Error fetching order details:', fetchError);
        }
        
        // If still no order found, generate receipt with available data
        const receiptData = {
          courseTitle: courseTitle || 'Course',
          installmentNumber: installmentIndex + 1,
          totalInstallments: installmentDetails?.length || 1,
          amount: installment.amount || 0,
          paymentDate: installment.paymentDate || installment.paidDate || new Date(),
          transactionId: 'N/A',
          orderId: 'N/A',
          trackingNumber: 'N/A',
          studentName: userData?.firstName && userData?.lastName 
            ? `${userData.firstName} ${userData.lastName}` 
            : profileData?.firstName && profileData?.lastName
            ? `${profileData.firstName} ${profileData.lastName}`
            : userData?.name || profileData?.name || 'N/A',
          studentEmail: userData?.email || profileData?.email || 'N/A',
          planType: planType || 'Standard',
          coursePrice: coursePrice || planTotalAmount || 0,
          amountPaid: userData?.purchasedCourses?.find((pc) => {
            const courseIdStr = pc.course?.toString?.() || pc.course;
            const currentCourseId = courseId?.toString?.() || courseId;
            return courseIdStr === currentCourseId && pc.paymentType === 'installment';
          })?.amountPaid || 0,
          remainingAmount: planRemainingAmount || 0
        };
        
        await generateReceiptPDF(receiptData, installmentIndex);
        return;
      }

      // Prepare receipt data
      const receiptData = {
        courseTitle: courseTitle || 'Course',
        installmentNumber: installmentIndex + 1,
        totalInstallments: installmentDetails?.length || 1,
        amount: installment.amount || order.amount,
        paymentDate: order.paymentDate || installment.paymentDate || installment.paidDate || new Date(),
        transactionId: order.paymentId || 'N/A',
        orderId: order.orderId || 'N/A',
        trackingNumber: order.trackingNumber || 'N/A',
        studentName: userData?.firstName && userData?.lastName 
          ? `${userData.firstName} ${userData.lastName}` 
          : profileData?.firstName && profileData?.lastName
          ? `${profileData.firstName} ${profileData.lastName}`
          : userData?.name || profileData?.name || 'N/A',
        studentEmail: userData?.email || profileData?.email || 'N/A',
        planType: planType || 'Standard',
        coursePrice: coursePrice || planTotalAmount || 0,
        amountPaid: userData?.purchasedCourses?.find((pc) => {
          const courseIdStr = pc.course?.toString?.() || pc.course;
          const currentCourseId = courseId?.toString?.() || courseId;
          return courseIdStr === currentCourseId && pc.paymentType === 'installment';
        })?.amountPaid || 0,
        remainingAmount: planRemainingAmount || 0
      };

      await generateReceiptPDF(receiptData, installmentIndex);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      notification.error({
        message: "Download Failed",
        description: error.message || "Failed to download receipt. Please try again.",
        duration: 4,
      });
      setDownloadingReceipt(null);
    }
  };

  if (!isOpen) return null;

  // Don't render modal content if no installment details and not loading
  // But let the modal structure render so useEffect can close it properly
  // The useEffect above will handle closing
  if (!loading && (!installmentDetails || (Array.isArray(installmentDetails) && installmentDetails.length === 0))) {
    // Show minimal content with close button
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto p-6">
          <div className="flex justify-end mb-4">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-600">No installment plans available.</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#023d50]">Pay Installment</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Course Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{courseTitle}</h3>
            <p className="text-sm text-gray-600">Course Price: ₹{coursePrice?.toLocaleString('en-IN') || 'N/A'}</p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading installment details...</p>
            </div>
          ) : !installmentDetails || (Array.isArray(installmentDetails) && installmentDetails.length === 0) ? (
            // Show a simple close button and auto-close
            <div className="text-center py-8">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Plan Title and Total Amount */}
              {planType && (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-bold text-[#023d50] mb-3">{planType} Plan</h3>
                  <div className="space-y-2">
                    {planTotalAmount && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Total Amount:</span>
                        <span className="text-xl font-bold text-[#023d50]">
                          ₹{Math.round(planTotalAmount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    {planRemainingAmount !== null && planRemainingAmount !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Remaining Amount:</span>
                        <span className="text-lg font-semibold text-orange-600">
                          ₹{Math.round(planRemainingAmount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    {userData?.purchasedCourses?.some((pc) => {
                      const courseIdStr = pc.course?.toString?.() || pc.course;
                      const currentCourseId = courseId?.toString?.() || courseId;
                      return courseIdStr === currentCourseId && pc.paymentType === 'installment' && pc.installments?.length > 0;
                    }) && (
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <span className="text-xs text-gray-500 italic">
                          * Using your original enrollment prices
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Installment Timeline */}
              <div className="mb-6">
                <Timeline>
                  {installmentDetails.map((installment, index) => {
                    const isPaid = installment.isPaid === true;
                    const isNextToPay = installment === nextInstallment;
                    const paymentDate = installment.paymentDate || installment.paidDate;
                    
                    return (
                      <Timeline.Item
                        key={index}
                        color={isPaid ? "green" : isNextToPay ? "blue" : "gray"}
                      >
                        <div className={`p-3 rounded-lg ${isNextToPay ? 'bg-blue-50 border-2 border-blue-300' : isPaid ? 'bg-green-50' : 'bg-gray-50'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <strong className="text-lg">
                                Installment {index + 1}:
                              </strong>
                              <span className="ml-2 text-lg font-bold text-[#023d50]">
                                ₹{Math.round(installment.amount).toLocaleString('en-IN')}
                              </span>
                            </div>
                            {isNextToPay && (
                              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                                Current
                              </span>
                            )}
                          </div>
                          {isPaid ? (
                            <div className="text-sm mt-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <span className="text-green-700 font-semibold block">Status: Paid</span>
                                  {paymentDate && (
                                    <div className="text-green-600 mt-1">
                                      Paid on: {new Date(paymentDate).toLocaleDateString("en-US", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDownloadReceipt(index, installment)}
                                  disabled={downloadingReceipt === index}
                                  className="flex-shrink-0 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                  title="Download Payment Receipt"
                                >
                                  {downloadingReceipt === index ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                      <span>Downloading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <span>Download Receipt</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm">
                              <span className="text-gray-600">Status: Unpaid</span>
                              {installment.dueDate && (
                                <div className="text-gray-500 mt-1">
                                  Due Date: {formatDueDate(installment.dueDate)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              </div>

              {/* Payment Button for Next Installment */}
              {nextInstallment ? (
                <>
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700 font-medium">Next Installment to Pay:</span>
                      <span className="text-2xl font-bold text-[#023d50]">
                        ₹{Math.round(nextInstallment.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {nextInstallment.dueDate && (
                      <div className="text-sm text-red-600 mt-1">
                        Due: {formatDueDate(nextInstallment.dueDate)}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={processing || paymentLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-3 shadow-lg transform hover:scale-105"
                  >
                    {processing || paymentLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>Processing Payment...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-xl">
                          Pay Installment {installmentDetails.indexOf(nextInstallment) + 1} - ₹{Math.round(nextInstallment.amount).toLocaleString('en-IN')}
                        </span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="text-center py-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-green-600 font-semibold mb-2">✅ All Installments Paid!</div>
                  <p className="text-sm text-gray-600">You have completed all your installment payments.</p>
                </div>
              )}

              {/* Cancel Button */}
              <button
                onClick={onClose}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 text-sm"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallmentPaymentModal;

