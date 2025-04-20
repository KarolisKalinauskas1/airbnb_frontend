<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import axios from '@/axios'
import BookingCard from '@/components/BookingCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import apiService from '@/services/api'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()
const user = ref(null)
const fullUser = ref(null)
const authError = ref(null)
const isLoading = ref(true)
const dbConnectionError = ref(false)

const activeTab = ref(route.query.tab === 'bookings' ? 'upcoming' : (route.query.tab || 'info'))
const upcomingBookings = ref([])
const previousBookings = ref([])
const highlightedBookingId = ref(route.query.id ? parseInt(route.query.id) : null)

const tabButton = (tab) =>
  `px-4 py-2 border-b-2 ${
    activeTab.value === tab ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500'
  } hover:text-emerald-600`

onMounted(async () => {
  try {
    isLoading.value = true;
    
    const { data } = await supabase.auth.getUser()
    user.value = data.user
    
    if (!user.value && authStore.token) {
      await authStore.initAuth()
      
      if (!authStore.isLoggedIn) {
        console.log('Auth initialization failed, redirecting to login');
        router.push('/auth?redirect=/account');
        return;
      }
      
      const { data: refreshedData } = await supabase.auth.getUser();
      user.value = refreshedData.user;
    }
    
    if (!user.value && !authStore.isLoggedIn) {
      console.log('Not authenticated, redirecting to login');
      router.push('/auth?redirect=/account');
      return;
    }
    
    fullUser.value = authStore.fullUser;
    
    if (!fullUser.value && user.value) {
      try {
        await fetchUserInfo();
      } catch (err) {
        console.error('Failed to fetch user info:', err);
        
        if (err.response?.status === 503) {
          dbConnectionError.value = true;
          toast.error('Database connection issue. Please try again later.');
        } else {
          toast.error('Could not load your account data: ' + (err.response?.data?.error || err.message));
        }
        
        fullUser.value = {
          user_id: 999,
          full_name: user.value.email.split('@')[0],
          email: user.value.email,
          isowner: user.value.user_metadata?.isowner || 0,
          bookings: []
        };
      }
    }
    
    filterBookings();
    
    if (highlightedBookingId.value) {
      setTimeout(() => {
        const bookingElement = document.getElementById(`booking-${highlightedBookingId.value}`)
        if (bookingElement) {
          bookingElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          bookingElement.classList.add('highlight-booking')
          
          setTimeout(() => {
            bookingElement.classList.remove('highlight-booking')
          }, 3000)
        }
      }, 500)
    }
  } catch (err) {
    console.error('Error in account mount:', err);
    authError.value = err.message;
    toast.error('Error loading account data: ' + err.message);
  } finally {
    isLoading.value = false;
  }
});

async function fetchUserInfo() {
  if (!authStore.isLoggedIn) {
    dbConnectionError.value = false;
    authError.value = 'Please log in to view your account.';
    isLoading.value = false;
    return;
  }

  try {
    await authStore.fetchFullUserInfo(true); // Force refresh

    if (!authStore.fullUser) {
      throw new Error('Failed to fetch user information');
    }

    fullUser.value = authStore.fullUser;
    
    // Ensure bookings is a valid array
    if (!Array.isArray(fullUser.value.bookings)) {
      console.warn('Expected bookings to be an array but got:', typeof fullUser.value.bookings);
      fullUser.value.bookings = [];
    }

    // Filter bookings
    filterBookings();

    // Check if we need to highlight a specific booking
    if (route.query.id) {
      highlightedBookingId.value = parseInt(route.query.id);
      
      // Set the active tab based on where the booking is found
      const bookingId = parseInt(route.query.id);
      
      const inUpcoming = upcomingBookings.value.some(booking => booking.booking_id === bookingId);
      const inPrevious = previousBookings.value.some(booking => booking.booking_id === bookingId);
      
      if (inUpcoming) {
        activeTab.value = 'upcoming';
      } else if (inPrevious) {
        activeTab.value = 'previous';
      }
      
      // Scroll to the highlighted booking on next tick
      setTimeout(() => {
        const bookingElement = document.getElementById(`booking-${highlightedBookingId.value}`);
        if (bookingElement) {
          bookingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    }

    authError.value = null;
    dbConnectionError.value = false;
  } catch (err) {
    console.error('Error fetching user data:', err);
    
    if (err.code === 'ERR_NETWORK' || err.message?.includes('network')) {
      dbConnectionError.value = true;
      authError.value = 'Unable to connect to the database. Please check your internet connection or try again later.';
    } else {
      authError.value = err.message || 'Error loading account information';
    }

    // Show a toast for the error
    toast.error(authError.value);
  } finally {
    isLoading.value = false;
  }
}

const filterBookings = () => {
  if (!fullUser.value) {
    upcomingBookings.value = [];
    previousBookings.value = [];
    if (activeTab.value === 'previous' || activeTab.value === 'upcoming') {
      activeTab.value = 'info';
    }
    return;
  }
  
  const bookingsArray = Array.isArray(fullUser.value.bookings) ? 
    fullUser.value.bookings : [];
  
  const cleanBookings = bookingsArray.filter(b => b !== null);
  const now = new Date();
  
  upcomingBookings.value = cleanBookings.filter(b => {
    const startDate = new Date(b.start_date);
    return startDate > now && (b.status_id === 2 || b.status === 'CONFIRMED');
  });
  
  previousBookings.value = cleanBookings.filter(b => {
    const endDate = new Date(b.end_date);
    const statusId = b.status_id;
    const status = b.status;
    
    return statusId === 3 || statusId === 4 || 
           status === 'CANCELLED' || status === 'COMPLETED' || 
           (endDate <= now && (statusId === 2 || status === 'CONFIRMED'));
  });
  
  upcomingBookings.value.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  previousBookings.value.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
};

const retryConnection = async () => {
  isLoading.value = true;
  dbConnectionError.value = false;
  
  try {
    await fetchUserInfo();
    filterBookings();
    toast.success('Connection restored successfully');
  } catch (err) {
    console.error('Retry failed:', err);
    toast.error('Still unable to connect to the database. Please try again later.');
  } finally {
    isLoading.value = false;
  }
};

watch(() => authStore.fullUser, (newValue) => {
  if (newValue) {
    fullUser.value = newValue;
    filterBookings();
  }
}, { deep: true });

watch(() => route.query, (newQuery) => {
  if (newQuery.tab && ['info', 'upcoming', 'previous'].includes(newQuery.tab)) {
    activeTab.value = newQuery.tab;
  }
  
  if (newQuery.id) {
    highlightedBookingId.value = parseInt(newQuery.id);
    
    // Scroll to the highlighted booking on next tick
    setTimeout(() => {
      const bookingElement = document.getElementById(`booking-${highlightedBookingId.value}`);
      if (bookingElement) {
        bookingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  }
}, { immediate: true });

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const changePassword = async () => {
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    alert('Please fill in all fields')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    alert('New passwords do not match')
    return
  }

  if (newPassword.value.length < 6) {
    alert('New password must be at least 6 characters long')
    return
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: user.value.email,
    password: currentPassword.value
  })

  if (signInError) {
    alert('Current password is incorrect')
    return
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword.value
  })

  if (updateError) {
    alert('Failed to update password: ' + updateError.message)
  } else {
    alert('Password updated successfully')
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  }
}

const refreshKey = ref(0)

const handleBookingChanged = async (bookingId) => {
  await authStore.fetchFullUserInfo(true)
  refreshKey.value++
}

</script>


<template>
  <div v-if="isLoading" class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
  </div>

  <div v-else-if="authError" class="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">
    <div class="max-w-md bg-white p-8 rounded-xl shadow-lg text-center">
      <h2 class="text-xl font-semibold text-red-500 mb-4">Authentication Error</h2>
      <p class="mb-6">{{ authError }}</p>
      <button 
        @click="router.push('/auth?redirect=/account')" 
        class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Go to Login
      </button>
    </div>
  </div>
  
  <div v-else-if="dbConnectionError" class="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">
    <div class="max-w-md bg-white p-8 rounded-xl shadow-lg text-center">
      <h2 class="text-xl font-semibold text-red-500 mb-4">Database Connection Error</h2>
      <p class="mb-6">Cannot connect to the database server. This is likely a temporary issue.</p>
      <div class="flex space-x-4 justify-center">
        <button 
          @click="retryConnection" 
          class="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
        >
          Retry Connection
        </button>
        <button 
          @click="router.push('/')" 
          class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Go to Homepage
        </button>
      </div>
    </div>
  </div>
  
  <div v-else class="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">
    <div class="max-w-4xl w-full p-6">
      <div class="flex justify-between mb-6 border-b pb-2">
        <button @click="activeTab = 'info'" :class="tabButton('info')" class="cursor-pointer">Account Info</button>
        <button @click="activeTab = 'upcoming'" :class="tabButton('upcoming')" class="cursor-pointer">Upcoming Bookings</button>
        <button v-if="previousBookings.length > 0" @click="activeTab = 'previous'" :class="tabButton('previous')" class="cursor-pointer">Previous Bookings</button>
      </div>

      <div v-if="user && activeTab === 'info'">
        <h2 class="text-xl font-semibold mb-4">Account Information</h2>
        <div class="flex flex-col gap-4 mb-8">
          <div>
            <p class="text-gray-700 font-medium"><strong>Name:</strong></p>
            <p>{{ fullUser?.full_name }}</p>
          </div>
          <div>
            <p class="text-gray-700 font-medium"><strong>Email:</strong></p>
            <p>{{ fullUser?.email }}</p>
          </div>
        </div>

        <div class="mt-8">
          <h3 class="text-lg font-semibold mb-4">Change Password</h3>
          <form @submit.prevent="changePassword" class="max-w-sm flex flex-col gap-5">
            <div class="flex flex-col gap-1">
              <label class="text-sm">Current Password</label>
              <div class="flex items-center border rounded px-2">
                <input
                  :type="showCurrent ? 'text' : 'password'"
                  v-model="currentPassword"
                  required
                  class="w-full p-2 outline-none"
                />
                <button type="button" @click="showCurrent = !showCurrent" class="ml-2 text-lg cursor-pointer">
                  {{ showCurrent ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm">New Password</label>
              <div class="flex items-center border rounded px-2">
                <input
                  :type="showNew ? 'text' : 'password'"
                  v-model="newPassword"
                  required
                  class="w-full p-2 outline-none"
                />
                <button type="button" @click="showNew = !showNew" class="ml-2 text-lg cursor-pointer">
                  {{ showNew ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm">Confirm New Password</label>
              <div class="flex items-center border rounded px-2">
                <input
                  :type="showConfirm ? 'text' : 'password'"
                  v-model="confirmPassword"
                  required
                  class="w-full p-2 outline-none"
                />
                <button type="button" @click="showConfirm = !showConfirm" class="ml-2 text-lg cursor-pointer">
                  {{ showConfirm ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <button type="submit" class="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600">
              Update Password
            </button>
          </form>
        </div>
      </div>

      <div v-if="user && activeTab === 'upcoming'" class="w-full">
        <h2 class="text-xl font-semibold mb-4">Upcoming Bookings</h2>
        <div v-if="upcomingBookings.length > 0" class="space-y-4">
          <BookingCard
            v-for="booking in upcomingBookings"
            :key="`${booking.booking_id}-${refreshKey}`"
            :booking="booking"
            :class="{ 'ring-2 ring-red-500 ring-offset-2': booking.booking_id === highlightedBookingId }"
            :id="`booking-${booking.booking_id}`"
            refresh-on-action
            @booking-changed="handleBookingChanged"
          />
        </div>
        <div v-else class="text-center p-8 bg-gray-50 rounded-lg">
          <p class="text-gray-500">No upcoming bookings found.</p>
        </div>
      </div>

      <div v-if="user && activeTab === 'previous'" class="w-full">
        <h2 class="text-xl font-semibold mb-4">Previous Bookings</h2>
        <div v-if="previousBookings.length > 0" class="space-y-4">
          <BookingCard
            v-for="booking in previousBookings"
            :key="`${booking.booking_id}-${refreshKey}`"
            :booking="booking"
            :class="{ 'ring-2 ring-red-500 ring-offset-2': booking.booking_id === highlightedBookingId }"
            :id="`booking-${booking.booking_id}`"
            refresh-on-action
            @booking-changed="handleBookingChanged"
          />
        </div>
        <div v-else class="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <p class="text-gray-700 text-lg">No previous bookings found.</p>
        </div>
      </div>

      <div v-if="!user" class="text-center text-gray-500">
        <p>Please <RouterLink to="/auth" class="text-blue-500 underline">log in</RouterLink> to view your account.</p>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.highlight-booking {
  animation: pulse 2s infinite;
}
</style>
