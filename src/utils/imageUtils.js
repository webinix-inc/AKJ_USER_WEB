// Utility functions for handling course images

// Use separate URL for image streaming (with port for local development)
// Priority: Environment variable > Dynamic detection based on hostname
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const SERVER_BASE_URL = process.env.REACT_APP_IMAGE_URL || 
  (isLocalhost ? 'https://lms-backend-724799456037.europe-west1.run.app' : 'https://lms-backend-724799456037.europe-west1.run.app');
const API_BASE_URL = process.env.REACT_APP_API_URL || "https://lms-backend-724799456037.europe-west1.run.app/api/v1";

// Configuration for image handling
// Note: Backend streaming endpoints may not exist - use direct URLs from API responses

/**
 * Validate if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid ObjectId format
 */
export const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return id.length === 24 && /^[a-f0-9]{24}$/i.test(id);
};

/**
 * Validate if a course object has valid data for image generation
 * @param {Object} course - The course object
 * @returns {Object} - Validation result with isValid and reason
 */
export const validateCourseForImage = (course) => {
  if (!course) {
    return { isValid: false, reason: 'No course object provided' };
  }
  
  if (course._id && !isValidObjectId(course._id)) {
    return { 
      isValid: false, 
      reason: `Invalid course ID format: ${course._id} (length: ${course._id.length})` 
    };
  }
  
  return { isValid: true, reason: 'Valid course object' };
};

/**
 * Get the streaming URL for a course image
 * @param {string} courseId - The course ID
 * @returns {string} - The streaming URL for the course image
 */
export const getCourseImageUrl = (courseId) => {
  if (!isValidObjectId(courseId)) {
    // Invalid course ID
    return getBlankImageUrl();
  }
  
  // 🔧 FIX: Use proper streaming endpoint with course folder
  const url = `${SERVER_BASE_URL}/api/v1/stream/image/${courseId}?folder=course`;
  // Generated course image URL with course folder
  return url;
};

/**
 * Get the streaming URL for any S3 image
 * @param {string} s3Key - The S3 key or filename
 * @param {string} folder - The S3 folder (default: 'images')
 * @returns {string} - The streaming URL for the image
 */
export const getS3ImageUrl = (s3Key, folder = 'images') => {
  if (!s3Key) return getBlankImageUrl();
  
  // If it's already a full URL, return it directly (bypass streaming)
  if (s3Key.startsWith('http://') || s3Key.startsWith('https://')) {
    console.log('🔗 [DEBUG] S3 key is already a full URL, using directly:', s3Key);
    return s3Key;
  }
  
  // Validate that this is not being used as a course ID
  if (s3Key.length < 24 && /^\d+$/.test(s3Key)) {
    console.warn('🖼️ getS3ImageUrl: Detected numeric string that might be misused as course ID:', s3Key);
    return getBlankImageUrl();
  }
  
  // 🔧 FIX: Use backend streaming endpoints (they DO exist and handle S3 auth)
  // The backend can authenticate with S3, but direct S3 access fails due to permissions
  console.log('🔧 [FIX] Using backend streaming endpoint for authenticated S3 access:', s3Key);
  
  // Use the backend streaming endpoint which handles S3 authentication
  const streamUrl = `${SERVER_BASE_URL}/api/v1/stream/image/${encodeURIComponent(s3Key)}?folder=${encodeURIComponent(folder)}`;
  console.log('🔧 [FIX] Generated streaming URL:', streamUrl);
  return streamUrl;
};

/**
 * Preload critical images to improve performance
 * @param {Array} imageUrls - Array of image URLs to preload
 */
export const preloadImages = (imageUrls) => {
  if (!Array.isArray(imageUrls)) return;
  
  imageUrls.forEach(url => {
    if (url && typeof url === 'string') {
      const img = new Image();
      img.src = url;
      // Don't add to DOM, just trigger the download
    }
  });
};

/**
 * Get a high-quality placeholder image URL
 * @returns {string} - High-quality placeholder image URL
 */
export const getBlankImageUrl = () => {
  // Return a high-quality placeholder instead of transparent pixel
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDE4NVYxMzVIMTc1VjEyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE2NSAxNDVIMjM1VjE1NUgxNjVWMTQ1WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMTg1IDEzNUgxOTVWMTQ1SDE4NVYxMzVaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xOTUgMTI1SDIwNVYxMzVIMTk1VjEyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTIwNSAxMzVIMjE1VjE0NUgyMDVWMTM1WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMjE1IDEyNUgyMjVWMTM1SDIxNVYxMjVaIiBmaWxsPSIjOUNBM0FGIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3MjgwIiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0Ij5XYWthZGUgQ2xhc3NlczwvdGV4dD4KPC9zdmc+';
};

/**
 * Handle image load errors with intelligent fallback and retry limiting
 * @param {Event} event - The error event
 * @param {Object} course - Optional course object for alternative URLs
 */
export const handleImageError = (event, course = null) => {
  const currentSrc = event.target.src;
  const imgElement = event.target;
  
  // Initialize retry counter if not exists
  if (!imgElement.dataset.retryCount) {
    imgElement.dataset.retryCount = '0';
  }
  
  const retryCount = parseInt(imgElement.dataset.retryCount);
  const maxRetries = 2; // Limit to 2 retries to prevent endless loops
  
  console.log(`🖼️ Image load error for: ${currentSrc} (retry ${retryCount}/${maxRetries})`);
  
  // Prevent infinite loop - if already showing blank image or exceeded retries
  if (currentSrc === getBlankImageUrl() || retryCount >= maxRetries) {
    console.log('🖼️ Using blank image (max retries reached or already blank)');
    imgElement.src = getBlankImageUrl();
    imgElement.onerror = null; // Prevent infinite loop
    return;
  }
  
  // Increment retry counter
  imgElement.dataset.retryCount = (retryCount + 1).toString();
  
  // If we have course data, try alternative sources
  if (course && retryCount === 0) {
    // Validate course ID format (MongoDB ObjectId should be 24 characters)
    if (course._id && course._id.length !== 24) {
      console.warn('🖼️ Invalid course ID format:', course._id, 'Length:', course._id.length);
      imgElement.src = getBlankImageUrl();
      imgElement.onerror = null;
      return;
    }
    
    // Handle book images
    if (course.imageUrl && (currentSrc.includes('/stream/book-image/') || currentSrc.includes('/stream/image/'))) {
      console.log('📚 Retrying book image with alternative source');
      if (currentSrc.includes('/stream/book-image/')) {
        // If current was book streaming endpoint, try direct S3 URL
        imgElement.src = getS3ImageUrl(course.imageUrl);
      } else {
        // If current was S3 streaming, try book-specific endpoint
        imgElement.src = getBookImageUrl(course._id);
      }
      return;
    }
    
    // Handle course images
    if (currentSrc.includes('/stream/course-image/') && course.courseImage && course.courseImage.length > 0) {
      console.log('🖼️ Retrying with S3 direct URL');
      imgElement.src = getS3ImageUrl(course.courseImage[0]);
      return;
    }
    
    // First retry: If current URL was S3 streaming, try course-specific endpoint
    if (currentSrc.includes('/stream/image/') && course._id) {
      console.log('🖼️ Retrying with course-specific endpoint');
      imgElement.src = getCourseImageUrl(course._id);
      return;
    }
  }
  
  // Final fallback to blank image
  console.log('🖼️ Using blank image (no more alternatives)');
  imgElement.src = getBlankImageUrl();
  imgElement.onerror = null; // Prevent infinite loop
};

/**
 * Get optimized course image with blank image handling
 * @param {Object} course - The course object
 * @returns {string} - The optimized image URL
 */
export const getOptimizedCourseImage = (course) => {
  // Validate course object
  const validation = validateCourseForImage(course);
  if (!validation.isValid) {
    return getBlankImageUrl();
  }
  
  // 🔧 ONLY USE DIRECT URLs - streaming endpoints don't exist
  
  // Priority 1: If course has courseImage array, check if it's a direct URL first
  if (course.courseImage && course.courseImage.length > 0) {
    const imageUrl = course.courseImage[0];
    
    // If it's already a full URL, use it directly (this includes pre-signed URLs from backend)
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      return imageUrl;
    }
    
    // If it's a relative S3 key, construct the streaming URL (fallback)
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.length > 0) {
      return getS3ImageUrl(imageUrl);
    }
    
    return getBlankImageUrl();
  }
  
  // Priority 2: If course has an ID but no courseImage, don't construct S3 URLs
  // Direct S3 URLs will fail with 403 Forbidden - let backend handle pre-signed URLs
  if (course._id && isValidObjectId(course._id)) {
    return getBlankImageUrl();
  }
  
  // Fallback to blank image only as last resort
  return getBlankImageUrl();
};

/**
 * Get the streaming URL for a user profile image
 * @param {string} userId - The user ID
 * @returns {string} - The streaming URL for the user image
 */
export const getUserImageUrl = (userId) => {
  if (!userId) return null;
  return `${SERVER_BASE_URL}/api/v1/stream/user-image/${userId}`;
};

/**
 * Get the streaming URL for a banner image
 * @param {string} bannerId - The banner ID
 * @returns {string} - The streaming URL for the banner image
 */
export const getBannerImageUrl = (bannerImageUrl) => {
  // 🔧 FIX: Backend now returns direct S3 URLs, so we can use them directly
  // No need for streaming endpoints since S3 URLs work with CORS
  if (!bannerImageUrl) return null;
  
  console.log('🔗 [DEBUG] Using direct S3 banner image URL:', bannerImageUrl);
  return bannerImageUrl;
};

/**
 * Get optimized user profile image with blank image handling
 * @param {Object} user - The user object
 * @returns {string} - The optimized image URL
 */
export const getOptimizedUserImage = (user) => {
  if (!user) return getBlankImageUrl();
  
  // If user has an ID and image, use the streaming endpoint
  if (user._id && user.image) {
    return getUserImageUrl(user._id);
  }
  
  // If user has image URL, try to use it via general streaming
  if (user.image) {
    return getS3ImageUrl(user.image);
  }
  
  // Fallback to blank image
  return getBlankImageUrl();
};

/**
 * Get optimized banner image with blank image handling
 * @param {Object} banner - The banner object
 * @returns {string} - The optimized image URL
 */
export const getOptimizedBannerImage = (banner) => {
  if (!banner) return getBlankImageUrl();
  
  // Priority 1: If banner has a direct image URL, use it directly (most common case)
  if (banner.image && (banner.image.startsWith('http://') || banner.image.startsWith('https://'))) {
    return banner.image;
  }
  
  // Priority 2: If banner has image filename, construct the most likely URL first
  if (banner.image) {
    const filename = banner.image.includes('/') ? banner.image.split('/').pop() : banner.image;
    
    // Return the most likely URL pattern first (reduces failed requests)
    // Based on common backend patterns, images are usually served from /images/ or /uploads/
    return `${API_BASE_URL}/images/${filename}`;
  }
  
  // Fallback to blank image
  return getBlankImageUrl();
};

/**
 * Get the streaming URL for a book image
 * @param {string} bookId - The book ID
 * @returns {string} - The streaming URL for the book image
 */
export const getBookImageUrl = (bookId) => {
  return `${SERVER_BASE_URL}/api/v1/stream/book-image/${bookId}`;
};

/**
 * Get optimized book image with blank image handling
 * @param {Object} book - The book object
 * @returns {string} - The optimized image URL
 */
export const getOptimizedBookImage = (book) => {
  if (!book) {
    console.log('📚 getOptimizedBookImage: No book provided, using blank image');
    return getBlankImageUrl();
  }
  
  console.log('📚 getOptimizedBookImage: Processing book:', book.name || book._id, 'imageUrl:', book.imageUrl);
  
  // Priority 1: If book has imageUrl field, use it via S3 streaming (most direct)
  if (book.imageUrl) {
    const s3Url = getS3ImageUrl(book.imageUrl);
    console.log('📚 getOptimizedBookImage: Using S3 direct URL:', s3Url);
    return s3Url;
  }
  
  // Priority 2: If book has an ID, use the streaming endpoint
  if (book._id) {
    const bookUrl = getBookImageUrl(book._id);
    console.log('📚 getOptimizedBookImage: Using book streaming endpoint:', bookUrl);
    return bookUrl;
  }
  
  // Fallback to blank image
  console.log('📚 getOptimizedBookImage: No image sources available, using blank image');
  return getBlankImageUrl();
};

/**
 * Get optimized quiz question image with error handling
 * @param {string} imageUrl - The raw image URL from question data
 * @returns {string} - The optimized image URL
 */
export const getOptimizedQuestionImage = (imageUrl) => {
  if (!imageUrl) {
    console.log('❓ getOptimizedQuestionImage: No image URL provided');
    return null;
  }
  
  console.log('❓ getOptimizedQuestionImage: Processing image URL:', imageUrl);
  
  // If it's already a full URL, use it directly
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    console.log('❓ getOptimizedQuestionImage: Using direct URL:', imageUrl);
    return imageUrl;
  }
  
  // If it's a relative path, construct the full URL
  if (imageUrl.startsWith('/')) {
    const fullUrl = `${API_BASE_URL}${imageUrl}`;
    console.log('❓ getOptimizedQuestionImage: Using constructed URL:', fullUrl);
    return fullUrl;
  }
  
  // If it's just a filename or path, try S3 streaming
  const s3Url = getS3ImageUrl(imageUrl);
  console.log('❓ getOptimizedQuestionImage: Using S3 streaming URL:', s3Url);
  return s3Url;
};

/**
 * Handle quiz question image errors with retry logic
 * @param {Event} event - The error event
 * @param {string} originalUrl - The original image URL
 */
export const handleQuestionImageError = (event, originalUrl) => {
  const imgElement = event.target;
  const retryCount = parseInt(imgElement.dataset.retryCount || '0');
  
  console.log('❓ Question image error:', originalUrl, 'Retry count:', retryCount);
  
  // Increment retry counter
  imgElement.dataset.retryCount = (retryCount + 1).toString();
  
  if (retryCount === 0) {
    // First retry: Try different URL construction
    if (originalUrl.includes('/stream/image/')) {
      // If it was a streaming URL, try direct S3
      const s3Url = getS3ImageUrl(originalUrl.split('/').pop());
      console.log('❓ Retrying with S3 URL:', s3Url);
      imgElement.src = s3Url;
      return;
    } else if (!originalUrl.startsWith('http')) {
      // If it was a relative URL, try full URL
      const fullUrl = `${SERVER_BASE_URL}/api/v1/stream/image/${originalUrl}`;
      console.log('❓ Retrying with streaming URL:', fullUrl);
      imgElement.src = fullUrl;
      return;
    }
  }
  
  // Final fallback: Hide image and show error
  console.log('❓ Question image failed permanently:', originalUrl);
  imgElement.style.display = 'none';
  imgElement.onerror = null; // Prevent infinite loop
};