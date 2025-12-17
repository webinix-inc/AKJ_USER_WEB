// Global API request manager to prevent duplicate calls
class APIRequestManager {
  constructor() {
    this.pendingRequests = new Map();
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache for dynamic data
    this.staticCacheTimeout = 300000; // 5 minutes for static data (categories, subjects)
    this.persistentCacheKey = 'api_cache_v2';
    this.loadPersistedCache();
  }

  // Generate a unique key for the request
  generateKey(method, url, params = {}) {
    const paramString = JSON.stringify(params);
    return `${method.toUpperCase()}_${url}_${paramString}`;
  }

  // Check if request is already pending
  isPending(key) {
    return this.pendingRequests.has(key);
  }

  // Load persisted cache from localStorage
  loadPersistedCache() {
    try {
      const persistedData = localStorage.getItem(this.persistentCacheKey);
      if (persistedData) {
        const parsed = JSON.parse(persistedData);
        Object.entries(parsed).forEach(([key, value]) => {
          if (Date.now() - value.timestamp < this.cacheTimeout) {
            this.cache.set(key, value);
          }
        });
      }
    } catch (error) {
      // Silently handle localStorage errors
    }
  }

  // Persist cache to localStorage (only for static data to reduce I/O)
  persistCache() {
    try {
      const cacheObj = {};
      this.cache.forEach((value, key) => {
        const timeout = this.isStaticData(key) ? this.staticCacheTimeout : this.cacheTimeout;
        if (Date.now() - value.timestamp < timeout && this.isStaticData(key)) {
          cacheObj[key] = value;
        }
      });
      localStorage.setItem(this.persistentCacheKey, JSON.stringify(cacheObj));
    } catch (error) {
      // Silently handle localStorage errors
    }
  }

  // Get cached response if available and not expired
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached) {
      // Use different cache timeouts for different types of data
      const timeout = this.isStaticData(key) ? this.staticCacheTimeout : this.cacheTimeout;
      if (Date.now() - cached.timestamp < timeout) {
        return cached.data;
      }
      this.cache.delete(key); // Remove expired cache
    }
    return null;
  }

  // Check if data is static (categories, subjects) vs dynamic (courses, profile)
  isStaticData(key) {
    return key.includes('/admin/categories') || 
           key.includes('/admin/subjects') || 
           key.includes('/admin/banner');
  }

  // Set cache
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    // Persist to localStorage for cross-session caching
    this.persistCache();
  }

  // Execute request with deduplication
  async executeRequest(apiCall, method, url, params = {}, useCache = true) {
    const key = this.generateKey(method, url, params);

    // Check cache first
    if (useCache) {
      const cached = this.getCached(key);
      if (cached) {
        return cached;
      }
    }

    // Check if request is already pending
    if (this.isPending(key)) {
      return this.pendingRequests.get(key);
    }

    // Execute the request
    const requestPromise = apiCall()
      .then(response => {
        // Cache successful response
        if (useCache) {
          this.setCache(key, response);
        }
        return response;
      })
      .catch(error => {
        // Don't cache errors
        throw error;
      })
      .finally(() => {
        // Remove from pending requests
        this.pendingRequests.delete(key);
      });

    // Store pending request
    this.pendingRequests.set(key, requestPromise);

    return requestPromise;
  }

  // Clear cache for specific pattern
  clearCache(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all cache
  clearAllCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      cacheKeys: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
const apiRequestManager = new APIRequestManager();

export default apiRequestManager;
