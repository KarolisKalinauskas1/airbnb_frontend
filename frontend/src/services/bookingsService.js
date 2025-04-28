import axios from '@/axios';
import { useAuthStore } from '@/stores/auth';
import { fetchWithRetry } from '@/utils/requestRetry';

/**
 * Service for managing booking-related API calls
 */
class BookingsService {
  // ... existing code ...
  
  /**
   * Fetch bookings for an owner
   * @returns {Promise<Array>} List of bookings
   */
  async getOwnerBookings() {
    try {
      // First attempt with retry utility
      const response = await fetchWithRetry('/api/bookings/owner', {
        retries: 2,
        initialDelay: 1000,
        timeout: 12000, // Longer timeout for this potentially heavy operation
        headers: await this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Owner bookings fetch completely failed:', error);
      
      // Try alternate endpoint as last resort
      try {
        const alternateResponse = await axios.get('/bookings/owner', {
          timeout: 10000,
          headers: await this.getAuthHeaders()
        });
        return alternateResponse.data;
      } catch (alternateError) {
        console.error('Alternate endpoint also failed:', alternateError);
        throw new Error('Failed to fetch owner bookings');
      }
    }
  }
  
  /**
   * Get authorization headers
   * @returns {Promise<Object>} Headers object
   */
  async getAuthHeaders() {
    const authStore = useAuthStore();
    const token = await authStore.getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    return {
      Authorization: `Bearer ${token}`
    };
  }
}

export default new BookingsService();
