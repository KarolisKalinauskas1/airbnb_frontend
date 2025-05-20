<template>
  <div class="dashboard-spots">
    <!-- My Spots List -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold">My Spots</h1>
      <button @click="showAddModal = true" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
        Add New Spot
      </button>
    </div>
    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <div class="spinner mb-4"></div>
      <p class="text-gray-600">Loading your camping spots...</p>
    </div>
    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 p-6 rounded-lg my-6 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h2 class="text-xl font-bold mb-2 text-red-700">Error Loading Spots</h2>
      <p class="mb-4 text-red-600">{{ error }}</p>
      <button @click="fetchSpots" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
        Try Again
      </button>
    </div>
    <!-- Empty State -->
    <div v-else-if="spots.length === 0" class="bg-gray-50 p-8 rounded-lg my-6 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
      <h2 class="text-xl font-bold mb-2">No Camping Spots Yet</h2>
      <p class="mb-4 text-gray-600">You haven't added any camping spots. Start adding spots to grow your business!</p>
      <button @click="showAddModal = true" class="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium">
        Add Your First Spot
      </button>
    </div>
    <!-- Spots List with improved layout -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="spot in spots" :key="spot.camping_spot_id" class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <!-- Images Gallery -->
        <div class="relative mb-4">
          <div class="w-full h-48 overflow-hidden rounded-lg">
            <img 
              v-if="spot.images && spot.images.length > 0"
              :src="spot.images[0].image_url"
              class="w-full h-full object-cover"
              alt="Spot image"
            />
            <div 
              v-else 
              class="h-full w-full bg-gray-100 flex items-center justify-center"
            >
              <span class="text-gray-400">No image</span>
            </div>
          </div>
        </div>
        <!-- Spot Details -->
        <div class="space-y-2">
          <h2 class="text-xl font-semibold">{{ spot.title }}</h2>
          <p class="text-gray-600">{{ spot.location?.city }}, {{ spot.location?.country?.name }}</p>
          <p class="font-bold text-lg">€{{ spot.price_per_night }} per night</p>
          <p class="text-sm text-gray-500">Maximum {{ spot.max_guests }} guests</p>
          <!-- Action Buttons -->
          <div class="flex justify-between mt-4">
            <button 
              @click="editingSpot = spot; showAddModal = true" 
              class="text-blue-500 hover:text-blue-700 cursor-pointer"
            >
              Edit
            </button>
            <button 
              @click="manageAvailability(spot)" 
              class="text-green-500 hover:text-green-700 cursor-pointer"
            >
              Manage Availability
            </button>
            <button 
              @click="spotToDelete = spot; showDeleteModal = true" 
              class="text-red-500 hover:text-red-700 cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Add/Edit Modal -->
    <SpotFormModal 
      v-if="showAddModal" 
      :spot="editingSpot"
      @close="closeAddModal"
      @spot-created="handleSaveSpot"
      @spot-updated="handleUpdateSpot"
    />
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal && spotToDelete" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 class="text-xl font-semibold mb-4">Confirm Deletion</h2>
        <p>Are you sure you want to delete <strong>{{ spotToDelete.title }}</strong>? This action cannot be undone.</p>
        <div class="mt-6 flex justify-end space-x-3">
          <button 
            @click="showDeleteModal = false" 
            class="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            @click="deleteSpot" 
            class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
    <!-- Availability Management Modal -->
    <div v-if="showAvailabilityModal && selectedSpot" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center overflow-y-auto">
      <div class="bg-white rounded-lg w-full max-w-2xl my-10 mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        <div class="sticky top-0 bg-white border-b z-10 p-6">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold">Manage: {{ selectedSpot.title }}</h2>
            <button 
              @click="showAvailabilityModal = false" 
              class="text-gray-500 hover:text-gray-700 text-2xl h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-100 cursor-pointer"
            >
              &times;
            </button>
          </div>
        </div>
        <div class="p-6 pt-2">
          <div class="grid grid-cols-1 gap-8">
            <div>
              <h3 class="text-lg font-medium mb-3 text-gray-800">Pricing</h3>
              <PriceSuggestionWidget
                :camping-spot-id="selectedSpot.camping_spot_id"
                :current-price="selectedSpot.price_per_night"
                :show-update-button="true"
                @update-price="updateSpotPrice"
              />
              <p class="text-sm text-gray-500 mt-2">
                Setting the right price helps optimize your bookings and revenue. This price becomes your default base price.
              </p>
            </div>
            <div class="border-t pt-6">
              <h3 class="text-lg font-medium mb-3 text-gray-800">Availability Calendar</h3>
              <p class="text-sm text-gray-500 mb-4">
                Use this calendar to block dates when your camping spot is unavailable.
                Click "Block Dates" to enter blocking mode, then select your date range.
              </p>
              <div v-if="selectedSpot && selectedSpot.camping_spot_id">
                <AvailabilityCalendar 
                  :camping-spot-id="selectedSpot.camping_spot_id"
                  :base-price="selectedSpot.price_per_night"
                  :is-owner="true"
                  :owner-id="authStore.fullUser?.user_id"
                  :view-only="false"
                  @date-selected="handleCalendarDateSelected"
                />
              </div>
              <div v-else class="p-4 bg-gray-100 rounded-lg text-gray-600 text-center">
                Please select a spot to manage availability
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import SpotFormModal from '@/components/SpotFormModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import axios from '@/axios'
import AvailabilityCalendar from '@/components/AvailabilityCalendar.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useRouter, useRoute } from 'vue-router'
import PriceSuggestionWidget from '@/components/PriceSuggestionWidget.vue'
import dashboardService from '@/services/dashboardService'
import { apiRequest } from '@/utils/apiRequest'
const spots = ref([])
const showAddModal = ref(false)
const editingSpot = ref(null)
const showDeleteModal = ref(false)
const spotToDelete = ref(null)
const authStore = useAuthStore()
const toast = useToast()
const loading = ref(false)
const error = ref(null)
const router = useRouter()
const route = useRoute()
const showAvailabilityModal = ref(false)
const selectedSpot = ref(null)
// Dashboard data
const dashboardData = ref({
  totalBookings: 0,
  completedBookings: 0,
  cancelledBookings: 0,
  occupancyRate: 0,
  totalRevenue: 0,
  activeBookings: 0
})
const dashboardError = ref(null)
// Format currency helper function
const formatCurrency = (value) => {
  const num = parseFloat(value || 0)
  return num.toFixed(2)
}
// Load dashboard data
const loadDashboardData = async () => {
  try {
    dashboardError.value = null
    try {
      const data = await dashboardService.getAnalytics();
      // Update dashboard data with the response
      dashboardData.value = {
        totalBookings: data?.bookings?.total || 0,
        completedBookings: data?.bookings?.completed || 0,
        cancelledBookings: data?.revenue?.cancelled || 0, // This should reflect the cancelled bookings if needed
        occupancyRate: data?.bookings?.occupancyRate || 0,
        totalRevenue: data?.revenue?.total || 0, // Ensure this is set correctly
        activeBookings: data?.bookings?.active || 0
      }
    } catch (apiError) {
      console.warn('Dashboard API endpoint failed, trying fallback:', apiError.message)
      // Try fallback to calculate from spots
      if (spots.value.length > 0) {
        // Calculate basic metrics from spots if available
        let totalBookings = 0
        let totalRevenue = 0
        spots.value.forEach(spot => {
          if (spot.stats) {
            totalBookings += spot.stats.totalBookings || 0
            totalRevenue += spot.stats.revenue || 0
          }
        })
        dashboardData.value = {
          ...dashboardData.value,
          totalBookings,
          totalRevenue
        }
      }
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
    dashboardError.value = 'Failed to load dashboard data'
  }
}
// Load spots data
const fetchSpots = async () => {
  loading.value = true;
  error.value = null;
  try {
    if (!authStore.isAuthenticated || !authStore.isOwner) {
      console.error('User not authenticated or not an owner');
      throw new Error('You must be logged in as an owner to view this page');
    }
    // Use the dashboard service to fetch spots
    const response = await dashboardService.getCampingSpots();
    if (!response) {
      throw new Error('No data received from server');
    }
    spots.value = response;
  } catch (err) {
    console.error('Error fetching spots:', err);
    console.error('Error details:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      headers: err.response?.headers
    });
    error.value = err.message || 'Failed to fetch camping spots';
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
};
// Initialize and load data
onMounted(async () => {
  await fetchSpots();
});
// Existing functions
function closeAddModal() {
  showAddModal.value = false
  editingSpot.value = null
}
async function handleSaveSpot(spotData) {
  try {
    if (!authStore.isAuthenticated || !authStore.isOwner) {
      toast.error('Authentication data not loaded. Please refresh the page and try again.');
      return;
    }
    // If we received spotData with camping_spot_id, it means the spot was already created
    // by the modal component, so we just need to handle the success case
    if (spotData.camping_spot_id) {
      toast.success('Camping spot created successfully');
      closeAddModal();
      await fetchSpots();
      return;
    }
    // Only proceed with API calls if we're editing
    if (editingSpot.value) {
      try {
        const response = await axios.put(`/api/camping-spots/${editingSpot.value.camping_spot_id}`, spotData);
        toast.success('Spot updated successfully');
        closeAddModal();
        await fetchSpots();
      } catch (apiError) {
        console.error('API Error:', apiError);
        if (apiError.response) {
          const errorMessage = apiError.response.data?.error || 'Server error occurred';
          const errorDetails = apiError.response.data?.details ? `: ${apiError.response.data.details}` : '';
          toast.error(`${errorMessage}${errorDetails}`);
        } else if (apiError.request) {
          toast.error('No response from server. Please check your connection.');
        } else {
          toast.error(`Request setup error: ${apiError.message}`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to process form submission:', error);
    toast.error('Failed to process form. Please try again.');
  }
}
// Handle a spot update from the modal
async function handleUpdateSpot(updatedSpotData) {
  try {
    if (!updatedSpotData || !updatedSpotData.camping_spot_id) {
      console.error('Invalid updated spot data received');
      return;
    }
    // Find and update the spot in our local array immediately
    const spotIndex = spots.value.findIndex(s => s.camping_spot_id === updatedSpotData.camping_spot_id);
    if (spotIndex !== -1) {
      // Update the spot in the array with all the new data
      spots.value[spotIndex] = {
        ...spots.value[spotIndex],
        ...updatedSpotData
      };
    }
    // Close the modal
    closeAddModal();
  } catch (error) {
    console.error('Error handling spot update:', error);
    toast.error('Error updating spot data in UI');
  }
}
async function deleteSpot() {
  if (!spotToDelete.value) return
  try {
    await axios.delete(`/api/camping-spots/${spotToDelete.value.camping_spot_id}`)
    toast.success('Spot deleted successfully')
    showDeleteModal.value = false
    spotToDelete.value = null
    await fetchSpots()
  } catch (error) {
    console.error('Failed to delete spot:', error)
    toast.error('Failed to delete camping spot')
  }
}
const manageAvailability = (spot) => {
  selectedSpot.value = spot
  showAvailabilityModal.value = true
}
const handleCalendarDateSelected = (dateRange) => {
  if (!dateRange || !selectedSpot.value || !selectedSpot.value.camping_spot_id) {
    console.error('Invalid date range or no spot selected');
    return;
  }
  setTimeout(() => {
    fetchSpots();
  }, 500);
}
const updateSpotPrice = async (newPrice) => {
  try {
    // Ensure we have a fresh authentication token before updating the price
    const token = await authStore.getAuthToken(true); // Force refresh token
    if (!token) {
      toast.error('No authentication token available. Please log in again.');
      return;
    }
    // Make sure to include /api/ in the URL path and explicitly set Authorization header
    await axios.patch(`/api/camping-spots/${selectedSpot.value.camping_spot_id}/price`, { 
      price: newPrice 
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    selectedSpot.value.price_per_night = newPrice;
    const spotIndex = spots.value.findIndex(s => s.camping_spot_id === selectedSpot.value.camping_spot_id);
    if (spotIndex !== -1) {
      spots.value[spotIndex].price_per_night = newPrice;
    }
    toast.success('Price updated successfully');
  } catch (error) {
    console.error('Failed to update price:', error);
    // Better error handling with specific messages
    if (error.response?.status === 401) {
      toast.error('Your session has expired. Refreshing authentication...');
      try {
        const newToken = await authStore.refreshToken();
        if (!newToken) {
          throw new Error('Failed to get a new authentication token');
        }
        // Retry the update once more after refreshing token with proper URL and headers
        await axios.patch(`/api/camping-spots/${selectedSpot.value.camping_spot_id}/price`, { 
          price: newPrice 
        }, {
          headers: {
            'Authorization': `Bearer ${newToken}`
          }
        });
        selectedSpot.value.price_per_night = newPrice;
        const spotIndex = spots.value.findIndex(s => s.camping_spot_id === selectedSpot.value.camping_spot_id);
        if (spotIndex !== -1) {
          spots.value[spotIndex].price_per_night = newPrice;
        }
        toast.success('Price updated successfully');
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        toast.error('Authentication failed. Please reload the page and try again.');
      }
    } else {
      const errorMessage = error.response?.data?.error || 'Failed to update price';
      toast.error(errorMessage);
    }
  }
}
</script>
<style scoped>
.dashboard-spots {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #ff385c;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.max-h-\[90vh\] {
  max-height: 90vh;
}
:deep(.dp__overlay) {
  z-index: 100;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.fixed {
  animation: fadeIn 0.2s ease-out;
}
</style>
