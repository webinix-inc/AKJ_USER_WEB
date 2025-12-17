import React, { createContext, useReducer, useContext, useEffect, useCallback, useRef } from "react";
import api from "../api/axios";
import axios from "axios"; // Added for public course fetching
import apiRequestManager from "../utils/apiRequestManager";

// Define action types
const FETCH_COURSES_REQUEST = "FETCH_COURSES_REQUEST";
const FETCH_COURSES_SUCCESS = "FETCH_COURSES_SUCCESS";
const FETCH_COURSES_FAILURE = "FETCH_COURSES_FAILURE";

const FETCH_CATEGORIES_REQUEST = "FETCH_CATEGORIES_REQUEST";
const FETCH_CATEGORIES_SUCCESS = "FETCH_CATEGORIES_SUCCESS";
const FETCH_CATEGORIES_FAILURE = "FETCH_CATEGORIES_FAILURE";

const FETCH_SUBJECTS_REQUEST = "FETCH_SUBJECTS_REQUEST";
const FETCH_SUBJECTS_SUCCESS = "FETCH_SUBJECTS_SUCCESS";
const FETCH_SUBJECTS_FAILURE = "FETCH_SUBJECTS_FAILURE";

const FETCH_FOLDER_CONTENTS_REQUEST = "FETCH_FOLDER_CONTENTS_REQUEST";
const FETCH_FOLDER_CONTENTS_SUCCESS = "FETCH_FOLDER_CONTENTS_SUCCESS";
const FETCH_FOLDER_CONTENTS_FAILURE = "FETCH_FOLDER_CONTENTS_FAILURE";

// Add new action types for updating course status (for future use)
// const UPDATE_COURSE_STATUS_REQUEST = "UPDATE_COURSE_STATUS_REQUEST";
// const UPDATE_COURSE_STATUS_SUCCESS = "UPDATE_COURSE_STATUS_SUCCESS";
// const UPDATE_COURSE_STATUS_FAILURE = "UPDATE_COURSE_STATUS_FAILURE";

// Initial state for the context
const initialState = {
  courses: null,
  subjects: null,
  categories: null,
  folderContents: null,
  loading: false,
  error: null,
};

// Create the reducer function
const courseReducer = (state, action) => {
  switch (action.type) {
    // Course-related actions
    case FETCH_COURSES_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_COURSES_SUCCESS:
      return { ...state, loading: false, courses: action.payload };
    case FETCH_COURSES_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // Category-related actions
    case FETCH_CATEGORIES_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_CATEGORIES_SUCCESS:
      return { ...state, loading: false, categories: action.payload };
    case FETCH_CATEGORIES_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // Subject-related actions
    case FETCH_SUBJECTS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_SUBJECTS_SUCCESS:
      return { ...state, loading: false, subjects: action.payload };
    case FETCH_SUBJECTS_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case FETCH_FOLDER_CONTENTS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_FOLDER_CONTENTS_SUCCESS:
      return { ...state, loading: false, folderContents: action.payload };
    case FETCH_FOLDER_CONTENTS_FAILURE:
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

// Create context
const CourseContext = createContext();

// Export custom hook to use the context
export const useCourseContext = () => {
  return useContext(CourseContext);
};

// Provider component
export const CourseProvider = ({ children }) => {
  const [state, dispatch] = useReducer(courseReducer, initialState);

  // Optimized public course fetching with better caching
  const fetchPublicCourses = useCallback(async (forceRefresh = false) => {
    // Check if already loading to prevent duplicate requests
    if (state.loading && !forceRefresh) {
      return;
    }
    
    if (state.courses && state.courses.length > 0 && !forceRefresh) {
      return;
    }
    
    dispatch({ type: FETCH_COURSES_REQUEST });
    
    try {
      // Use apiRequestManager for better caching and deduplication
      const response = await apiRequestManager.executeRequest(
        () => api.get('/user/courses'),
        'GET',
        '/user/courses',
        {},
        !forceRefresh
      );
      
      dispatch({ type: FETCH_COURSES_SUCCESS, payload: response?.data?.data || response?.data });
      
    } catch (error) {
      // Handle authentication errors gracefully
      if (error.response?.status === 401 || error.response?.status === 403) {
        dispatch({
          type: FETCH_COURSES_FAILURE,
          payload: "Unable to load courses at the moment. Please try refreshing the page.",
        });
        return;
      }
      
      // Provide user-friendly error messages based on error type
      let errorMessage = "Unable to load courses. Please try again later.";
      
      if (error.type === 'NETWORK_ERROR') {
        errorMessage = "Network connection issue. Please check your internet and try again.";
      } else if (error.type === 'CORS_ERROR') {
        errorMessage = "Connection blocked. Please refresh the page and try again.";
      } else if (error.type === 'SERVER_ERROR') {
        errorMessage = "Server is temporarily unavailable. Please try again in a few moments.";
      } else if (error.response?.status === 404) {
        errorMessage = "Course data not found. Please contact support.";
      }
      
      dispatch({
        type: FETCH_COURSES_FAILURE,
        payload: error.response?.data?.message || errorMessage,
      });
    }
  }, []); // Remove state dependencies to prevent infinite re-creation

  const fetchCourses = useCallback(async (forceRefresh = false) => {
    // Check if already loading to prevent duplicate requests
    if (state.loading && !forceRefresh) {
      return;
    }
    
    if (state.courses && state.courses.length > 0 && !forceRefresh) {
      return;
    }
    
    dispatch({ type: FETCH_COURSES_REQUEST });
    try {
      const response = await apiRequestManager.executeRequest(
        () => api.get("/user/courses"),
        'GET',
        '/user/courses',
        {},
        !forceRefresh
      );
      dispatch({ type: FETCH_COURSES_SUCCESS, payload: response?.data?.data });
    } catch (error) {
      dispatch({
        type: FETCH_COURSES_FAILURE,
        payload: error.response?.data?.message || "Something went wrong",
      });
    }
  }, []); // Remove state dependencies to prevent infinite re-creation

  // Fetch Categories with optimized caching
  const fetchCategories = async (forceRefresh = false) => {
    // Enhanced caching - check loading state and existing data
    if (state.loading && !forceRefresh) {
      return;
    }
    
    if (state.categories && state.categories.length > 0 && !forceRefresh) {
      return;
    }
    
    dispatch({ type: FETCH_CATEGORIES_REQUEST });
    try {
      const response = await apiRequestManager.executeRequest(
        () => api.get("/admin/categories"),
        'GET',
        '/admin/categories',
        {},
        !forceRefresh
      );
      dispatch({
        type: FETCH_CATEGORIES_SUCCESS,
        payload: response?.data?.data,
      });
    } catch (error) {
      dispatch({
        type: FETCH_CATEGORIES_FAILURE,
        payload: error.response?.data?.message || "Something went wrong",
      });
    }
  };

  // Fetch Subjects with optimized caching
  const fetchSubjects = async (forceRefresh = false) => {
    if (state.subjects && !forceRefresh) return; // Cache subjects
    dispatch({ type: FETCH_SUBJECTS_REQUEST });
    try {
      const response = await apiRequestManager.executeRequest(
        () => api.get("/admin/subjects"),
        'GET',
        '/admin/subjects',
        {},
        !forceRefresh
      );
      dispatch({ type: FETCH_SUBJECTS_SUCCESS, payload: response?.data?.data });
    } catch (error) {
      dispatch({
        type: FETCH_SUBJECTS_FAILURE,
        payload: error.response?.data?.message || "Something went wrong",
      });
    }
  };

  // FIX: Add caching and deduplication for folder contents
  const folderCache = useRef({});
  const folderFetchingRef = useRef({});
  
  const fetchFolderContents = useCallback(async (folderId, profileData, forceRefresh = false) => {
    dispatch({ type: FETCH_FOLDER_CONTENTS_REQUEST });

    try {
      const endpoint = profileData
        ? `/folders/${folderId}`
        : `/folders/user/${folderId}`;
      
      // Create unique cache key for each folder to prevent content mixing
      const cacheKey = `${endpoint}_${folderId}_${!!profileData}`;
      
      // Use global API request manager for deduplication and caching
      const response = await apiRequestManager.executeRequest(
        () => api.get(endpoint),
        'GET',
        cacheKey, // Use unique cache key instead of endpoint
        { folderId, hasProfile: !!profileData },
        !forceRefresh // Use cache unless force refresh
      );
      
      dispatch({
        type: FETCH_FOLDER_CONTENTS_SUCCESS,
        payload: response.data.folder,
      });
    } catch (error) {
      dispatch({
        type: FETCH_FOLDER_CONTENTS_FAILURE,
        payload:
          error.response?.data?.message || "Failed to fetch folder contents",
      });
    }
  }, []); // Empty dependency array since it only uses dispatch and api

  // FIX: Use useRef to track if initial fetch has been attempted and prevent duplicate requests
  const initialFetchAttempted = useRef(false);
  const fetchingRef = useRef(false);
  
  // Optimized sequential data loading with better performance
  useEffect(() => {
    const loadDataSequentially = async () => {
      // Only fetch if data is not already loaded and we haven't attempted initial fetch
      if ((!state.courses || state.courses.length === 0) && !state.loading && !initialFetchAttempted.current && !fetchingRef.current) {
        initialFetchAttempted.current = true;
        fetchingRef.current = true;
        
        try {
          // Load critical data first (courses) - this is what users see immediately
          await fetchPublicCourses(false);
          
          // Load secondary data in background with staggered timing
          // Categories are needed for filtering, so load them next
          setTimeout(() => {
            if ((!state.categories || state.categories.length === 0) && !state.loading) {
              fetchCategories(false);
            }
          }, 50); // Reduced delay for better perceived performance
          
          // Subjects are less critical, load them last
          setTimeout(() => {
            if ((!state.subjects || state.subjects.length === 0) && !state.loading) {
              fetchSubjects(false);
            }
          }, 100); // Reduced delay
          
        } finally {
          fetchingRef.current = false;
        }
      }
    };
    
    loadDataSequentially();
  }, []); // Remove dependencies to prevent infinite loops - only run once on mount

  return (
    <CourseContext.Provider
      value={{
        ...state,
        fetchCourses,
        fetchPublicCourses, // Export the new public fetch function
        fetchCategories,
        fetchSubjects,
        fetchFolderContents,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};
