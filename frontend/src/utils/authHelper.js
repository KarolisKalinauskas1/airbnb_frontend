import { useAuthStore } from '@/stores/auth'

/**
 * Helper functions to manage authentication state
 */
export const authHelper = {
  /**
   * Check authentication status and refresh token if needed
   * @returns {Promise<boolean>} True if authenticated
   */
  async ensureAuthenticated() {
    const authStore = useAuthStore()
    
    // If not logged in, cannot authenticate
    if (!authStore.isLoggedIn) {
      return false
    }
    
    // If no token, try to refresh
    if (!authStore.token) {
      return await authStore.refreshToken()
    }
    
    // If we have a token, but might be expiring soon, refresh it
    return await authStore.refreshToken()
  },
  
  /**
   * Prepare auth headers for API requests
   * @returns {Object} Headers object with Authorization
   */
  getAuthHeaders() {
    const authStore = useAuthStore()
    return {
      Authorization: authStore.token ? `Bearer ${authStore.token}` : ''
    }
  }
}
