import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { authDebugger } from '@/utils/authDebugger'

export const useBookingStore = defineStore('booking', () => {
  // Initialize from localStorage if it exists
  const storedBooking = localStorage.getItem('pendingBookingDetails')
  const currentBooking = ref(storedBooking ? JSON.parse(storedBooking) : null)
  const authError = ref(null)
  
  function setBookingDetails(bookingData) {
    currentBooking.value = bookingData
    localStorage.setItem('pendingBookingDetails', JSON.stringify(bookingData))
  }
  
  function getBookingDetails() {
    if (!currentBooking.value) {
      const storedData = localStorage.getItem('pendingBookingDetails')
      if (storedData) {
        currentBooking.value = JSON.parse(storedData)
      }
    }
    return currentBooking.value
  }
  
  function clearBookingDetails() {
    currentBooking.value = null
    localStorage.removeItem('pendingBookingDetails')
  }
  
  // Validate auth state before proceeding with booking
  async function validateAuthState() {
    authError.value = null
    const authStore = useAuthStore()
    
    // Check if user is logged in but full user info is missing
    if (authStore.user && !authStore.fullUser) {
      console.log('User is logged in but missing full user info. Attempting to fix...')
      
      try {
        // Debug the current state
        await authDebugger.checkAuthState()
        
        // Try to fix auth state by fetching full user info
        const userData = await authStore.fetchFullUserInfo(true)
        
        if (!userData) {
          console.log('Failed to fetch user info, trying auth fix utility...')
          const fixed = await authDebugger.fixAuthState()
          
          if (!fixed) {
            authError.value = "Couldn't retrieve your user information. Please try logging out and back in."
            return false
          }
        }
      } catch (error) {
        console.error('Auth validation error:', error)
        authError.value = 'Authentication error. Please try logging out and back in.'
        return false
      }
    }
    
    return !!authStore.fullUser
  }
  
  return {
    currentBooking,
    setBookingDetails,
    getBookingDetails,
    clearBookingDetails,
    validateAuthState,
    authError
  }
})
