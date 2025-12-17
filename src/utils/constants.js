// 🔧 FIX: Remove /api/v1/ prefix since it's already in baseURL
export const API_ENDPOINTS = {
  USER_SIGNUP: '/user/signupWithPhone',
  USER_LOGIN: '/user/loginWithPhone',
  USER_PROFILE: '/user/getProfile',
  USER_UPDATE: '/user/updateProfile',
  USER_RESEND_OTP: '/user/resendOtp',
  COURSES: '/user/courses',
  LIVE_CLASSES: '/user/live-classes',
  CATEGORIES: '/admin/categories',
  SUBJECTS: '/admin/subjects',
  BANNERS: '/admin/banner',
  BOOKS: '/admin/books',
  FAQS: '/admin/faqs',
  SUBSCRIPTIONS: '/admin/subscriptions',
  INSTALLMENTS: '/admin/installments',
  PAYMENTS: '/payments/order',
  COUPONS_VALIDATE: '/coupons/validate',
  COUPONS_APPLY: '/coupons/apply',
  COUPONS_AVAILABLE: '/coupons/available',
  CHAT_SEND: '/chat/send',
  CHAT_USERS: '/chat/getUsersBasedOnRoles',
  FOLDERS: '/folders'
};

export const VALIDATION_RULES = {
  PHONE_MIN_LENGTH: 10,
  OTP_LENGTH: 4,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SESSION_TIMEOUT: 3600000, // 1 hour
  API_TIMEOUT: 30000 // 30 seconds
};

export const UI_CONSTANTS = {
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  PAGINATION_LIMIT: 10,
  CAROUSEL_AUTOPLAY_DELAY: 3000,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  OTP_TIMER_DURATION: 60, // 60 seconds
  // FIX: Messaging constants for scalability
  MAX_MESSAGES_PER_CHAT: 100,
  MAX_CONTEXT_MESSAGES: 50,
  MESSAGE_FETCH_LIMIT: 20,
  MAX_CONCURRENT_USERS: 500
};

export const SOCKET_CONFIG = {
  PROD_URL: 'https://lms-backend-724799456037.europe-west1.run.app',
  TRANSPORTS: ['websocket', 'polling'],
  RECONNECTION: true,
  RECONNECTION_ATTEMPTS: 5,
  RECONNECTION_DELAY: 1000
};

// Environment-based admin ID with fallback
export const ADMIN_ID = process.env.REACT_APP_ADMIN_ID || "672c7d5a2d4e5bbd2c57f8d7";

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_PHONE: 'Please enter a valid phone number format',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_FILE: 'Invalid file type or size',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.'
}; 