import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
// Implement a more robust request cache with a longer timeout
const requestCache = {
  data: null,
  timestamp: null,
  CACHE_TIMEOUT: 120000, // Increase to 2 minutes to reduce frequent refreshes
    set(data) {
    if (!data) {
      return;
    }
    // Add timestamp to the data
    this.data = {
      ...data,
      _cacheTimestamp: Date.now()
    };
    this.timestamp = Date.now();
  },
  get() {
    if (this.timestamp && Date.now() - this.timestamp < this.CACHE_TIMEOUT) {
      return this.data;
    }
    return null;
  },
  clear() {
    this.data = null;
    this.timestamp = null;
  }
};
/**
 * Parse numbers safely with fallbacks
 * @param {any} value - Value to parse as number
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed number or default
 */
function safeParseNumber(value, defaultValue = 0) {
  // Return the default for null/undefined values
  if (value === null || value === undefined) return defaultValue;
  // If it's already a number and not NaN, return it
  if (typeof value === 'number' && !isNaN(value)) return value;
  try {
    // Try to convert string to number with parseFloat
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  } catch (e) {
    return defaultValue;
  }
}
/**
 * Dashboard data service
 */
class DashboardService {
  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    this.pendingRequests = {};
    this.requestTimestamps = {}; // Track when requests were made
    this.requestLocks = {}; // Track locked requests to prevent duplicates
    this.MIN_REQUEST_INTERVAL = 2000; // Minimum 2 seconds between identical requests
    this.PENDING_CLEAR_DELAY = 1500; // Increased from 500ms to 1.5s to better prevent duplicates
    this.REQUEST_TIMEOUT = 30000; // 30 seconds timeout for requests    // Add request interceptor to handle auth token
    this.api.interceptors.request.use(async (config) => {
      try {
        const authStore = useAuthStore();
        
        // Initialize auth if not already done
        if (!authStore.initialized) {
          try {
            await authStore.initAuth();
          } catch (initError) {
            console.warn('Auth initialization failed:', initError.message);
          }
        }
        
        let token = null;
        
        // Try multiple sources for the token
        // 1. Try to get from current Supabase session
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.access_token) {
            token = data.session.access_token;
            console.log('Using Supabase session token');
          }
        } catch (sessionError) {
          console.warn('Failed to get Supabase session:', sessionError.message);
        }
        
        // 2. Fallback to auth store token
        if (!token && authStore.token) {
          token = authStore.token;
          console.log('Using auth store token');
        }
        
        // 3. Fallback to localStorage
        if (!token) {
          const storedToken = localStorage.getItem('supabase.auth.token');
          if (storedToken) {
            try {
              const parsed = JSON.parse(storedToken);
              if (parsed.access_token) {
                token = parsed.access_token;
                console.log('Using localStorage token');
              }
            } catch (parseError) {
              console.warn('Failed to parse stored token');
            }
          }
        }
        
        // Add the token if we found one
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Added authorization header to request');
        } else {
          console.warn('No authentication token found');
        }
        
        // Add timeout to the request
        config.timeout = this.REQUEST_TIMEOUT;
        return config;
      } catch (error) {
        console.warn('Request interceptor error:', error.message);
        // Still return the config to let the request proceed
        return config;
      }
    })// Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        // Only attempt refresh once per request to prevent infinite loops
        if (error.response?.status === 401 && !error.config._retryAttempted) {
          try {
            error.config._retryAttempted = true;
            
            // Try to refresh the session
            const { data } = await supabase.auth.refreshSession();
            const newSession = data?.session;
            
            if (newSession?.access_token) {
              error.config.headers.Authorization = `Bearer ${newSession.access_token}`;
              return this.api.request(error.config);
            } else {
              // Only clear session if refresh explicitly failed
              console.log('Session refresh failed - clearing session');
              const authStore = useAuthStore();
              await authStore.clearSession();
            }
          } catch (refreshError) {
            console.log('Session refresh error:', refreshError.message);
            // Don't automatically clear session - let user try again
          }
        }
        return Promise.reject(error);
      }
    );
  }  /**
   * Check if user has owner permissions
   * @returns {Promise<Object>} Permission status
   */
  async checkOwnerPermissions() {
    try {
      const response = await this.api.get('/api/dashboard/permissions');
      return response.data;
    } catch (error) {
      return { isOwner: false, error: error.message };
    }
  }  /**
   * Get analytics data
   * @param {Object} options - Request options
   * @param {boolean} options.forceRefresh - Whether to force a refresh of data
   * @param {string} options.token - Authentication token to use (optional)
   * @returns {Promise<Object>} - Analytics data
   */
  async getAnalytics(options = {}) {
    try {
      const { forceRefresh, token } = options;
      const endpoint = `/api/dashboard/analytics${forceRefresh ? '?refresh=true' : ''}`;      
      
      // Return cached data if available and not forcing refresh
      if (!forceRefresh) {
        const cachedData = requestCache.get();
        if (cachedData) {
          console.log('Returning cached analytics data');
          return cachedData;
        }
      }      
      
      // Check if the endpoint is currently locked
      if (this.requestLocks[endpoint]) {
        console.log('Request already in progress, returning pending promise');
        return this.pendingRequests[endpoint] || requestCache.get() || Promise.reject(new Error('Request in progress'));
      }
      
      // Prevent rapid identical requests with more aggressive throttling
      const now = Date.now();
      if (
        this.requestTimestamps[endpoint] && 
        (now - this.requestTimestamps[endpoint] < this.MIN_REQUEST_INTERVAL)
      ) {
        console.log('Request throttled, using cached data or pending request');
        // If we have pending request, use it, otherwise use cached data if available
        if (this.pendingRequests[endpoint]) {
          return this.pendingRequests[endpoint];
        } else if (requestCache.get()) {
          return requestCache.get();
        } else {
          // Throttle the request by throwing an error
          throw new Error('Request throttled - please wait before retrying');
        }
      }
      
      // Update timestamp for this endpoint
      this.requestTimestamps[endpoint] = now;
      
      // Check for pending requests to the same endpoint
      if (this.pendingRequests[endpoint]) {
        console.log('Returning existing pending request');
        return this.pendingRequests[endpoint];
      }
      
      // Lock this endpoint to prevent duplicate requests
      this.requestLocks[endpoint] = true;
      
      // Configure request with the provided token if available
      const config = {};
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        };
      }
      
      console.log('Making new analytics request to:', endpoint);
      
      // Create the promise for this request
      this.pendingRequests[endpoint] = (async () => {
        try {
          const response = await this.api.get(endpoint, config);          
          const rawData = response.data;
          
          // Transform data to ensure proper numeric types
          if (rawData) {
            // Deep clone the data to avoid reference issues
            const data = JSON.parse(JSON.stringify(rawData));
            
            // Process and ensure all numeric values are properly parsed
            const processedData = {
              ...data,
              revenue: {
                total: safeParseNumber(data.revenue?.total),
                monthly: safeParseNumber(data.revenue?.monthly),
                average: safeParseNumber(data.revenue?.average),
                projected: safeParseNumber(data.revenue?.projected),
                growth: safeParseNumber(data.revenue?.growth),
                cancelled: safeParseNumber(data.revenue?.cancelled),
                monthlyCancelled: safeParseNumber(data.revenue?.monthlyCancelled)
              },
              bookings: {
                total: safeParseNumber(data.bookings?.total),
                monthly: safeParseNumber(data.bookings?.monthly),
                averageDuration: safeParseNumber(data.bookings?.averageDuration),
                occupancyRate: safeParseNumber(data.bookings?.occupancyRate),
                growth: safeParseNumber(data.bookings?.growth),
                active: safeParseNumber(data.bookings?.active),
                monthlyChange: safeParseNumber(data.bookings?.monthlyChange),
                durationChange: safeParseNumber(data.bookings?.durationChange)
              },
              durationChange: safeParseNumber(data.durationChange),
              occupancyChange: safeParseNumber(data.occupancyChange),
              totalBookedDays: safeParseNumber(data.totalBookedDays),
              totalAvailableDays: safeParseNumber(data.totalAvailableDays),
              popularSpots: Array.isArray(data.popularSpots) 
                ? data.popularSpots.map(spot => ({
                    ...spot,
                    revenue: safeParseNumber(spot.revenue),
                    bookings: safeParseNumber(spot.bookings),
                    occupancyRate: safeParseNumber(spot.occupancyRate)
                  }))
                : [],
              spotPerformance: Array.isArray(data.spotPerformance)
                ? data.spotPerformance.map(spot => ({
                    ...spot,
                    performance: safeParseNumber(spot.performance),
                    changePercentage: safeParseNumber(spot.changePercentage),
                    revenue: safeParseNumber(spot.revenue),
                    occupancyRate: safeParseNumber(spot.occupancyRate)
                  }))
                : [],
              recentBookings: Array.isArray(data.recentBookings)
                ? data.recentBookings.map(booking => ({
                    ...booking,
                    revenue: safeParseNumber(booking.revenue)
                  }))
                : [],
              // Preserve other data structures without modification
              insights: data.insights,
              spotInsights: data.spotInsights,
              currentMonth: data.currentMonth,
              totalSpots: safeParseNumber(data.totalSpots)
            };            
            
            // Processed data is now ready for caching
            // Cache data for future requests
            requestCache.set(processedData);
            console.log('Analytics data processed and cached successfully');
            return processedData;
          }
          return rawData;        } catch (error) {
          console.error('Analytics request failed:', error);          
            // Handle specific error types
            if (error.response?.status === 401) {
              console.error('Dashboard request unauthorized - token may be invalid or expired');
              throw new Error('Authentication required - please log in again');
            } else if (error.response?.status === 403) {
              console.error('Dashboard request forbidden - user may not have owner permissions');
              throw new Error('Access denied - owner account required');
            } else if (error.response?.status === 429) {
              throw new Error('Too many requests - please wait before retrying');
            } else if (error.response?.status >= 500) {
              throw new Error('Server error - please try again later');
            }
            
            throw error;
        } finally {
          // Immediately clear the locks on completion or error to prevent stuck states
          delete this.pendingRequests[endpoint];
          delete this.requestLocks[endpoint];
        }
      })();
      
      return this.pendingRequests[endpoint];
    } catch (error) {
      // Return cached data as fallback if available (but only for non-auth errors)
      if (!error.message.includes('Authentication') && !error.message.includes('Access denied')) {
        const cachedData = requestCache.get();
        if (cachedData) {
          console.log('Returning cached data as fallback');
          return cachedData;
        }
      }
      throw error;
    }
  }
  /**
   * Get camping spots owned by the current user
   */  async getCampingSpots() {
    try {
      const response = await this.api.get('/api/dashboard/spots');
      return response.data;
    } catch (error) {
      throw error;
    }
  }  /**
   * Get owner bookings
   * @returns {Promise<Array>} List of bookings for owner's camping spots
   */
  async getOwnerBookings() {
    try {
      const response = await this.api.get('/api/dashboard/bookings');
      return response.data;
    } catch (error) {
      console.error('Error fetching owner bookings:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication required - please log in again');
      }
      throw error;
    }
  }
  async createSpot(spotData) {
    const response = await this.api.post('/api/dashboard/spots', spotData);
    return response.data;
  }
  async updateSpot(spotId, spotData) {
    const response = await this.api.put(`/api/dashboard/spots/${spotId}`, spotData);
    return response.data;
  }
  async deleteSpot(spotId) {
    const response = await this.api.delete(`/api/dashboard/spots/${spotId}`);
    return response.data;
  }
  /**
   * Clear all pending requests and locks (useful for breaking infinite loops)
   */
  clearPendingRequests() {
    console.log('Clearing all pending requests and locks');
    this.pendingRequests = {};
    this.requestLocks = {};
    this.requestTimestamps = {};
  }
}
// Create a single instance of the service
const dashboardService = new DashboardService();
export default dashboardService;