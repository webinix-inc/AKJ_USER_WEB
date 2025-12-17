import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { jwtDecode } from "jwt-decode"; // To decode the JWT token
import api, { setAuthToken } from "../api/axios"; // Axios instance for API calls
import { ADMIN_ID } from "../utils/constants";
import { 
  startEnrollmentSync, 
  stopEnrollmentSync, 
  setAuthenticationStatus,
  setupVisibilitySync 
} from "../utils/enrollmentSync";
import apiRequestManager from "../utils/apiRequestManager";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [userData, setUserData] = useState(() => {
    const storedUser = localStorage.getItem("userData");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("token");
  });

  // FIX: Use useRef instead of let variable to prevent memory leak
  const logoutTimeoutRef = useRef(null);

  // Logout function
  const logout = useCallback(() => {
    setUserData(null);
    setProfileData(null);
    setIsAuthenticated(false);
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    
    // Stop enrollment sync
    setAuthenticationStatus(false);
    stopEnrollmentSync();
    
    // FIX: Properly clear timeout using ref
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }

    window.location.reload();
  }, []);

  // Check if token is expired
  const isTokenExpired = useCallback((token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      const expirationTime = decoded.exp * 1000;
      return Date.now() >= expirationTime;
    } catch (error) {
      return true;
    }
  }, []);

  // Set a logout timer for token expiration
  const setLogoutTimer = useCallback(
    (token) => {
      const decoded = jwtDecode(token);
      const expirationTime = decoded.exp * 1000;
      const timeLeft = expirationTime - Date.now();
      // FIX: Clear existing timeout using ref
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
      }
      // FIX: Set timeout using ref
      logoutTimeoutRef.current = setTimeout(() => {
        logout();
      }, timeLeft);
    },
    [logout]
  );

  // FIX: Add cleanup useEffect to prevent memory leaks
  useEffect(() => {
    return () => {
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
      }
    };
  }, []);

  // Debounced localStorage write to prevent blocking main thread
  useEffect(() => {
    if (userData) {
      // Use requestIdleCallback to write to localStorage during idle time
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          localStorage.setItem("userData", JSON.stringify(userData));
        });
      } else {
        // Fallback with setTimeout for browsers without requestIdleCallback
        setTimeout(() => {
          localStorage.setItem("userData", JSON.stringify(userData));
        }, 0);
      }
    }
  }, [userData]);

  // FIX: Add request deduplication to prevent multiple simultaneous calls
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef(0);
  
  // FIX: Centralized profile management with strict deduplication
  const profileInitialized = useRef(false);
  const profileFetchPromise = useRef(null);
  
  // Fetch user profile with STRICT deduplication and centralized management
  const fetchUserProfile = useCallback(async (forceRefresh = false) => {
    // Check if user is authenticated before fetching profile
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      return null;
    }
    
    // If profile is already initialized and no force refresh, return existing data
    if (profileInitialized.current && !forceRefresh && profileData) {
      return profileData;
    }
    
    // If there's already a fetch in progress, return that promise
    if (profileFetchPromise.current && !forceRefresh) {
      return profileFetchPromise.current;
    }
    
    // Create new fetch promise
    profileFetchPromise.current = (async () => {
      try {
        setLoading(true);
        
        // Use global API request manager for deduplication
        const response = await apiRequestManager.executeRequest(
          () => api.get("/user/getProfile"),
          'GET',
          '/user/getProfile',
          {},
          !forceRefresh // Use cache unless force refresh
        );
        
        const newProfileData = response.data.data;
        setProfileData(newProfileData);
        profileInitialized.current = true;
        
        // Only emit event if this is a meaningful update (not just initialization)
        if (forceRefresh || !profileData) {
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('profileUpdated', { 
              detail: { reason: forceRefresh ? 'force_refresh' : 'initial_fetch', timestamp: Date.now() } 
            }));
          }
        }
        
        return newProfileData;
      } catch (error) {
        // Handle authentication errors gracefully
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("userData");
          setIsAuthenticated(false);
          setUserData(null);
          setProfileData(null);
        }
        
        throw error;
      } finally {
        setLoading(false);
        profileFetchPromise.current = null; // Clear the promise
      }
    })();
    
    return profileFetchPromise.current;
  }, [profileData, isTokenExpired]);

  const reloadProfile = useCallback(() => {
    // Use fetchUserProfile with force refresh to bypass deduplication when explicitly requested
    fetchUserProfile(true);
  }, [fetchUserProfile]);

  // Initialize authentication and profile fetching
  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
      setAuthToken(token);
      setLogoutTimer(token);
      
      // FIX: Only fetch profile once on app startup with debouncing
      if (!profileInitialized.current) {
        // Use setTimeout to debounce profile fetching and prevent multiple calls
        const profileTimer = setTimeout(() => {
          fetchUserProfile(false);
        }, 100); // Small delay to allow other initialization to complete
        
        // Start enrollment sync for authenticated users (reduced frequency)
        setAuthenticationStatus(true);
        startEnrollmentSync(reloadProfile, 120000); // Sync every 2 minutes instead of 1
        
        // Setup visibility-based sync with throttling
        const cleanupVisibilitySync = setupVisibilitySync(() => {
          // Throttle visibility-based sync to prevent excessive calls
          if (Date.now() - (window.lastVisibilitySync || 0) > 30000) { // 30 second throttle
            window.lastVisibilitySync = Date.now();
            reloadProfile();
          }
        });
        
        // Store cleanup function
        return () => {
          clearTimeout(profileTimer);
          cleanupVisibilitySync();
        };
      }
    } else if (token && isTokenExpired(token)) {
      logout();
    } else {
      setIsAuthenticated(false);
    }
  }, []); // Remove function dependencies to prevent infinite loop

  // Listen for changes in localStorage (e.g., token removal)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "token" && !event.newValue) {
        logout();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [logout]);

  // Function to register a user (Signup)
  const registerUser = useCallback(async (userData) => {
    try {
      setLoading(true);
      console.log('🚀 Registering user with data:', userData);
      
      const response = await api.post("/user/signupWithPhone", userData);
      console.log('✅ Registration response:', response.data);
      
      // Validate response structure - backend returns data directly in response.data
      if (!response.data) {
        console.error('❌ Invalid response structure:', response.data);
        throw new Error('Invalid response from server');
      }
      
      // Backend returns: { status: 200, message: "...", data: { id, phone, otp } }
      const responseData = response.data.data || response.data;
      
      if (!responseData.id && !responseData.phone) {
        console.error('❌ Missing required response data:', responseData);
        throw new Error('Invalid response data from server');
      }
      
      setUserData(responseData);
      setLoading(false);
      return response.data;
    } catch (error) {
      console.error('❌ Registration error:', error);
      setLoading(false);
      
      // Enhanced error handling for registration
      if (error.response?.status === 409) {
        // User already exists - this is expected behavior
        throw {
          message: "User with this phone number already exists. Please try logging in instead.",
          status: 409,
          type: 'USER_EXISTS',
          originalError: error
        };
      } else if (error.response?.status >= 500) {
        // Handle server errors with more specific messages
        let serverErrorMessage = "Server error occurred. Please try again later.";
        
        if (error.response.data?.message) {
          if (error.response.data.message.includes('MeritHub')) {
            serverErrorMessage = "Registration successful but there was an issue with external services. You can still proceed with OTP verification.";
          } else {
            serverErrorMessage = error.response.data.message;
          }
        }
        
        throw {
          message: serverErrorMessage,
          status: error.response.status,
          type: 'SERVER_ERROR',
          originalError: error
        };
      } else if (error.response?.status >= 400) {
        // Handle other client errors
        throw {
          message: error.response.data?.message || "Registration failed. Please check your information.",
          status: error.response.status,
          type: 'CLIENT_ERROR',
          originalError: error
        };
      }
      
      // For network errors or other issues
      throw error.response ? error.response.data : error;
    }
  }, []);

  // Function to login a user (Request OTP)
  const loginUser = useCallback(async (phone) => {
    try {
      setLoading(true);
      const response = await api.post("/user/loginWithPhone", { phone });
      const { data } = response.data;
      setUserData(data);
      setLoading(false);
      return response.data;
    } catch (error) {
      setLoading(false);
      throw error.response ? error.response.data : error;
    }
  }, []);

  // Function to verify OTP and handle successful login/signup
  const verifyOTP = useCallback(
    async (userId, otp) => {
      try {
        setLoading(true);
        const response = await api.post(`/user/${userId}`, { userId, otp });
        const { data } = response.data;
        const token = data.token; // Assuming the token is directly within data
        setUserData(data);
        setIsAuthenticated(true);
        localStorage.setItem("token", token);
        localStorage.setItem("userData", JSON.stringify(data));
        setLogoutTimer(token);
        setAuthToken(token);
        setLoading(false);

        // After successful verification
        await fetchUserProfile();

        return data;
      } catch (error) {
        setLoading(false);
        throw error.response ? error.response.data : error;
      }
    },
    [fetchUserProfile]
  );

  // NOTE: Welcome messages are now handled automatically by the backend
  // during user registration/login - no need for frontend to send them

  // Function to resend OTP
  const resendOtp = useCallback(async (userId) => {
    try {
      setLoading(true);
      const response = await api.post(`/user/resendOtp/${userId}`);
      setLoading(false);
      return response.data;
    } catch (error) {
      setLoading(false);
      throw error.response ? error.response.data : error;
    }
  }, []);

  // Function to update user profile
  const updateUserProfile = useCallback(async (updatedUserData) => {
    try {
      setLoading(true);
      const response = await api.put("/user/updateProfile", updatedUserData);
      setProfileData(response.data.data); // Update cached profile data
      setLoading(false);
      return response.data;
    } catch (error) {
      setLoading(false);
      throw error.response ? error.response.data : error;
    }
  }, []);

  // Function to upload a profile picture
  const uploadProfilePicture = useCallback(async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.put("/user/updateProfile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setProfileData(response.data.data); // Update cached profile data
      setLoading(false);
      return response.data;
    } catch (error) {
      setLoading(false);
      throw error.response ? error.response.data : error;
    }
  }, []);

  // Remove the reloadTrigger useEffect since reloadProfile now directly calls fetchUserProfile

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      registerUser,
      loginUser,
      verifyOTP,
      fetchUserProfile,
      updateUserProfile,
      uploadProfilePicture,
      resendOtp,
      reloadProfile, // Expose reloadProfile to trigger profile reload
      userData,
      profileData,
      loading,
      isAuthenticated,
      logout,
    }),
    [
      registerUser,
      loginUser,
      verifyOTP,
      fetchUserProfile,
      updateUserProfile,
      uploadProfilePicture,
      resendOtp,
      reloadProfile,
      userData,
      profileData,
      loading,
      isAuthenticated,
      logout,
    ]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

// Custom hook to use UserContext
export const useUser = () => useContext(UserContext);
