// src/api/axios.js
import axios from "axios";

// FIX: Environment-based URL selection with fallbacks
// Force the correct port to avoid any caching issues
const baseURL = process.env.REACT_APP_API_URL || "https://lms-backend-724799456037.europe-west1.run.app/api/v1"

// Debug: Log the actual baseURL being used
console.log('🔧 [DEBUG] Axios baseURL:', baseURL);
console.log('🔧 [DEBUG] REACT_APP_API_URL env var:', process.env.REACT_APP_API_URL);
console.log('🔧 [DEBUG] All environment variables:', Object.keys(process.env).filter(key => key.includes('API')));
 

// Create an instance of axios with enhanced configuration for local backend
const api = axios.create({
  baseURL,
  timeout: 30000, // FIX: Add 30 second timeout to prevent hanging requests
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  // Set withCredentials to false for local backend to avoid CORS issues
  withCredentials: false,
  // Add retry configuration
  retry: 3,
  retryDelay: 1000,
});

// Keep existing request interceptor (no changes to maintain compatibility)
// FIX: Reduce logging to prevent console spam and performance issues
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Debug: Log every API request
    console.log('🚀 [API REQUEST]', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// FIX: Add response interceptor for better error handling with retry logic
// FIX: Reduce response logging to prevent console spam
api.interceptors.response.use(
  (response) => {
    // Only log errors, not successful responses
    return response;
  },
  async (error) => {
    const config = error.config;
    
    console.error('❌ HTTP error response:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      retryCount: config?.retryCount || 0
    });
    
    // Initialize retry count
    config.retryCount = config.retryCount || 0;
    
    // Handle network errors and timeouts with retry
    if (!error.response || error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('Network/timeout error:', error.message);
      
      // Retry logic for network errors
      if (config.retryCount < (config.retry || 3)) {
        config.retryCount++;
        console.log(`🔄 Retrying request (${config.retryCount}/${config.retry || 3}):`, config.url);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, (config.retryDelay || 1000) * config.retryCount));
        
        return api(config);
      }
      
      return Promise.reject({
        message: 'Network error. Please check your connection and try again.',
        type: 'NETWORK_ERROR',
        originalError: error
      });
    }

    // Handle CORS errors
    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
      console.error('CORS error detected:', error.message);
      return Promise.reject({
        message: 'Cross-origin request blocked. Please try again.',
        type: 'CORS_ERROR',
        originalError: error
      });
    }

    // Handle 401 unauthorized - don't redirect to avoid breaking existing flow
    if (error.response.status === 401) {
      console.warn('Unauthorized access - clearing token');
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      // Don't redirect here to maintain existing behavior
    }

    // Handle client errors (4xx) - don't retry these
    if (error.response.status >= 400 && error.response.status < 500) {
      console.warn(`Client error ${error.response.status}:`, error.response.data?.message || error.message);
      
      // Don't retry client errors like 409 (Conflict), 400 (Bad Request), etc.
      return Promise.reject(error);
    }

    // Handle server errors with retry for 5xx errors
    if (error.response.status >= 500) {
      console.error('Server error:', error.response.status);
      
      // Retry logic for server errors
      if (config.retryCount < (config.retry || 3)) {
        config.retryCount++;
        console.log(`🔄 Retrying server error (${config.retryCount}/${config.retry || 3}):`, config.url);
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, (config.retryDelay || 1000) * Math.pow(2, config.retryCount - 1)));
        
        return api(config);
      }
      
      return Promise.reject({
        message: 'Server error. Please try again later.',
        type: 'SERVER_ERROR',
        status: error.response.status,
        originalError: error
      });
    }

    // Return original error for all other cases to maintain existing behavior
    return Promise.reject(error);
  }
);

// Optionally add a function to set the Authorization token
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export default api;
