import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { authDebugger } from '@/utils/authDebugger'

export const useBookingStore = defineStore('booking', () => {
  // Initialize from localStorage if it exists
  const storedBooking = localStorage.getItem('pendingBookingDetails')
  const currentBooking = ref(storedBooking ? JSON.parse(storedBooking) : null)
  const authError = ref(null)
  const validationInProgress = ref(false)
  
  function setBookingDetails(bookingData) {
    currentBooking.value = bookingData
    localStorage.setItem('pendingBookingDetails', JSON.stringify(bookingData))
  }
  
  function getBookingDetails() {
    if (!currentBooking.value) {
      const storedData = localStorage.getItem('pendingBookingDetails')
      if (storedData) {
        try {
          currentBooking.value = JSON.parse(storedData)
        } catch (error) {
          console.error('Failed to parse booking details from localStorage', error)
          localStorage.removeItem('pendingBookingDetails')
        }
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
    // Prevent concurrent validation
    if (validationInProgress.value) {
      console.log('Auth validation already in progress, waiting...');
      await new Promise(resolve => {
        const checkValidation = () => {
          if (!validationInProgress.value) {
            resolve();
          } else {
            setTimeout(checkValidation, 100);
          }
        };
        checkValidation();
      });
      return !authError.value;
    }
    
    validationInProgress.value = true;
    authError.value = null;
    
    try {
      const authStore = useAuthStore();
      
      // Check if user is logged in but full user info is missing
      if (authStore.isLoggedIn && !authStore.fullUser) {
        console.log('User is logged in but missing full user info. Attempting to fix...');
        
        try {
          // Try to fetch user info with force refresh
          const userData = await authStore.fetchFullUserInfo(true);
          
          if (!userData) {
            console.log('Failed to fetch user info, trying auth fix utility...');
            const fixed = await authDebugger.fixAuthState();
            
            if (!fixed) {
              authError.value = "Couldn't retrieve your user information. Please try logging out and back in.";
              return false;
            }
          }
        } catch (error) {
          console.error('Auth validation error:', error);
          authError.value = 'Authentication error. Please try logging out and back in.';
          return false;
        }
      } else if (!authStore.isLoggedIn) {
        authError.value = 'Please log in to continue with booking.';
        return false;
      }
      
      return !!authStore.fullUser;
    } finally {
      validationInProgress.value = false;
    }
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
