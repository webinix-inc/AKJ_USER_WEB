import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { API_ENDPOINTS } from '../utils/constants';
import { useUser } from './UserContext';

const LiveClassContext = createContext();

export const useLiveClass = () => {
  const context = useContext(LiveClassContext);
  if (!context) {
    throw new Error('useLiveClass must be used within a LiveClassProvider');
  }
  return context;
};

export const LiveClassProvider = ({ children }) => {
  const { isAuthenticated } = useUser(); // Get authentication status
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(0);
  
  // Prevent multiple simultaneous fetches and add debouncing
  const fetchingRef = useRef(false);
  const cacheTimeoutRef = useRef(null);
  const debounceRef = useRef(null);

  // Fetch live classes with cache busting
  const fetchLiveClasses = useCallback(async (forceRefresh = false) => {
    // 🔧 FIX: Only fetch if user is authenticated
    if (!isAuthenticated) {
      console.log('🔒 User not authenticated, skipping live classes fetch');
      setLiveClasses([]);
      setError(null);
      return [];
    }

    // ✅ Add debouncing to prevent rapid successive calls
    if (debounceRef.current && !forceRefresh) {
      clearTimeout(debounceRef.current);
    }

    // Prevent multiple simultaneous calls
    if (fetchingRef.current && !forceRefresh) {
      console.log('⏸️ Fetch already in progress, skipping...');
      return liveClasses;
    }

    // Use cache if data is fresh (less than 30 seconds old) and not forcing refresh
    const now = Date.now();
    if (!forceRefresh && (now - lastFetch) < 30000) {
      console.log('🔄 Using cached live classes data');
      return liveClasses;
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching live classes from API... (Force:', forceRefresh, ')');
      console.log('🔧 [DEBUG] API_ENDPOINTS.LIVE_CLASSES:', API_ENDPOINTS.LIVE_CLASSES);
      console.log('🔧 [DEBUG] Full URL will be:', `${api.defaults.baseURL}${API_ENDPOINTS.LIVE_CLASSES}`);
      console.log('✅ [FIXED] Infinite loop prevention active');
      
      // ✅ FIXED: Fetch live classes from dedicated endpoint (shows all classes for user's courses)
      console.log('📡 [LIVE_CLASSES] Fetching live classes from dedicated endpoint...');
      console.log('✅ [LIVE_CLASSES] This shows all classes for courses user has purchased');
      let response;
      
      // Fetch live classes from dedicated endpoint that filters by user's purchased courses
      response = await api.get(API_ENDPOINTS.LIVE_CLASSES);
      console.log('✅ [LIVE_CLASSES] Live classes API call successful');
      
      // Extract live classes from dedicated endpoint response
      // API can return: { classes: [...] } or { data: [...] } or { classes: [...], data: [...] }
      const liveClassesData = response.data?.classes || response.data?.data || [];
      console.log('🔍 [LIVE_CLASSES DEBUG] Full response:', JSON.stringify(response.data, null, 2));
      console.log('🔍 [LIVE_CLASSES DEBUG] Response message:', response.data?.message);
      console.log('🔍 [LIVE_CLASSES DEBUG] Classes array:', liveClassesData);
      console.log('🔍 [LIVE_CLASSES DEBUG] Response data keys:', Object.keys(response.data || {}));
      console.log('🔍 [LIVE_CLASSES DEBUG] response.data.classes:', response.data?.classes);
      console.log('🔍 [LIVE_CLASSES DEBUG] response.data.data:', response.data?.data);
      
      console.log('✅ [LIVE_CLASSES DEBUG] Type of live classes:', typeof liveClassesData);
      console.log('✅ [LIVE_CLASSES DEBUG] Is array:', Array.isArray(liveClassesData));
      
      if (liveClassesData) {
        console.log('✅ [LIVE_CLASSES DEBUG] Live classes length:', liveClassesData.length);
        if (liveClassesData.length > 0) {
          console.log('✅ [LIVE_CLASSES DEBUG] First live class sample:', JSON.stringify(liveClassesData[0], null, 2));
          console.log('✅ [LIVE_CLASSES DEBUG] First class courseIds:', liveClassesData[0]?.courseIds);
          console.log('✅ [LIVE_CLASSES DEBUG] First class courseIds type:', typeof liveClassesData[0]?.courseIds);
          console.log('✅ [LIVE_CLASSES DEBUG] First class courseIds is array:', Array.isArray(liveClassesData[0]?.courseIds));
        }
      }
      
      if (liveClassesData && liveClassesData.length > 0) {
        console.log('✅ [LIVE_CLASSES DEBUG] Found', liveClassesData.length, 'live classes from dedicated endpoint');
        console.log('🔍 [LIVE_CLASSES DEBUG] Live classes structure:', liveClassesData);
        
        // Normalize response structure for compatibility
        response.data = {
          data: liveClassesData,
          status: 200,
          message: response.data?.message || 'Live classes fetched successfully'
        };
      } else {
        console.log('❌ [LIVE_CLASSES DEBUG] No live classes found from dedicated endpoint');
        response.data = {
          data: [],
          status: 200,
          message: response.data?.message || 'No live classes found for your courses'
        };
      }

      const fetchedClasses = response.data?.data || [];
      console.log('🔍 [DATA DEBUG] Raw fetched classes:', fetchedClasses);
      console.log('🔍 [DATA DEBUG] Fetched classes length:', fetchedClasses.length);
      
      // Filter classes: Show active (live) and scheduled (upcoming) classes only
      // Valid statuses: "up" (upcoming), "lv" (live), "scheduled", "down" (down but not deleted)
      // Hide: "deleted", "inactive", "completed", "expired" - these should be deleted from database
      const validStatuses = ['up', 'lv', 'scheduled', 'down'];
      const invalidStatuses = ['deleted', 'inactive', 'completed', 'expired'];
      
      const validClasses = fetchedClasses.filter(liveClass => {
        // Check if class has valid structure
        if (!liveClass || !liveClass._id) {
          console.log('❌ [DATA DEBUG] Invalid class structure:', liveClass);
          return false;
        }
        
        // Check status
        const status = liveClass.status?.toLowerCase();
        if (invalidStatuses.includes(status)) {
          console.log('❌ [DATA DEBUG] Class filtered out due to status:', {
            title: liveClass.title,
            status: liveClass.status,
            _id: liveClass._id
          });
          return false;
        }
        
        // Allow valid statuses or undefined/null status (default to showing)
        const isValid = validStatuses.includes(status) || !status;
        
        if (!isValid) {
          console.log('⚠️ [DATA DEBUG] Class with unknown status:', {
            title: liveClass.title,
            status: liveClass.status,
            _id: liveClass._id
          });
        } else {
          console.log('✅ [DATA DEBUG] Valid class:', {
            title: liveClass.title,
            status: liveClass.status,
            _id: liveClass._id,
            courseIds: liveClass.courseIds
          });
        }
        
        return isValid;
      });

      console.log(`✅ Fetched ${validClasses.length} valid live classes`);
      console.log('🔍 [DATA DEBUG] Valid classes structure:');
      validClasses.forEach((cls, index) => {
        console.log(`  Class ${index + 1}:`, {
          title: cls.title,
          courseIds: cls.courseIds,
          _id: cls._id,
          status: cls.status
        });
      });
      
      setLiveClasses(validClasses);
      setLastFetch(now);
      setError(null);
      
      return validClasses;
    } catch (error) {
      console.error('❌ Error fetching live classes:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
          fullURL: error.config?.baseURL + error.config?.url
        }
      });
      
      let errorMessage = 'Failed to fetch live classes';
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required to view live classes';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied to live classes';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection';
      } else if (error.message?.includes('CORS')) {
        errorMessage = 'CORS error - please check server configuration';
      }
      
      setError(errorMessage);
      
      // Don't clear existing data on error unless it's an auth error
      if (error.response?.status === 401 || error.response?.status === 403) {
        setLiveClasses([]);
      }
      
      throw error;
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [lastFetch, isAuthenticated]); // ✅ Fixed: Removed liveClasses to prevent infinite loop

  // ✅ Get live classes filtered by course ID
  const getLiveClassesForCourse = useCallback((courseId) => {
    if (!courseId) {
      console.log('❌ [FILTER] No courseId provided');
      return [];
    }
    
    // Normalize courseId to string for comparison
    const normalizedCourseId = courseId?.toString()?.trim();
    
    console.log('🔍 [FILTER] Filtering live classes for courseId:', normalizedCourseId);
    console.log('🔍 [FILTER] Total live classes available:', liveClasses.length);
    console.log('🔍 [FILTER] All live classes:', liveClasses);
    
    if (liveClasses.length === 0) {
      console.log('⚠️ [FILTER] No live classes available to filter');
      return [];
    }
    
    const filtered = liveClasses.filter(liveClass => {
      console.log('🔍 [FILTER] Checking class:', liveClass.title);
      console.log('🔍 [FILTER] Class courseIds:', liveClass.courseIds);
      console.log('🔍 [FILTER] Class courseIds type:', typeof liveClass.courseIds);
      console.log('🔍 [FILTER] Class courseIds is array:', Array.isArray(liveClass.courseIds));
      
      if (!liveClass.courseIds) {
        console.log('❌ [FILTER] No courseIds property found');
        return false;
      }
      
      if (!Array.isArray(liveClass.courseIds)) {
        console.log('❌ [FILTER] courseIds is not an array:', liveClass.courseIds);
        return false;
      }
      
      if (liveClass.courseIds.length === 0) {
        console.log('❌ [FILTER] courseIds array is empty');
        return false;
      }
      
      // Check if any of the class courseIds match the current courseId
      const matches = liveClass.courseIds.some(id => {
        // Handle both object format {_id: "..."} and string format "..."
        let idStr = null;
        if (typeof id === 'string') {
          idStr = id.trim();
        } else if (id && typeof id === 'object') {
          // Handle MongoDB ObjectId objects
          idStr = (id._id || id.toString() || String(id)).toString().trim();
        } else if (id) {
          idStr = String(id).trim();
        }
        
        if (!idStr) {
          console.log('❌ [FILTER] Empty idStr, skipping');
          return false;
        }
        
        // Exact string match (case-sensitive for ObjectIds)
        const match = idStr === normalizedCourseId;
        
        console.log('🔍 [FILTER] Comparing:', {
          idStr,
          normalizedCourseId,
          match,
          idType: typeof id,
          idValue: id
        });
        return match;
      });
      
      console.log('🔍 [FILTER] Final match result for', liveClass.title, ':', matches);
      return matches;
    });
    
    console.log('✅ [FILTER] Filtered result:', filtered.length, 'classes for course', normalizedCourseId);
    console.log('✅ [FILTER] Filtered classes:', filtered.map(c => ({ title: c.title, _id: c._id, courseIds: c.courseIds })));
    
    // Sort by start time (earliest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.startTime);
      const dateB = new Date(b.startTime);
      return dateA - dateB;
    });
  }, [liveClasses]);

  // Refresh live classes (force refresh)
  const refreshLiveClasses = useCallback(() => {
    console.log('🔄 Force refreshing live classes...');
    return fetchLiveClasses(true);
  }, [fetchLiveClasses]);

  // Auto-refresh live classes every 2 minutes (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing live classes...');
      fetchLiveClasses(true);
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]); // ✅ Fixed: Removed dependencies causing infinite loop

  // Clear cache and debounce when component unmounts
  useEffect(() => {
    return () => {
      if (cacheTimeoutRef.current) {
        clearTimeout(cacheTimeoutRef.current);
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      console.log('🧹 LiveClassContext: Cleanup completed');
    };
  }, []);

  const contextValue = {
    liveClasses,
    loading,
    error,
    fetchLiveClasses,
    getLiveClassesForCourse,
    refreshLiveClasses,
    lastFetch
  };

  return (
    <LiveClassContext.Provider value={contextValue}>
      {children}
    </LiveClassContext.Provider>
  );
};
