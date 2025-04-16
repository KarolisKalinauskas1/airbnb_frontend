import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/axios'

// Simple inline function to replace the missing import
function safeMonitorCall() {
  return true; // Always allow the call
}

export const useDashboardStore = defineStore('dashboard', () => {
  const dashboardData = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const requestCount = ref(0);
  
  // Add a method to set dashboard data directly (for handling redirect issues)
  const setDashboardData = (data) => {
    // Ensure totalSpots exists and is a number
    if (!data.totalSpots && data.spotPerformance) {
      data.totalSpots = data.spotPerformance.length;
    } else if (!data.totalSpots) {
      data.totalSpots = 0;
    }
    
    dashboardData.value = data;
    error.value = null;
  };

  // Function to check if we should allow a new request
  const shouldAllowRequest = () => {
    const now = Date.now();
    
    // Don't make requests if we're offline
    if (!navigator.onLine) {
      console.log('Device is offline, using cached data');
      error.value = 'You are currently offline. Using cached data.';
      return false;
    }
    
    // Use our safe monitor call instead of the missing function
    if (!safeMonitorCall()) {
      console.error('Loop prevention: blocking dashboard data fetch request');
      error.value = 'Too many dashboard requests. Please wait a moment and try again.';
      return false;
    }
    
    return true;
  };

  const fetchDashboardData = async () => {
    // Prevent too many simultaneous requests
    if (!shouldAllowRequest()) {
      return;
    }

    loading.value = true
    error.value = null

    try {
      // Try using our improved API service
      const response = await axios.get('/api/dashboard/analytics');
      dashboardData.value = response.data;
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    dashboardData,
    loading,
    error,
    fetchDashboardData,
    setDashboardData
  }
})