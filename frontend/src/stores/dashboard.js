import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/axios'

export const useDashboardStore = defineStore('dashboard', () => {
  const dashboardData = ref({
    revenue: {
      total: 0,
      monthly: 0,
      average: 0,
      projected: 0,
      growth: 0,
      cancelled: 0 // Add this property to the initial state
    },
    bookings: {
      total: 0,
      monthly: 0,
      averageDuration: 0,
      occupancyRate: 0,
      growth: 0,
      active: 0
    },
    popularSpots: [],
    spotPerformance: [],
    recentBookings: [],
    totalSpots: 0
  })

  const loading = ref(false)
  const error = ref(null)

  // Add loading tracker with timestamp to detect stale requests
  const requestStartTime = ref(0);
  const REQUEST_TIMEOUT = 15000; // 15 seconds max for a request

  const fetchDashboardData = async () => {
    // Check if we're already loading and the request isn't stale
    const currentTime = Date.now();
    if (loading.value) {
      // If the current request has been pending too long, allow a new one
      if (currentTime - requestStartTime.value < REQUEST_TIMEOUT) {
        console.log('Dashboard data loading already in progress, skipping duplicate request');
        return dashboardData.value;
      } else {
        console.log('Previous dashboard request timed out, allowing new request');
      }
    }
    
    loading.value = true;
    requestStartTime.value = currentTime;
    error.value = null;
    
    try {
      const { data } = await axios.get('/api/dashboard/analytics', {
        params: { _t: currentTime }, // Cache busting
        withCredentials: true,
        timeout: 10000
      });
      
      console.log('Dashboard data received:', data);
      
      // Make sure all expected properties exist, using defaults if not
      dashboardData.value = {
        ...dashboardData.value, // Keep the initial structure
        ...data,
        revenue: {
          ...dashboardData.value.revenue,
          ...(data.revenue || {}),
          cancelled: data.revenue?.cancelled || 0
        },
        totalSpots: data.spotPerformance?.length || 0
      };
      
      // Store successful data in sessionStorage as backup
      sessionStorage.setItem('dashboardData', JSON.stringify(dashboardData.value));
      return dashboardData.value;
      
    } catch (err) {
      error.value = 'Failed to fetch dashboard data';
      console.error('Dashboard fetch error:', err);
      
      // Try to restore data from sessionStorage
      const savedData = sessionStorage.getItem('dashboardData');
      if (savedData) {
        try {
          dashboardData.value = JSON.parse(savedData);
          console.log('Restored dashboard data from session cache');
        } catch (parseError) {
          console.error('Failed to parse saved dashboard data', parseError);
        }
      }
      
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    dashboardData,
    loading,
    error,
    fetchDashboardData
  }
})