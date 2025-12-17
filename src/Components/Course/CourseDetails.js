import { notification } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "../../Context/UserContext.js";
import NavbarLanding from "../../Pages/Landing Page/NavbarLanding.jsx";
import HOC from "../HOC/HOC";
import AssignmentSubmission from "./Tabs/AssignmentSubmission.jsx"; // Importing the Assignment component
import Description from "./Tabs/Description";
import { FileViewer } from "./Tabs/FIleViewer.js";
import ScheduleLiveClass from "./Tabs/ScheduleLiveClass";
import TestPanel from "./Tabs/Test Panel/TestPanel.js"; // Importing the TestPanel component
import Tests from "./Tabs/Tests";

const CourseDetails = () => {
  const location = useLocation();
  const params = useParams();
  const batch = location.state;
  
  const [activeTab, setActiveTab] = useState("description");
  const [loading, setLoading] = useState(false);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsLoadingToast, setMaterialsLoadingToast] = useState(null);
  const { profileData } = useUser(); // Remove fetchUserProfile - use profileData from context only
  const [isPurchased, setIsPurchased] = useState(false);
  // 🔥 REMOVED: isCheckingAccess state - now using top-right notification instead of blocking modal
  const enrollmentNotificationKey = useRef(null);
  
  // Get course ID from params or state
  const courseId = params.id || batch?._id;
  
  // Check if user came from payment (via location.state or URL param)
  const fromPayment = location.state?.fromPayment || new URLSearchParams(window.location.search).get('fromPayment') === 'true';
  
  // Listen for enrollment status updates and show notification only for this course
  useEffect(() => {
    if (!courseId) return;
    
    const enrollmentKey = `enrollment-checking-${courseId}`;
    
    // Check localStorage on mount
    const checkEnrollmentStatus = () => {
      const enrollmentDataStr = localStorage.getItem(enrollmentKey);
      if (enrollmentDataStr) {
        try {
          const enrollmentData = JSON.parse(enrollmentDataStr);
          if (enrollmentData.isChecking && enrollmentData.courseId === courseId) {
            showEnrollmentNotification(enrollmentData);
          }
        } catch (error) {
          console.error('Error parsing enrollment data:', error);
        }
      }
    };
    
    // Show notification based on enrollment data - Top-right non-blocking notification
    const showEnrollmentNotification = (enrollmentData) => {
      const progressPercent = Math.round((enrollmentData.attempts / enrollmentData.maxAttempts) * 100);
      const notificationKey = `enrollment-${courseId}`;
      enrollmentNotificationKey.current = notificationKey;
      
      notification.info({
        key: notificationKey,
        message: "Granting Course Access",
        description: (
          <div>
            <div className="mb-1 text-sm">{enrollmentData.lastMessage || "We're setting up your course access. This will only take a moment..."}</div>
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
        style: {
          marginTop: '20px', // Position from top
        },
      });
    };
    
    // Handle enrollment events
    const handleEnrollmentStart = (event) => {
      if (event.detail.courseId === courseId) {
        showEnrollmentNotification(event.detail.enrollmentData);
      }
    };
    
    const handleEnrollmentUpdate = (event) => {
      if (event.detail.courseId === courseId) {
        showEnrollmentNotification(event.detail.enrollmentData);
      }
    };
    
    const handleEnrollmentComplete = (event) => {
      if (event.detail.courseId === courseId) {
        if (enrollmentNotificationKey.current) {
          notification.close(enrollmentNotificationKey.current);
          enrollmentNotificationKey.current = null;
        }
      }
    };
    
    // Check on mount
    checkEnrollmentStatus();
    
    // Listen for events
    window.addEventListener('enrollmentStarted', handleEnrollmentStart);
    window.addEventListener('enrollmentUpdate', handleEnrollmentUpdate);
    window.addEventListener('enrollmentCompleted', handleEnrollmentComplete);
    
    // Also check localStorage periodically (in case events are missed)
    const interval = setInterval(() => {
      checkEnrollmentStatus();
    }, 1000);
    
    return () => {
      window.removeEventListener('enrollmentStarted', handleEnrollmentStart);
      window.removeEventListener('enrollmentUpdate', handleEnrollmentUpdate);
      window.removeEventListener('enrollmentCompleted', handleEnrollmentComplete);
      clearInterval(interval);
      if (enrollmentNotificationKey.current) {
        notification.close(enrollmentNotificationKey.current);
        enrollmentNotificationKey.current = null;
      }
    };
  }, [courseId]);

  // FIX: Enhanced access check with automatic refresh for stale data
  useEffect(() => {
    if (!profileData || !batch?._id) {
      setIsPurchased(false);
      return;
    }

    const purchasedCourses = profileData.purchasedCourses || [];
    
    // More robust comparison for batch course access
    const hasAccess = purchasedCourses.some((purchased) => {
      // Handle both ObjectId and string comparisons
      const purchasedCourseId = purchased.course?._id || purchased.course;
      const batchId = batch._id;
      
      // Convert both to strings for comparison
      const courseIdStr = purchasedCourseId?.toString();
      const batchIdStr = batchId?.toString();
      
      return courseIdStr === batchIdStr;
    });
    
    // Update access status
    setIsPurchased(hasAccess);

    // Show notification when access is granted (only once)
    if (hasAccess && !isPurchased) {
      const notificationKey = `access-granted-${batch._id}`;
      const hasShownNotification = sessionStorage.getItem(notificationKey);
      if (!hasShownNotification) {
        sessionStorage.setItem(notificationKey, 'true');
        toast.success(`✅ Access granted! You now have access to "${batch.title}"`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          toastId: notificationKey,
        });
      }
    }
  }, [profileData, batch?._id, isPurchased, batch?.title]);

  // FIX: Don't fetch profile here - UserContext handles it centrally
  // Just check if profileData exists, if not, UserContext will fetch it
  useEffect(() => {
    if (!profileData) {
      setLoading(true);
      // UserContext will fetch profile automatically, just wait for it
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000); // Max 2 seconds wait
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [profileData]);

  // FIX: Remove excessive profile update listeners that cause API spam
  // The UserContext already handles profile updates efficiently


  // 🔥 CRITICAL: Listen for profile updates (especially after payment) and poll for access
  // FIX: Use profileData from context only - no direct API calls
  useEffect(() => {
    if (!batch?._id) return;

    let pollingInterval = null;
    let maxPollingAttempts = 8; // Reduced to 8 attempts (80 seconds total)
    let pollingAttempts = 0;
    const notificationKey = `access-granted-${batch._id}`;
    const checkingRef = { current: false }; // Track if check is in progress
    let debounceTimeout = null;

    // Check access using profileData only (no API calls - UserContext handles fetching)
    const checkForAccess = () => {
      // Prevent multiple simultaneous checks
      if (checkingRef.current) {
        return false;
      }

      try {
        checkingRef.current = true;

        // Only check current profileData (no API call - UserContext handles updates)
        if (profileData?.purchasedCourses) {
          const hasAccessInProfile = profileData.purchasedCourses.some((purchased) => {
            const purchasedCourseId = purchased.course?._id || purchased.course;
            return purchasedCourseId?.toString() === batch._id?.toString();
          });

          if (hasAccessInProfile) {
            // 🔥 REMOVED: setIsCheckingAccess - notification will close automatically
            checkingRef.current = false;
            return true;
          }
        }
        
        checkingRef.current = false;
        return false; // Will be checked again via profileData dependency
      } catch (error) {
        console.error('Error checking for access:', error);
        checkingRef.current = false;
        return false;
      }
    };

    // Debounced check function to prevent rapid successive calls
    const debouncedCheck = () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      debounceTimeout = setTimeout(() => {
        checkForAccess(); // No parameters - just checks profileData
      }, 500); // 500ms debounce
    };

    // Handle profile update events (from payment success, etc.)
    const handleProfileUpdate = (event) => {
      console.log('🔄 CourseDetails: Received profile update event:', event.detail);
      
      // If user already has access, no need to check
      if (isPurchased) {
        // 🔥 REMOVED: setIsCheckingAccess - notification will close automatically
        return;
      }

      // 🔥 REMOVED: setIsCheckingAccess - now using notification instead of blocking modal
      // Notification will be shown via enrollment events, not via isCheckingAccess state

      // Check access (no API call - just check profileData)
      checkForAccess();
      
      // If still no access after event, start polling (with delay)
      if (!isPurchased && !pollingInterval) {
        setTimeout(() => {
          if (!isPurchased && !pollingInterval) {
            startPolling();
          }
        }, 2000); // Wait 2 seconds before starting to poll
      }
    };

    // Start polling for access (only if user doesn't have access)
    const startPolling = () => {
      if (pollingInterval || isPurchased) return; // Already polling or has access
      
      // 🔥 REMOVED: setIsCheckingAccess - notification will be shown via enrollment events
      
      pollingAttempts = 0;
      pollingInterval = setInterval(() => {
        pollingAttempts++;
        
        // Stop if user now has access
        if (isPurchased) {
          // 🔥 REMOVED: setIsCheckingAccess - notification will close automatically
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }
          return;
        }
        
        if (pollingAttempts >= maxPollingAttempts) {
          // Stop polling after max attempts
          // 🔥 REMOVED: setIsCheckingAccess - notification will close automatically
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }
          return;
        }
        
        // Use debounced check (no API call - just check profileData)
        debouncedCheck();
      }, 10000); // Check every 10 seconds
    };

    // Initial check after a short delay (only if user doesn't have access)
    const initialTimeout = setTimeout(() => {
      if (!isPurchased) {
        // 🔥 REMOVED: setIsCheckingAccess - notification will be shown via enrollment events
        checkForAccess(); // No API call - just check profileData
        // If still no access after initial check, start polling with delay
        setTimeout(() => {
          if (!isPurchased && !pollingInterval) {
            startPolling();
          }
        }, 3000); // Wait 3 seconds before starting to poll
      }
    }, 1000);

    // Listen for profile update events
    window.addEventListener('profileUpdated', handleProfileUpdate);

    // Cleanup
    return () => {
      clearTimeout(initialTimeout);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [batch?._id, profileData, isPurchased, fromPayment]); // Depend on profileData instead of fetchUserProfile

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const renderTabContent = () => {
    // Show purchase prompt for locked content
    if (!isPurchased && activeTab !== "description" && activeTab !== "allClasses") {
      return (
        <div className="flex items-center justify-center min-h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="text-center p-8 max-w-md">
            <div className="text-blue-500 text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Purchase Required
            </h3>
            <p className="text-gray-600 mb-4">
              This content is available after purchasing the course. You'll get full access to all features including:
            </p>
            <ul className="text-sm text-gray-600 mb-4 text-left">
              <li>• 🎥 Live Classes & Recordings</li>
              <li>• 📝 Test Panel & Quizzes</li>
              <li>• 📋 Notice Board & Updates</li>
              <li>• 📝 Assignments & Submissions</li>
            </ul>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "allClasses":
        // Check if rootFolder exists, show error message if not
        if (!batch?.rootFolder) {
          return (
            <div className="flex items-center justify-center min-h-64 bg-gray-50 rounded-lg">
              <div className="text-center p-8">
                <div className="text-red-500 text-6xl mb-4">📁</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Content Folder Not Available
                </h3>
                <p className="text-gray-600 mb-4">
                  This course doesn't have a content folder set up yet.
                </p>
                <p className="text-sm text-gray-500">
                  Please contact the administrator to set up course content.
                </p>
              </div>
            </div>
          );
        }
        return (
          <FileViewer
            rootFolderId={batch.rootFolder}
            isPurchased={isPurchased}
            onLoadingChange={(isLoading) => {
              setMaterialsLoading(isLoading);
              if (!isLoading && materialsLoadingToast) {
                toast.dismiss(materialsLoadingToast);
                setMaterialsLoadingToast(null);
              }
            }}
          />
        );
      case "scheduleLiveClass":
        return <ScheduleLiveClass courseId={batch?._id} />;
      case "tests":
        return <Tests courseId={batch?._id} />;
      case "testPanel": // Handling Test Panel tab
        return <TestPanel courseId={batch?._id} />;
      case "assignments": // Handling Assignment tab
        return <AssignmentSubmission courseId={batch?._id} rootFolderId={batch?.rootFolder} />;
      default:
        return <Description batch={batch} description={batch?.description} />;
    }
  };

  return (
    <div className="min-h-screen font-apple" style={{background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #f0f0f0 100%)'}}>
      <NavbarLanding />
      
      {/* Sleek Hero Section - Centered */}
      <div className="relative overflow-hidden bg-gradient-to-r from-white to-apple-gray-50 py-6 mt-4 border-b border-apple-gray-200">
        <div className="container-apple">
          <div className="text-center animate-apple-fade-in">
            <div className="flex items-center justify-center mb-3 gap-3">
              <div className="bg-apple-blue-50 rounded-full px-4 py-2 border border-apple-blue-200">
                <span className="text-sm font-medium font-apple text-apple-blue-700">📚 Course</span>
              </div>
              {isPurchased && (
                <div className="bg-emerald-50 rounded-full px-4 py-2 shadow-apple border border-emerald-200">
                  <span className="text-sm font-bold font-apple text-emerald-700">✅ Enrolled</span>
                </div>
              )}
            </div>
            
            <h1 className="text-2xl lg:text-3xl font-bold text-apple-gray-800 mb-4 leading-tight font-apple">
              {batch?.title}
            </h1>
            
          </div>
        </div>
      </div>

      {/* Main Content - Full Width Grid Layout */}
      <div className="w-full px-4 lg:px-8 py-8">
        {/* Compact Tab Navigation */}
        <div className="bg-white rounded-apple-xl shadow-apple border border-apple-gray-200 overflow-hidden mb-6 animate-apple-fade-in">
          <div className="p-4">
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { key: "description", label: "Description", icon: "📖", available: true },
                { key: "allClasses", label: "Content", icon: "📚", available: true },
                { key: "scheduleLiveClass", label: "Live Classes", icon: "🎥", available: isPurchased },
                { key: "testPanel", label: "Test Panel", icon: "🎯", available: isPurchased },
                { key: "tests", label: "Notice Board", icon: "📋", available: isPurchased },
                { key: "assignments", label: "Assignments", icon: "📝", available: isPurchased }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => tab.available && handleTabChange(tab.key)}
                  disabled={!tab.available}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-apple font-medium transition-all duration-300 ease-apple hover-lift ${
                    activeTab === tab.key
                      ? "bg-apple-blue-600 text-white shadow-apple"
                      : tab.available
                      ? "bg-apple-gray-50 text-apple-gray-700 hover:bg-apple-blue-50 border border-apple-gray-200 hover:border-apple-blue-300"
                      : "bg-apple-gray-100 text-apple-gray-400 border border-apple-gray-200 cursor-not-allowed opacity-60"
                  }`}
                  title={!tab.available ? `Purchase course to access ${tab.label}` : tab.label}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="text-sm font-apple">{tab.label}</span>
                  {!tab.available && (
                    <span className="text-xs">🔒</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content - Compact Container */}
        <div className="bg-white rounded-apple-xl shadow-apple border border-apple-gray-200 overflow-hidden animate-apple-fade-in">
          <div className="p-4 lg:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 animate-apple-fade-in">
                <div className="w-12 h-12 gradient-apple-primary rounded-full flex items-center justify-center mb-4 shadow-apple animate-apple-pulse border border-apple-gray-200">
                  <div className="w-6 h-6 border-4 border-apple-gray-400 border-t-apple-blue-600 rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-apple-gray-600 text-center font-apple">
                  Loading course content...
                </p>
              </div>
            ) : (
              <div className="animate-apple-fade-in w-full">
                {renderTabContent()}
              </div>
            )}
          </div>
        </div>
        
        {/* 🔥 REMOVED: Blocking modal overlay - now using top-right notification instead */}
      </div>
    </div>
  );
};

const CourseDetailsWithHOC = HOC(CourseDetails);

const ConditionalCourseDetails = () => {
  const { isAuthenticated } = useUser();

  if (isAuthenticated) {
    return <CourseDetailsWithHOC />;
  } else {
    return <CourseDetails />;
  }
};

export default ConditionalCourseDetails;
