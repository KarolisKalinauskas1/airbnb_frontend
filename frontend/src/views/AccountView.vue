<template>
  <div class="account-view">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading account information...</p>
          </div>
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadUserData">Retry</button>
        </div>
    <div v-else class="account-content">
      <!-- Main User Info Section -->
      <div class="main-info-section">
        <div class="user-profile-card">
          <div class="profile-header">
            <div class="user-avatar">
              <div class="avatar-circle">
                {{ user?.full_name?.charAt(0)?.toUpperCase() || 'U' }}
              </div>
              <div class="online-status"></div>
                </div>
            <div class="user-title">
              <h1>{{ user?.full_name || 'User' }}</h1>
              <div class="account-type-badge" :class="{ 'owner': user?.isowner }">
                {{ user?.isowner ? 'Owner' : 'Guest' }}
              </div>
            </div>
          </div>
          
          <div class="profile-details">
            <div class="detail-item">
              <div class="detail-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div class="detail-content">
                <span class="label">Email</span>
                <span class="value">{{ user?.email }}</span>
              </div>
            </div>
            
            <div class="detail-item">
              <div class="detail-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div class="detail-content">
                <span class="label">Member since</span>
                <span class="value">{{ formatDate(user?.created_at) }}</span>
              </div>
            </div>
            
            <div class="detail-item">
              <div class="detail-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div class="detail-content">
                <span class="label">Account Status</span>
                <span class="value">{{ user?.verified ? 'Verified' : 'Not Verified' }}</span>
                    </div>
                      </div>
                      </div>

          <div class="profile-actions">
            <button class="action-button" @click="activeTab = 'password'">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Change Password
            </button>
            <button class="action-button" @click="activeTab = 'upcoming'">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              View Bookings
            </button>
                      </div>
                    </div>

        <div class="quick-stats">
          <div class="stat-card" @click="activeTab = 'upcoming'">
            <div class="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <span class="stat-value">{{ totalBookings }}</span>
            <span class="stat-label">Total Bookings</span>
          </div>
          
          <div class="stat-card" @click="activeTab = 'upcoming'">
            <div class="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <span class="stat-value">{{ upcomingBookingsCount }}</span>
            <span class="stat-label">Upcoming</span>
          </div>
          
          <div class="stat-card" @click="activeTab = 'previous'">
            <div class="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
                  </div>
            <span class="stat-value">{{ previousBookingsCount }}</span>
            <span class="stat-label">Previous</span>
                </div>
              </div>
            </div>
            
      <!-- Tabs Section -->
      <div class="tabs-section">
        <div class="tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="['tab-button', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.label }}</span>
          </button>
                </div>
                
        <div class="tab-content">
          <!-- Password Tab -->
          <div v-if="activeTab === 'password'" class="section">
            <div class="section-header">
              <h2>Security Settings</h2>
              <p class="section-description">Update your password to keep your account secure</p>
            </div>
            <form @submit.prevent="changePassword" class="password-form">
              <div class="form-group">
                <label for="currentPassword">Current Password</label>
                <div class="password-input-wrapper">
                  <input
                    id="currentPassword" 
                    v-model="passwordData.currentPassword" 
                    :type="showCurrentPassword ? 'text' : 'password'"
                    placeholder="Enter current password"
                    required
                  >
                  <button type="button" @click="togglePasswordVisibility('current')" class="password-toggle">
                    {{ showCurrentPassword ? 'Hide' : 'Show' }}
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label for="newPassword">New Password</label>
                <div class="password-input-wrapper">
                  <input
                    id="newPassword" 
                    v-model="passwordData.newPassword" 
                    :type="showNewPassword ? 'text' : 'password'"
                    placeholder="Enter new password"
                    required
                  >
                  <button type="button" @click="togglePasswordVisibility('new')" class="password-toggle">
                    {{ showNewPassword ? 'Hide' : 'Show' }}
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label for="confirmPassword">Confirm New Password</label>
                <div class="password-input-wrapper">
                  <input
                    id="confirmPassword" 
                    v-model="passwordData.confirmPassword" 
                    :type="showConfirmPassword ? 'text' : 'password'"
                    placeholder="Confirm new password"
                    required
                  >
                  <button type="button" @click="togglePasswordVisibility('confirm')" class="password-toggle">
                    {{ showConfirmPassword ? 'Hide' : 'Show' }}
                  </button>
                </div>
              </div>
              <button type="submit" :disabled="changingPassword" class="save-button">
                {{ changingPassword ? 'Updating...' : 'Update Password' }}
              </button>
            </form>
          </div>

          <!-- Bookings Tabs -->
          <div v-if="activeTab === 'upcoming'" class="section">
            <div class="section-header">
              <h2>Upcoming Bookings</h2>
              <p class="section-description">Your future camping adventures</p>
            </div>
            <div v-if="loadingBookings" class="loading">
              <div class="spinner"></div>
              <p>Loading bookings...</p>
            </div>
            <div v-else-if="upcomingBookings.length === 0" class="no-bookings">
              <p>No upcoming bookings found</p>
            </div>
            <div v-else class="bookings-grid">
              <div v-for="booking in upcomingBookings" :key="booking.id" class="booking-card">
                <div class="booking-info">
                  <div class="booking-header">
                    <h3 class="booking-title">{{ booking.spot.name }}</h3>
                    <span class="booking-status" :class="getStatusClass(booking.status)">
                      {{ getStatusText(booking.status) }}
                    </span>
                  </div>
                  <div class="booking-dates">
                    <span class="date-value">{{ formatDate(booking.start_date) }} - {{ formatDate(booking.end_date) }}</span>
                  </div>
                  <div class="booking-actions">
                    <button 
                      class="info-button"
                      @click="showBookingDetails(booking)"
                    >
                      More Info
                    </button>
                    <button 
                      v-if="booking.status === 'Confirmed'"
                      @click="openCancelModal(booking)"
                      class="cancel-button"
                      :disabled="cancellingBooking === booking.id"
                    >
                      {{ cancellingBooking === booking.id ? 'Cancelling...' : 'Cancel Booking' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'previous'" class="section">
            <div class="section-header">
              <h2>Previous Bookings</h2>
              <p class="section-description">Your past camping experiences</p>
            </div>
            <div v-if="loadingBookings" class="loading">
              <div class="spinner"></div>
              <p>Loading bookings...</p>
            </div>
            <div v-else-if="previousBookings.length === 0" class="no-bookings">
              <p>No previous bookings found</p>
            </div>
            <div v-else class="bookings-grid">
              <div v-for="booking in previousBookings" :key="booking.id" class="booking-card">
                <div class="booking-info">
                  <div class="booking-header">
                    <h3 class="booking-title">{{ booking.spot.name }}</h3>
                    <span class="booking-status" :class="getStatusClass(booking.status)">
                      {{ getStatusText(booking.status) }}
                    </span>
                  </div>
                  <div class="booking-dates">
                    <span class="date-value">{{ formatDate(booking.start_date) }} - {{ formatDate(booking.end_date) }}</span>
                  </div>
                  <div class="booking-actions">
                    <button 
                      class="info-button"
                      @click="showBookingDetails(booking)"
                    >
                      More Info
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'cancelled'" class="section">
            <div class="section-header">
              <h2>Cancelled Bookings</h2>
              <p class="section-description">Your cancelled camping adventures</p>
            </div>
            <div v-if="loadingBookings" class="loading">
              <div class="spinner"></div>
              <p>Loading bookings...</p>
            </div>
            <div v-else-if="cancelledBookings.length === 0" class="no-bookings">
              <p>No cancelled bookings found</p>
            </div>
            <div v-else class="bookings-grid">
              <div v-for="booking in cancelledBookings" :key="booking.id" class="booking-card">
                <div class="booking-info">
                  <div class="booking-header">
                    <h3 class="booking-title">{{ booking.spot.name }}</h3>
                    <span class="booking-status" :class="getStatusClass(booking.status)">
                      {{ getStatusText(booking.status) }}
                    </span>
                  </div>
                  <div class="booking-dates">
                    <span class="date-value">{{ formatDate(booking.start_date) }} - {{ formatDate(booking.end_date) }}</span>
                  </div>
                  <div class="booking-actions">
                    <button 
                      class="info-button"
                      @click="showBookingDetails(booking)"
                    >
                      More Info
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>

    <!-- Cancel Booking Modal -->
    <div v-if="showCancelModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 class="text-xl font-semibold mb-4 text-red-600">Cancel Booking</h3>
        <div class="mb-6">
          <p class="text-gray-700 mb-4">
            Are you sure you want to cancel this booking?
          </p>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            <p class="font-bold mb-2">⚠️ Warning</p>
            <p>This action cannot be undone and your payment will <span class="font-bold">not</span> be refunded.</p>
          </div>
        </div>
        <div class="flex justify-end gap-4">
          <button 
            @click="showCancelModal = false"
            class="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Keep Booking
          </button>
          <button 
            @click="confirmCancelBooking"
            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Yes, Cancel Booking
          </button>
        </div>
      </div>
    </div>

    <!-- Booking Details Modal -->
    <div v-if="showDetailsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl font-semibold">{{ selectedBooking?.spot.name }}</h3>
          <button @click="showDetailsModal = false" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="space-y-4">
          <div class="booking-image" :style="{ backgroundImage: `url(${selectedBooking?.spot.images?.[0]?.image_url || '/placeholder.jpg'})` }">
            <div class="booking-status" :class="getStatusClass(selectedBooking?.status)">
              {{ getStatusText(selectedBooking?.status) }}
            </div>
          </div>

          <div class="flex justify-between">
            <div>
              <p class="text-sm text-gray-500">Check-in</p>
              <p class="font-medium">{{ formatDate(selectedBooking?.start_date) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Check-out</p>
              <p class="font-medium">{{ formatDate(selectedBooking?.end_date) }}</p>
            </div>
          </div>
          
          <!-- Cost breakdown section -->
          <div class="mt-4 pt-4 border-t border-gray-100">
            <h4 class="font-medium mb-2">Cost Breakdown</h4>
            <div class="space-y-2">
              <div class="flex justify-between">
                <p class="text-sm text-gray-600">Base price</p>
                <p class="text-sm">€{{ typeof selectedBooking?.baseCost === 'number' ? selectedBooking.baseCost.toFixed(2) : parseFloat(selectedBooking?.baseCost).toFixed(2) }}</p>
              </div>
              <div class="flex justify-between">
                <p class="text-sm text-gray-600">Service fee (10%)</p>
                <p class="text-sm">€{{ typeof selectedBooking?.serviceFee === 'number' ? selectedBooking.serviceFee.toFixed(2) : parseFloat(selectedBooking?.serviceFee).toFixed(2) }}</p>
              </div>
              <div class="flex justify-between font-medium pt-2 border-t border-gray-100">
                <p>Total</p>
                <p>€{{ typeof selectedBooking?.totalCost === 'number' ? selectedBooking.totalCost.toFixed(2) : parseFloat(selectedBooking?.totalCost).toFixed(2) }}</p>
              </div>
            </div>
          </div>
          
          <div class="pt-4 border-t">
            <button 
              v-if="selectedBooking?.status === 'Confirmed'"
              @click="openCancelModal(selectedBooking)"
              class="w-full cancel-button"
              :disabled="cancellingBooking === selectedBooking?.id"
            >
              {{ cancellingBooking === selectedBooking?.id ? 'Cancelling...' : 'Cancel Booking' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from '@/axios' // Using the configured axios instance
import { format } from 'date-fns'
import { useToast } from 'vue-toastification'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const loading = ref(true)
const error = ref(null)
const changingPassword = ref(false)
const loadingBookings = ref(false)
const cancellingBooking = ref(null)
const user = ref(null)
const bookings = ref([])
const bookingFilter = ref('upcoming')

const tabs = [
  { id: 'password', label: 'Security', icon: '🔒' },
  { id: 'upcoming', label: 'Upcoming', icon: '📅' },
  { id: 'previous', label: 'Previous', icon: '📋' },
  { id: 'cancelled', label: 'Cancelled', icon: '❌' }
]
const activeTab = ref('password')

const passwordData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Password visibility toggles
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const togglePasswordVisibility = (field) => {
  if (field === 'current') {
    showCurrentPassword.value = !showCurrentPassword.value
  } else if (field === 'new') {
    showNewPassword.value = !showNewPassword.value
  } else if (field === 'confirm') {
    showConfirmPassword.value = !showConfirmPassword.value
  }
}

const totalBookings = computed(() => bookings.value.length)
const upcomingBookings = computed(() => bookings.value.filter(booking => {
  const endDate = new Date(booking.end_date)
  return endDate >= new Date() && booking.status === 'Confirmed'
}))
const previousBookings = computed(() => bookings.value.filter(booking => {
  const endDate = new Date(booking.end_date)
  return endDate < new Date() && booking.status === 'Confirmed'
}))
const cancelledBookings = computed(() => bookings.value.filter(booking => {
  return booking.status === 'Cancelled'
}))
const upcomingBookingsCount = computed(() => upcomingBookings.value.length)
const previousBookingsCount = computed(() => previousBookings.value.length)
const cancelledBookingsCount = computed(() => cancelledBookings.value.length)

const showCancelModal = ref(false)
const selectedBooking = ref(null)
const showDetailsModal = ref(false)

const loadUserData = async () => {
  try {
    loading.value = true
    error.value = null
    
    const currentUser = authStore.user
    if (!currentUser) {
      throw new Error('No user found')
    }

    const token = await authStore.getAuthToken()
    if (!token) {
      throw new Error('No valid authentication token found')
    }

    const response = await axios.get('/api/users/full-info', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.data) {
      throw new Error('No user data received')
    }

    user.value = response.data
  } catch (err) {
    console.error('Error loading user data:', err)
    if (err.response?.status === 401) {
      error.value = 'Your session has expired. Please log in again.'
      router.push('/login')
    } else {
      error.value = 'Failed to load user data. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

const loadBookings = async () => {
  try {
    loadingBookings.value = true
    const token = await authStore.getAuthToken()
    const response = await axios.get('/api/bookings', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    if (response.data) {
      console.log('All bookings received:', response.data)
      // Only show user's own bookings
      bookings.value = response.data
        .map(booking => {
          console.log('Processing booking:', booking)
          console.log('Booking ID:', booking.booking_id)
          console.log('Status:', booking.status_booking_transaction?.status)
          console.log('Status ID:', booking.status_booking_transaction?.status_id)
          
          // Ensure all cost values are numbers, not strings
          const baseCost = parseFloat(booking.cost) || 0
          const serviceFee = parseFloat(booking.serviceFee) || baseCost * 0.1
          const transactionAmount = parseFloat(booking.transaction?.amount) || 0
          const totalAmount = transactionAmount || (baseCost + serviceFee)
          
          return {
            id: booking.booking_id,
            start_date: booking.start_date,
            end_date: booking.end_date,
            status: booking.status_booking_transaction?.status,
            status_id: booking.status_booking_transaction?.status_id,
            // Ensure all cost values are proper numbers
            cost: transactionAmount || baseCost + serviceFee,
            serviceFee: serviceFee,
            baseCost: baseCost,
            totalCost: totalAmount,
            spot: {
              name: booking.camping_spot?.title || 'Unknown Spot',
              description: booking.camping_spot?.description || '',
              price_per_night: booking.camping_spot?.price_per_night || 0,
              location: booking.camping_spot?.location || {},
              images: booking.camping_spot?.images || []
            }
          }
        })
      console.log('Processed bookings:', bookings.value)
    } else {
      console.log('No bookings data received')
      bookings.value = []
    }
  } catch (err) {
    console.error('Error loading bookings:', err)
    error.value = 'Failed to load bookings. Please try again.'
  } finally {
    loadingBookings.value = false
  }
}

const changePassword = async () => {
  try {
    if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
      error.value = 'New passwords do not match'
      return
    }

    changingPassword.value = true
    const token = await authStore.getAuthToken()
    await axios.post('/api/auth/change-password', {
      currentPassword: passwordData.value.currentPassword,
      newPassword: passwordData.value.newPassword
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    // Clear password fields after successful change
    passwordData.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    
    // Show success toast notification
    toast.success('Password changed successfully!', {
      icon: '🔒',
      timeout: 5000
    })
    
    // Reset any error message
    error.value = null
  } catch (err) {
    console.error('Error changing password:', err)
    error.value = err.response?.data?.message || 'Failed to change password. Please try again.'
    
    // Show error toast
    toast.error(error.value, {
      timeout: 5000
    })
  } finally {
    changingPassword.value = false
  }
}

const openCancelModal = (booking) => {
  selectedBooking.value = booking
  showCancelModal.value = true
}

const confirmCancelBooking = async () => {
  try {
    if (!selectedBooking.value) return;
    
    const token = await authStore.getAuthToken();
    const bookingId = parseInt(selectedBooking.value.id);
    
    if (isNaN(bookingId)) {
      error.value = 'Invalid booking ID';
      return;
    }

    const response = await axios.put(`/api/bookings/${bookingId}/status`, {
      status_id: 3 // CANCELLED
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data) {
      // Refresh the bookings list
      await loadBookings();
      showCancelModal.value = false;
      selectedBooking.value = null;
    }
  } catch (error) {
    console.error('Error canceling booking:', error);
    if (error.response?.status === 401) {
      error.value = 'Your session has expired. Please log in again.';
      router.push('/login');
    } else if (error.response?.status === 404) {
      error.value = 'Booking not found. It may have been already cancelled.';
    } else if (error.response?.status === 403) {
      error.value = 'You do not have permission to cancel this booking.';
    } else {
      error.value = 'Failed to cancel booking. Please try again.';
    }
  }
};

const formatDate = (date) => {
  return format(new Date(date), 'MMM d, yyyy')
}

const showBookingDetails = (booking) => {
  selectedBooking.value = booking
  showDetailsModal.value = true
}

const isUpcoming = (booking) => {
  const endDate = new Date(booking.end_date)
  return endDate >= new Date() && booking.status === 'Confirmed'
}

const getStatusText = (status) => {
  if (!status) return 'Unknown'
  return status
}

const getStatusClass = (status) => {
  if (!status) return 'unknown'
  return status.toLowerCase()
}

onMounted(() => {
  loadUserData()
  loadBookings()
})
</script>

<style scoped>
.account-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff385c;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  color: #e74c3c;
  padding: 2rem;
}

.account-header {
  margin-bottom: 3rem;
}

.account-header h1 {
  font-size: 2.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1.5rem;
}

.user-profile-card {
  background: white;
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.user-profile-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ff385c, #e31c5f);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.user-avatar {
  position: relative;
}

.avatar-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ff385c, #e31c5f);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(255, 56, 92, 0.3);
}

.online-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  background: #4caf50;
  border: 2px solid white;
  border-radius: 50%;
}

.user-title {
  flex: 1;
}

.user-title h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem;
}

.account-type-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  background: #f0f0f0;
  color: #666;
}

.account-type-badge.owner {
  background: linear-gradient(135deg, #ff385c, #e31c5f);
  color: white;
}

.profile-details {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f8f8;
  border-radius: 12px;
  transition: all 0.2s;
}

.detail-item:hover {
  background: #f0f0f0;
  transform: translateX(4px);
}

.detail-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  color: #ff385c;
}

.detail-content {
  flex: 1;
}

.detail-content .label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.25rem;
  display: block;
}

.detail-content .value {
  font-size: 1.125rem;
  color: #333;
  font-weight: 500;
}

.profile-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f8f8f8;
  border: none;
  border-radius: 12px;
  color: #333;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
}

.action-button svg {
  color: #ff385c;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ff385c, #e31c5f);
}

.stat-icon {
  margin-bottom: 1rem;
  color: #ff385c;
}

.stat-value {
  display: block;
  font-size: 2.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1rem;
  color: #666;
}

.tabs-container {
  margin-top: 2rem;
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 1rem;
}

.tab-button {
  background: none;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  color: #666;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.tab-button.active {
  color: #ff385c;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: -1rem;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #ff385c;
}

.section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.section h3 {
  margin: 0 0 1.5rem;
  font-size: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: #ff385c;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  width: 100%;
}

.password-input-wrapper input {
  flex: 1;
  padding-right: 60px;
}

.password-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #ff385c;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.password-toggle:hover {
  background-color: rgba(255, 56, 92, 0.1);
}

.save-button {
  background-color: #ff385c;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.save-button:hover {
  background-color: #e31c5f;
}

.save-button:disabled {
  background-color: #ffb3c1;
  cursor: not-allowed;
}

.bookings-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.filter-button {
  background: none;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-button.active {
  background-color: #ff385c;
  color: white;
  border-color: #ff385c;
}

.bookings-list {
  display: grid;
  gap: 1rem;
}

.bookings-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.booking-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.booking-card:hover {
  transform: translateY(-2px);
}

.booking-info {
  padding: 1rem;
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.booking-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
}

.booking-dates {
  color: #666;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.booking-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.info-button {
  width: 100%;
  background-color: #f3f4f6;
  color: #333;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.info-button:hover {
  background-color: #e5e7eb;
}

.cancel-button {
  width: 100%;
  background-color: #dc2626;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button:hover {
  background-color: #b91c1c;
}

.cancel-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f87171;
}

.booking-status {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: capitalize;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.booking-status.confirmed {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.booking-status.cancelled {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

/* Styles for the image in the details modal */
.booking-image {
  height: 200px;
  background-size: cover;
  background-position: center;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.no-bookings {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>
