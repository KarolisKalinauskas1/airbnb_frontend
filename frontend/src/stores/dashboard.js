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
      growth: 0
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

  const fetchDashboardData = async () => {
    loading.value = true
    error.value = null
    try {
      const { data } = await axios.get('/api/dashboard/analytics')
      console.log('Dashboard data received:', data) // Debug log
      dashboardData.value = {
        ...data,
        totalSpots: data.spotPerformance?.length || 0
      }
    } catch (err) {
      error.value = 'Failed to fetch dashboard data'
      console.error('Dashboard fetch error:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    dashboardData,
    loading,
    error,
    fetchDashboardData
  }
})