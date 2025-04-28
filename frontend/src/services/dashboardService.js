import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

/**
 * Dashboard data service
 */
class DashboardService {
  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Add request interceptor to handle auth token
    this.api.interceptors.request.use(async (config) => {
      const authStore = useAuthStore()
      
      // Ensure auth is initialized
      if (!authStore.initialized) {
        console.log('Auth not initialized, initializing...')
        await authStore.initAuth()
      }

      // Check if user is authenticated
      if (!authStore.isAuthenticated) {
        console.log('User is not authenticated')
        throw new Error('Authentication required')
      }

      // Check if user is owner
      if (!authStore.isOwner) {
        console.log('User is not an owner')
        throw new Error('Owner account required')
      }
      
      // Get the current session
      const { data } = await supabase.auth.getSession()
      const session = data?.session
      console.log('Current session:', session ? 'exists' : 'none')
      
      if (session?.access_token) {
        console.log('Using existing session token')
        config.headers.Authorization = `Bearer ${session.access_token}`
      } else {
        console.log('No session token, trying to refresh...')
        // Try to refresh the session
        const { data: refreshData } = await supabase.auth.refreshSession()
        const newSession = refreshData?.session
        
        if (newSession?.access_token) {
          console.log('Got new session token')
          config.headers.Authorization = `Bearer ${newSession.access_token}`
        } else {
          console.log('No valid session available')
          throw new Error('No valid authentication session')
        }
      }
      
      return config
    })

    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          console.log('Received 401, attempting token refresh...')
          const { data } = await supabase.auth.refreshSession()
          const newSession = data?.session
          
          if (newSession?.access_token) {
            console.log('Token refreshed successfully')
            error.config.headers.Authorization = `Bearer ${newSession.access_token}`
            return this.api.request(error.config)
          }
        }
        return Promise.reject(error)
      }
    )
  }

  /**
   * Get analytics data
   * @returns {Promise<Object>} - Analytics data
   */
  async getAnalytics() {
    try {
      console.log('Fetching analytics data...')
      const response = await this.api.get('/api/dashboard/analytics')
      console.log('Analytics data received:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching analytics:', error)
      throw error
    }
  }

  /**
   * Get camping spots owned by the current user
   */
  async getCampingSpots() {
    try {
      const response = await this.api.get('/api/dashboard/spots')
      return response.data
    } catch (error) {
      console.error('Error fetching camping spots:', error)
      throw error
    }
  }

  /**
   * Get owner bookings
   * @returns {Promise<Array>} List of bookings for owner's camping spots
   */
  async getOwnerBookings() {
    try {
      const response = await this.api.get('/api/dashboard/bookings')
      return response.data
    } catch (error) {
      console.error('Error fetching owner bookings:', error)
      throw error
    }
  }

  async createSpot(spotData) {
    const response = await this.api.post('/api/dashboard/spots', spotData)
    return response.data
  }

  async updateSpot(spotId, spotData) {
    const response = await this.api.put(`/api/dashboard/spots/${spotId}`, spotData)
    return response.data
  }

  async deleteSpot(spotId) {
    const response = await this.api.delete(`/api/dashboard/spots/${spotId}`)
    return response.data
  }
}

// Create a single instance of the service
const dashboardService = new DashboardService()

export default dashboardService