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
    this.REQUEST_TIMEOUT = 30000; // 30 seconds timeout for requests
    // Add request interceptor to handle auth token
    this.api.interceptors.request.use(async (config) => {
      try {
        const authStore = useAuthStore();
        // Ensure auth is initialized
        if (!authStore.initialized) {
          await authStore.initAuth();
        }        // Check if user is authenticated
        if (!authStore.isAuthenticated) {
          throw new Error('Authentication required');
        }
        // Check if user is owner - backend will handle owner validation
        if (!authStore.isOwner) {
          // Don't throw here - backend will handle owner validation
        }
        // Get the current session
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        } else {
          // Try to refresh the session
          const { data: refreshData } = await supabase.auth.refreshSession();
          const newSession = refreshData?.session;
          if (newSession?.access_token) {
            config.headers.Authorization = `Bearer ${newSession.access_token}`;
          } else {
            throw new Error('No valid authentication session');
          }
        }
        // Add timeout to the request
        config.timeout = this.REQUEST_TIMEOUT;
        return config;      } catch (error) {
        // Authentication error - handled silently in production
        return Promise.reject(error);
      }
    })
    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        // Log minimal information in production
        const errorInfo = {
          url: error.config?.url,
          status: error.response?.status
        };
        
        if (error.response?.status === 401) {
          try {
            const { data } = await supabase.auth.refreshSession();
            const newSession = data?.session;
            if (newSession?.access_token) {
              error.config.headers.Authorization = `Bearer ${newSession.access_token}`;
              return this.api.request(error.config);
            }
          } catch (refreshError) {
            // Session refresh failed
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
  }
  /**
   * Get analytics data
   * @param {Object} options - Request options
   * @param {boolean} options.forceRefresh - Whether to force a refresh of data
   * @param {string} options.token - Authentication token to use (optional)
   * @returns {Promise<Object>} - Analytics data
   */
  async getAnalytics(options = {}) {
    try {
      const { forceRefresh, token } = options;
      const endpoint = `/api/dashboard/analytics${forceRefresh ? '?refresh=true' : ''}`;      // Return cached data if available and not forcing refresh
      if (!forceRefresh) {
        const cachedData = requestCache.get();
        if (cachedData) {
          return cachedData;
        }
      }      // Check if the endpoint is currently locked
      if (this.requestLocks[endpoint]) {
        return this.pendingRequests[endpoint] || requestCache.get() || Promise.reject(new Error('Request in progress'));
      }
      // Prevent rapid identical requests
      const now = Date.now();
      if (
        this.requestTimestamps[endpoint] && 
        (now - this.requestTimestamps[endpoint] < this.MIN_REQUEST_INTERVAL)
      ) {
        // If we have pending request, use it, otherwise use cached data if available
        if (this.pendingRequests[endpoint]) {
          return this.pendingRequests[endpoint];
        } else if (requestCache.get()) {
          return requestCache.get();
        }
      }
      // Update timestamp for this endpoint
      this.requestTimestamps[endpoint] = now;
      // Check for pending requests to the same endpoint
      if (this.pendingRequests[endpoint]) {
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
      // Create the promise for this request
      this.pendingRequests[endpoint] = (async () => {
        try {
          const response = await this.api.get(endpoint, config);          const rawData = response.data;
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
            };            // Processed data is now ready for caching
            // Cache data for future requests
            requestCache.set(processedData);
            return processedData;
          }
          return rawData;        } catch (error) {
          throw error;
        } finally {
          // Clear pending request reference after a delay
          // This prevents duplicate requests that can happen during component mount/update cycles
          setTimeout(() => {
            delete this.pendingRequests[endpoint];
            delete this.requestLocks[endpoint]; // Also unlock the endpoint
          }, this.PENDING_CLEAR_DELAY);
        }
      })();
      return this.pendingRequests[endpoint];    } catch (error) {
      // Return cached data as fallback if available
      const cachedData = requestCache.get();
      if (cachedData) {
        return cachedData;
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
  }
  /**
   * Get owner bookings
   * @returns {Promise<Array>} List of bookings for owner's camping spots
   */  async getOwnerBookings() {
    try {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) {
        throw new Error('Not authenticated');
      }

      const response = await this.api.get('/api/dashboard/bookings', {
        retry: 0 // Disable retries for unauthorized requests
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Clear any stale auth state and throw a specific error
        const authStore = useAuthStore();
        await authStore.clearAuthState();
        throw new Error('Authentication required. Please log in again.');
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
}
// Create a single instance of the service
const dashboardService = new DashboardService();
export default dashboardService;