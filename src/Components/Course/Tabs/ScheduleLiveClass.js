import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import { Button, message, Modal } from "antd";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLiveClass } from "../../../Context/LiveClassContext";
import { useUser } from "../../../Context/UserContext";
import api from "../../../api/axios";

const ScheduleLiveClass = ({ courseId }) => {
  const { profileData, reloadProfile } = useUser();
  const { 
    liveClasses, 
    loading: liveClassLoading, 
    error: liveClassError, 
    fetchLiveClasses, 
    getLiveClassesForCourse, 
    refreshLiveClasses 
  } = useLiveClass();
  
  const [currentClass, setCurrentClass] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(false);
  const iframeRef = useRef(null);

  // Fetch live classes on component mount
  useEffect(() => {
    console.log('🔄 ScheduleLiveClass: Fetching live classes for course:', courseId);
    fetchLiveClasses();
  }, [courseId]); // ✅ Fixed: Removed fetchLiveClasses to prevent infinite loop

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshLiveClasses();
      console.log('✅ Live classes refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh live classes:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const { liveClassesForCourse, hasAccess } = useMemo(() => {
    // Normalize courseId for comparison
    const normalizedCourseId = courseId?.toString()?.trim();
    
    console.log('🔍 [DEBUG] ScheduleLiveClass - Course ID (raw):', courseId);
    console.log('🔍 [DEBUG] ScheduleLiveClass - Course ID (normalized):', normalizedCourseId);
    console.log('🔍 [DEBUG] ScheduleLiveClass - Total live classes from API:', liveClasses.length);
    
    // Log all live classes with their courseIds for debugging
    if (liveClasses.length > 0) {
      console.log('🔍 [DEBUG] All live classes from API:');
      liveClasses.forEach((cls, idx) => {
        console.log(`  Class ${idx + 1}:`, {
          title: cls.title,
          _id: cls._id,
          courseIds: cls.courseIds,
          status: cls.status
        });
      });
    }
    
    // ✅ Filter by current course/batch ID - only show classes scheduled for THIS specific course
    const classesForThisCourse = getLiveClassesForCourse(courseId);

    // Check if user has purchased this course (for access control)
    const purchased = profileData?.purchasedCourses?.some(
      (course) => {
        const purchasedCourseId = course.course?._id || course.course;
        const purchasedIdStr = purchasedCourseId?.toString()?.trim();
        const courseIdStr = normalizedCourseId;
        const match = purchasedIdStr === courseIdStr;
        return match;
      }
    );

    console.log('✅ [DEBUG] ScheduleLiveClass - Classes for THIS course:', classesForThisCourse.length);
    console.log('✅ [DEBUG] ScheduleLiveClass - Filtered classes:', classesForThisCourse.map(c => ({
      title: c.title,
      _id: c._id,
      courseIds: c.courseIds
    })));
    console.log('🔍 [DEBUG] ScheduleLiveClass - User has access to current course:', purchased);
    
    // Log warning if no classes match but we have classes from API
    if (classesForThisCourse.length === 0 && liveClasses.length > 0) {
      console.warn('⚠️ [WARNING] No live classes found for courseId:', normalizedCourseId);
      console.warn('⚠️ [WARNING] Available courseIds in live classes:', 
        liveClasses.flatMap(c => c.courseIds || []).map(id => {
          if (typeof id === 'string') return id;
          if (id && typeof id === 'object') return id._id || id.toString();
          return String(id);
        })
      );
    }

    return { liveClassesForCourse: classesForThisCourse, hasAccess: purchased };
  }, [liveClasses, courseId, profileData, getLiveClassesForCourse]);

  const handleJoinClass = async (liveClass, useDeviceTest = false) => {
    console.log('🔍 [DEBUG] Joining live class:', liveClass);
    console.log('🔍 [DEBUG] Platform:', liveClass.platform);
    console.log('🔍 [DEBUG] Access type:', liveClass.accessType);
    console.log('🔍 [DEBUG] Device test mode:', useDeviceTest);
    
    let finalJoinLink = null;
    
    // For MeritHub classes, check if user has individual access
    if (liveClass.platform === "merithub" && !useDeviceTest) {
      // Check if user has individual link
      if (!liveClass.hasIndividualAccess && !liveClass.individualUserLink) {
        console.log('⚠️ [JOIN] User does not have individual access, adding to class...');
        
        try {
          // Add user to the class on-demand
          const classId = liveClass.classId || liveClass._id;
          const response = await api.post(`/user/live-classes/${classId}/add-user`);
          
          if (response.data?.individualUserLink) {
            console.log('✅ [JOIN] User successfully added to class');
            // Use the returned link immediately
            finalJoinLink = response.data.individualUserLink;
            console.log('🔗 [JOIN] Using newly obtained individual link:', finalJoinLink);
            
            // Refresh live classes in background (don't wait for it)
            refreshLiveClasses().catch(err => {
              console.warn('⚠️ [JOIN] Background refresh failed:', err);
            });
          } else {
            console.error('❌ [JOIN] Failed to get individual link after adding user');
            message.error('Failed to join class. Please try again or contact support.');
            return;
          }
        } catch (error) {
          console.error('❌ [JOIN] Error adding user to class:', error);
          const errorMsg = error.response?.data?.error || error.message || 'Failed to join class';
          message.error(errorMsg);
          return;
        }
      } else {
        // User already has individual link
        finalJoinLink = liveClass.individualUserLink;
        console.log('✅ [JOIN] User already has individual link');
      }
    }
    
    // 🔧 FIXED: Use individualUserLink for MeritHub (user's unique link)
    // For Zoom, use the meeting link
    let joinLink = finalJoinLink;
    
    if (!joinLink) {
      if (liveClass.platform === "zoom") {
        joinLink = liveClass.zoomMeetingLink;
        console.log('🎥 [ZOOM] Using Zoom meeting link');
      } else {
        // For MeritHub, prioritize individual user link
    if (useDeviceTest && liveClass.deviceTestLink) {
      joinLink = liveClass.deviceTestLink;
      console.log('🔧 [DEVICE_TEST] Using device test link');
    } else {
          // Use individual user link (best for students) or fallback to participant link
      joinLink = liveClass.individualUserLink || liveClass.participantLink || liveClass.liveLink;
          console.log('🔗 [MERITHUB] Using individual user link for classroom access');
        }
      }
    }
    
    console.log('🔍 [DEBUG] individualUserLink:', liveClass.individualUserLink);
    console.log('🔍 [DEBUG] participantLink:', liveClass.participantLink);
    console.log('🔍 [DEBUG] liveLink:', liveClass.liveLink);
    console.log('🔍 [DEBUG] deviceTestLink:', liveClass.deviceTestLink);
    console.log('🔍 [DEBUG] hasIndividualAccess:', liveClass.hasIndividualAccess);
    console.log('🔍 [DEBUG] Final join link:', joinLink);
    
    if (!joinLink) {
      console.error('❌ No join link available for this class');
      message.error('Join link not available for this class. Please contact support.');
      return;
    }
    
    if (liveClass.platform === "zoom") {
      // For Zoom, open the join link directly in a new tab
      console.log('🎥 [ZOOM] Opening Zoom join link in new tab:', joinLink);
      window.open(joinLink, '_blank');
    } else {
      // For MeritHub, open join link in modal
      // Individual user links should work without additional authentication
      // If MeritHub still asks for login, it means the user wasn't properly added to the class
      console.log('📺 [MERITHUB] Opening MeritHub join link in modal:', joinLink);
      console.log('📺 [MERITHUB] Link type:', joinLink === liveClass.individualUserLink ? 'Individual' : 'Common');
      
      // Ensure we're using the individual link if available
      if (!joinLink.includes('iframe=true')) {
        // Add iframe parameter if not present
        const separator = joinLink.includes('?') ? '&' : '?';
        joinLink = `${joinLink}${separator}iframe=true`;
      }
      
      setCurrentClass(joinLink);
      setIframeLoading(true);
      setIframeError(false);
      setIsModalVisible(true);
    }
  };

  const handleToggleFullScreen = () => {
    setIsFullScreen((prev) => !prev);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setIsFullScreen(false); // Reset full-screen state
    setIframeError(false);
    setIframeLoading(false);
    setCurrentClass(null);
  };

  // Handle iframe load events
  const handleIframeLoad = () => {
    console.log('✅ [IFRAME] MeritHub iframe loaded successfully');
    setIframeLoading(false);
    setIframeError(false);
  };

  // Handle iframe error events
  const handleIframeError = () => {
    console.error('❌ [IFRAME] MeritHub iframe failed to load');
    setIframeLoading(false);
    setIframeError(true);
    message.error('Failed to load class. Please try again or contact support.');
  };

  // Retry loading the iframe with fresh authentication
  const retryIframeLoad = () => {
    if (currentClass && iframeRef.current) {
      console.log('🔄 [IFRAME] Retrying iframe load with fresh authentication');
      setIframeError(false);
      setIframeLoading(true);
      
      // Force reload the iframe
      const originalSrc = currentClass;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = originalSrc;
        }
      }, 100);
    }
  };

  // Handle postMessage communication with iframe for authentication
  useEffect(() => {
    const handleMessage = (event) => {
      // Only accept messages from trusted MeritHub domains
      if (!event.origin.includes('merithub') && !event.origin.includes('akj')) {
        return;
      }

      console.log('📨 [IFRAME_MESSAGE] Received message from iframe:', event.data);

      if (event.data?.type === 'AUTH_REQUEST') {
        // Send authentication token to iframe
        const token = localStorage.getItem("token");
        const userData = JSON.parse(localStorage.getItem("userData") || '{}');
        
        if (token && iframeRef.current) {
          console.log('🔐 [IFRAME_AUTH] Sending authentication data to iframe');
          iframeRef.current.contentWindow.postMessage({
            type: 'AUTH_RESPONSE',
            token: token,
            user: userData,
            timestamp: Date.now()
          }, event.origin);
        }
      } else if (event.data?.type === 'AUTH_ERROR') {
        console.error('❌ [IFRAME_AUTH] Authentication error in iframe:', event.data.error);
        setIframeError(true);
        message.error('Authentication failed. Please try refreshing or contact support.');
      } else if (event.data?.type === 'READY') {
        console.log('✅ [IFRAME] MeritHub iframe is ready');
        setIframeLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleManualRefresh = async () => {
    console.log("🔄 Manual refresh triggered by user");
    setIsRefreshing(true);
    try {
      await reloadProfile();
    } finally {
      // Reduce delay for better responsiveness
      setTimeout(() => setIsRefreshing(false), 200);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Live Classes</h1>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || liveClassLoading}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            isRefreshing || liveClassLoading
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          title="Refresh live classes"
        >
          {isRefreshing || liveClassLoading ? '🔄 Refreshing...' : '🔄 Refresh'}
        </button>
      </div>
      <div className="grid gap-4">
        {liveClassError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600">⚠️ {liveClassError}</p>
            <button 
              onClick={handleRefresh}
              className="mt-2 text-sm text-red-700 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}
        {liveClassLoading ? (
          <div className="text-center text-gray-500 py-8">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-lg">Loading live classes...</p>
          </div>
        ) : liveClassesForCourse?.length > 0 ? (
          liveClassesForCourse?.map((liveClass) => (
            <div
              key={`${liveClass._id}-${hasAccess ? 'access' : 'no-access'}`}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                <h2 className="font-semibold text-lg">{liveClass.title}</h2>
                  {liveClass.status === 'lv' && (
                    <span className="px-2 py-1 text-xs bg-red-200 text-red-700 rounded animate-pulse">
                      🔴 Live Now
                    </span>
                  )}
                  {liveClass.status === 'scheduled' && (
                    <span className="px-2 py-1 text-xs bg-blue-200 text-blue-700 rounded">
                      📅 Scheduled
                    </span>
                  )}
                </div>
                <p>
                  Start Time: {new Date(liveClass.startTime).toLocaleString()}
                </p>
                <p>Duration: {liveClass.duration} mins</p>
                <p className="text-sm text-blue-400">
                  Platform: {liveClass.platform === "zoom" ? "🎥 Zoom" : "📺 MeritHub"}
                </p>
              </div>
              {hasAccess ? (
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => handleJoinClass(liveClass)}
                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors duration-200"
                  >
                    {liveClass.platform === "zoom" ? "Join Zoom Meeting" : "Join Class"}
                  </button>
                  {liveClass.platform === "merithub" && liveClass.deviceTestLink && (
                    <button
                      onClick={() => handleJoinClass(liveClass, true)}
                      className="bg-gray-500 text-white py-1 px-3 rounded text-sm hover:bg-gray-600 transition-colors duration-200"
                      title="Test your camera, microphone, and speakers before joining"
                    >
                      🔧 Device Test
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-end space-y-2">
                  <button
                    className="bg-gray-300 text-gray-600 py-2 px-4 rounded cursor-not-allowed"
                    disabled
                    title="Purchase course to access live classes"
                  >
                    <i className="fas fa-lock mr-2"></i>Purchase Required
                  </button>
                  <button
                    onClick={() => window.location.href = `/explorecourses/${courseId}`}
                    className="bg-green-500 text-white py-1 px-3 rounded text-sm hover:bg-green-600 transition-colors duration-200"
                  >
                    Buy Course
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            <i className="fas fa-calendar-times text-4xl mb-4 text-gray-300"></i>
            <p className="text-lg">No Live Classes Scheduled</p>
            <p className="text-sm">Check back later for upcoming sessions for this course</p>
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs">
                <p><strong>Debug Info:</strong></p>
                <p>Course ID: {courseId}</p>
                <p>Total Live Classes: {liveClasses.length}</p>
                <p>Filtered Classes: {liveClassesForCourse?.length || 0}</p>
                {liveClasses.length > 0 && (
                  <div className="mt-2">
                    <p><strong>All Live Classes:</strong></p>
                    <ul className="list-disc list-inside">
                      {liveClasses.map((cls, idx) => (
                        <li key={idx}>
                          {cls.title} - CourseIds: {JSON.stringify(cls.courseIds)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        visible={isModalVisible}
        onCancel={handleCloseModal}
        footer={
          <div className="flex justify-between items-center">
            {iframeError && (
              <Button 
                onClick={retryIframeLoad}
                type="primary"
                danger
              >
                🔄 Retry Connection
              </Button>
            )}
            <Button onClick={handleToggleFullScreen}>
              {isFullScreen ? (
                <FullscreenExitOutlined />
              ) : (
                <FullscreenOutlined />
              )}
              {isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
            </Button>
          </div>
        }
        centered
        width={isFullScreen ? "100%" : "80%"}
        bodyStyle={{
          height: isFullScreen ? "100vh" : "500px",
          padding: 0,
        }}
        style={{
          top: isFullScreen ? 0 : 20,
          margin: isFullScreen ? 0 : "auto",
        }}
      >
        {iframeError ? (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Connection Failed
              </h3>
              <p className="text-gray-600 mb-4">
                Unable to load the class. This might be due to authentication issues.
              </p>
              <div className="space-y-2">
                <button
                  onClick={retryIframeLoad}
                  className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors mr-2"
                >
                  🔄 Retry
                </button>
                <button
                  onClick={() => window.open(currentClass?.split('?')[0], '_blank')}
                  className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  🚀 Open in New Tab
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {iframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                <div className="text-center">
                  <div className="animate-spin text-4xl mb-2">⏳</div>
                  <p className="text-gray-600">Loading class...</p>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={currentClass}
              frameBorder="0"
              style={{
                width: "100%",
                height: "100%",
              }}
              allowFullScreen
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
              title="MeritHub Live Class"
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default ScheduleLiveClass;
