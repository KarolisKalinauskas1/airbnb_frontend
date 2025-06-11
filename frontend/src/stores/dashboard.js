import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dashboardService from '@/services/dashboardService'
import { useAuthStore } from '@/stores/auth'
import { logDashboardRequest } from '@/utils/dashboardDebug'

// Helper to safely parse numbers
function safeParseNumber(value, defaultValue = 0) {
  // Handle null/undefined
  if (value === null || value === undefined) return defaultValue;
  // Return value if already a number (and not NaN)
  if (typeof value === 'number' && !isNaN(value)) return value;
  try {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  } catch {
    return defaultValue;
  }
}
// Maximum retry attempts for loading dashboard data
const MAX_RETRY_ATTEMPTS = 3;
export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const dashboardData = ref({
    revenue: {
      total: 0,
      monthly: 0,
      average: 0,
      projected: 0,
      growth: 0,
      cancelled: 0
    },
    bookings: {
      total: 0,
      monthly: 0,
      averageDuration: 0,
      occupancyRate: 0,
      growth: 0,
      active: 0,
      monthlyChange: 0,
      durationChange: 0
    },
    insights: {
      averageLeadTime: 0,
      overallCancellationRate: 0,
      repeatBookingRate: 0,
      weekendPopularity: 0,
      seasonalTrends: { peakMonth: 'Unknown', distribution: {} },
      peakDays: { peakDay: 'Unknown', lowestDay: 'Unknown', weekendPercentage: 0, distribution: [] },
      amenityImpact: []
    },
    popularSpots: [],
    spotPerformance: [],
    spotInsights: [],
    recentBookings: [],
    totalSpots: 0,
    currentMonth: '',
    totalBookedDays: 0,
    totalAvailableDays: 0,
    occupancyChange: 0,
    durationChange: 0,
    averageDuration: 0,
    lastRefreshed: null
  });
  const loading = ref(false)
  const error = ref(null)
  const debugInfo = ref({})
  const failedAttempts = ref(0)
  const useDebugData = ref(false)
  // Use debug button clicked
  const debugMode = ref(false)
  // Get data age in minutes
  const dataAge = computed(() => {
    if (!dashboardData.value.lastRefreshed) return 'Never updated';
    const ageInMinutes = Math.floor((Date.now() - dashboardData.value.lastRefreshed) / 60000);
    if (ageInMinutes < 1) return 'Just now';
    return `${ageInMinutes} minute${ageInMinutes !== 1 ? 's' : ''} ago`;
  })
  // Dashboard data getters
  const revenue = computed(() => dashboardData.value.revenue)
  const bookings = computed(() => dashboardData.value.bookings)
  const insights = computed(() => dashboardData.value.insights)
  /**
   * Process dashboard data and ensure all values are properly parsed as numbers
   */
  function processData(data) {
    if (!data) {
      console.error('No data provided to processData');
      return dashboardData.value;
    }
    // Use safe parsing to ensure all numbers are valid
    const safeData = {
      revenue: {
        total: safeParseNumber(data?.revenue?.total),
        monthly: safeParseNumber(data?.revenue?.monthly),
        average: safeParseNumber(data?.revenue?.average),
        projected: safeParseNumber(data?.revenue?.projected),
        growth: safeParseNumber(data?.revenue?.growth),
        cancelled: safeParseNumber(data?.revenue?.cancelled)
      },
      bookings: {
        total: safeParseNumber(data?.bookings?.total),
        monthly: safeParseNumber(data?.bookings?.monthly),
        averageDuration: safeParseNumber(data?.bookings?.averageDuration),
        occupancyRate: safeParseNumber(data?.bookings?.occupancyRate),
        growth: safeParseNumber(data?.bookings?.growth),
        active: safeParseNumber(data?.bookings?.active),
        monthlyChange: safeParseNumber(data?.bookings?.monthlyChange),
        durationChange: safeParseNumber(data?.bookings?.durationChange)
      },
      // Preserve nested structures but ensure numeric values are valid
      insights: {
        averageLeadTime: safeParseNumber(data?.insights?.averageLeadTime),
        overallCancellationRate: safeParseNumber(data?.insights?.overallCancellationRate),
        repeatBookingRate: safeParseNumber(data?.insights?.repeatBookingRate),
        weekendPopularity: safeParseNumber(data?.insights?.weekendPopularity),
        seasonalTrends: data?.insights?.seasonalTrends || { peakMonth: 'Unknown', distribution: {} },
        peakDays: data?.insights?.peakDays || { 
          peakDay: 'Unknown', 
          lowestDay: 'Unknown', 
          weekendPercentage: 0,
          distribution: [] 
        },
        amenityImpact: Array.isArray(data?.insights?.amenityImpact) 
          ? data.insights.amenityImpact.map(item => ({
              ...item,
              spotCount: safeParseNumber(item.spotCount),
              bookingCount: safeParseNumber(item.bookingCount),
              avgRevenuePerBooking: safeParseNumber(item.avgRevenuePerBooking),
              avgPerformance: safeParseNumber(item.avgPerformance),
              impact: safeParseNumber(item.impact)
            }))
          : []
      },
      popularSpots: Array.isArray(data?.popularSpots) 
        ? data.popularSpots.map(spot => ({
            ...spot,
            revenue: safeParseNumber(spot.revenue),
            bookings: safeParseNumber(spot.bookings),
            occupancyRate: safeParseNumber(spot.occupancyRate)
          }))
        : [],
      spotPerformance: Array.isArray(data?.spotPerformance)
        ? data.spotPerformance.map(spot => ({
            ...spot,
            performance: safeParseNumber(spot.performance),
            changePercentage: safeParseNumber(spot.changePercentage),
            revenue: safeParseNumber(spot.revenue),
            occupancyRate: safeParseNumber(spot.occupancyRate),
            bookings: safeParseNumber(spot.bookings)
          }))
        : [],
      spotInsights: Array.isArray(data?.spotInsights)
        ? data.spotInsights.map(spot => ({
            ...spot,
            repeatBookingRate: safeParseNumber(spot.repeatBookingRate),
            averageLeadTime: safeParseNumber(spot.averageLeadTime),
            cancellationRate: safeParseNumber(spot.cancellationRate),
            weekendPopularity: safeParseNumber(spot.weekendPopularity)
          }))
        : [],
      recentBookings: Array.isArray(data?.recentBookings)
        ? data.recentBookings.map(booking => ({
            ...booking,
            revenue: safeParseNumber(booking.revenue)
          }))
        : [],
      durationChange: safeParseNumber(data?.durationChange),
      occupancyChange: safeParseNumber(data?.occupancyChange),
      totalSpots: safeParseNumber(data?.totalSpots || data?.spotPerformance?.length),
      currentMonth: data?.currentMonth || '',
      totalBookedDays: safeParseNumber(data?.totalBookedDays),
      totalAvailableDays: safeParseNumber(data?.totalAvailableDays),
      averageDuration: safeParseNumber(data?.averageDuration),
      lastRefreshed: Date.now()
    };
    // Save debugging info
    debugInfo.value = {
      timestamp: new Date().toISOString(),
      hasRevenue: !!data?.revenue,
      hasBookings: !!data?.bookings,
      hasInsights: !!data?.insights,
      spotCount: safeData.spotPerformance.length,
      recentBookingsCount: safeData.recentBookings.length,
      revenueTotal: safeData.revenue.total,
      bookingsTotal: safeData.bookings.total,
      dataType: typeof data
    };
    return safeData;
  }  /**
   * Load dashboard data
   */
  async function loadDashboardData(forceRefresh = false) {
    // Log the dashboard store load attempt
    logDashboardRequest('store_load_dashboard', { 
      forceRefresh, 
      currentlyLoading: loading.value,
      hasExistingData: !!dashboardData.value?.revenue
    })
    
    // Prevent multiple simultaneous loads
    if (loading.value && !forceRefresh) {
      console.log('Dashboard store already loading, skipping...');
      logDashboardRequest('store_load_skipped', { reason: 'already_loading' })
      return dashboardData.value;
    }
    
    // Add a timeout to prevent infinite loading states
    const loadingTimeout = setTimeout(() => {
      if (loading.value) {
        console.error('Dashboard loading timeout - forcing completion');
        loading.value = false;
        error.value = 'Loading timeout - please try again';
      }
    }, 30000); // 30 second timeout
    
    try {
      loading.value = true;
      error.value = null;
      
      // Get the auth store to check for token and permissions
      const authStore = useAuthStore();
      
      // Ensure auth is initialized
      if (!authStore.initialized) {
        await authStore.initAuth();
      }
      
      const token = authStore.token;
      
      // Check if user is an owner - simplified check to prevent loops
      if (!authStore.isOwner) {
        console.warn('User is not an owner, dashboard access restricted');
        throw new Error('Owner account required to view analytics');
      }
      
      // Decide whether to use debug data or real data
      let data;
      if (useDebugData.value) {
        data = await dashboardService.getDebugAnalytics();
      } else {
        // Use dashboard service with forced refresh
        data = await dashboardService.getAnalytics({ 
          forceRefresh,
          token 
        });
      }
        // Verify we got valid data
      if (!data || !data.revenue || !data.bookings) {
        // Reset attempts and throw error without recursive retry
        failedAttempts.value = 0;
        throw new Error('Invalid or incomplete dashboard data received');
      }
      
      // Reset failed attempts on success
      failedAttempts.value = 0;
      
      // Process and store the data
      dashboardData.value = processData(data);
      return dashboardData.value;
    } catch (err) {
      error.value = err.message || 'Failed to load dashboard data';
      console.error('Dashboard store error:', err);
      
      // If using debug data already failed, reset the flag
      if (useDebugData.value && failedAttempts.value >= MAX_RETRY_ATTEMPTS) {
        useDebugData.value = false;
        failedAttempts.value = 0;
      }      // Don't retry on authentication errors to prevent infinite loops
      if (err.message.includes('authentication') || err.message.includes('Owner account')) {
        failedAttempts.value = 0; // Reset attempts
        loading.value = false; // Ensure loading is cleared
        // Clear any pending requests when auth fails
        if (typeof dashboardService.clearPendingRequests === 'function') {
          dashboardService.clearPendingRequests();
        }
      }
      
      throw err;
    } finally {
      // Clear the timeout and ensure loading is always set to false
      clearTimeout(loadingTimeout);
      loading.value = false;
    }
  }
  /**
   * Toggle debug mode
   */
  function toggleDebugMode() {
    debugMode.value = !debugMode.value;
    return debugMode.value;
  }
  /**
   * Use debug data for the dashboard
   */
  async function useDebugDataMode() {
    useDebugData.value = true;
    return await loadDashboardData(true);
  }
  /**
   * Reset back to real data mode
   */
  async function resetToRealData() {
    useDebugData.value = false;
    return await loadDashboardData(true);
  }
  return {
    dashboardData,
    loading,
    error,
    debugInfo,
    debugMode,
    dataAge,
    revenue,
    bookings,
    insights,
    loadDashboardData,
    toggleDebugMode,
    useDebugDataMode,
    resetToRealData
  }
})