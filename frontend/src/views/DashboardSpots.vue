<template>
  <DashboardLayout>
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-semibold">My Camping Spots</h1>
        <p class="text-gray-600">Total spots: {{ spots.length }}</p>
      </div>
      <button @click="showAddModal = true" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
        Add New Spot
      </button>
    </div>

    <!-- Spots List with improved layout -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      @submit="handleSaveSpot"
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
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import SpotFormModal from '@/components/SpotFormModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import axios from '@/axios'
import AvailabilityCalendar from '@/components/AvailabilityCalendar.vue'
import PriceSuggestionWidget from '@/components/PriceSuggestionWidget.vue'

const spots = ref([])
const showAddModal = ref(false)
const editingSpot = ref(null)
const showDeleteModal = ref(false)
const spotToDelete = ref(null)
const authStore = useAuthStore()
const toast = useToast()

// Availability management
const showAvailabilityModal = ref(false)
const selectedSpot = ref(null)

onMounted(async () => {
  await fetchSpots()
})

async function fetchSpots() {
  try {
    // Get the user's session token
    const token = await authStore.getAuthToken();
    
    if (!token) {
      toast.error('Authentication required. Please log in.');
      return;
    }
    
    try {
      // First try the API version of the endpoint
      const { data } = await axios.get('/api/camping-spots/owner', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      spots.value = data;
    } catch (apiError) {
      console.warn('API endpoint failed, trying without /api prefix:', apiError.message);
      
      try {
        // Fallback to the non-API version
        const { data } = await axios.get('/camping-spots/owner', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json'
          },
          bypassDedupe: true // Bypass duplicate detection for fallback
        });
        
        spots.value = data;
      } catch (nonApiError) {
        console.error('All API attempts failed:');
        console.error('- API path error:', apiError);
        console.error('- Non-API path error:', nonApiError);
        throw new Error('Failed to fetch camping spots from any endpoint');
      }
    }
  } catch (error) {
    console.error('Failed to fetch spots:', error);
    
    if (error.response?.status === 401) {
      toast.error('Authentication required. Please log in again.');
    } else {
      toast.error(error.message || 'Failed to load camping spots');
    }
  }
}

const loadSpots = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const token = await authStore.getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    let data;
    
    try {
      // Use our new API service
      data = await apiService.get('/camping-spots/owner');
    } catch (apiError) {
      console.error('Failed to load spots:', apiError);
      
      // If it's a redirect error, try to follow the redirect manually
      if (apiError.response?.data?.message === 'This API endpoint does not support redirects') {
        if (apiError.response.data.redirectTarget) {
          console.log(`Manually following redirect to: ${apiError.response.data.redirectTarget}`);
          
          const response = await axios.get(apiError.response.data.redirectTarget, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          data = response.data;
        } else {
          throw apiError;
        }
      } else {
        throw apiError;
      }
    }
    
    if (Array.isArray(data)) {
      spots.value = data;
    } else {
      console.error('Unexpected data format:', data);
      throw new Error('Invalid data format received from server');
    }
  } catch (error) {
    console.error('Error loading spots:', error);
    
    if (error.response?.status === 401) {
      router.push('/auth?redirect=' + encodeURIComponent(route.fullPath));
    } else {
      error.value = error.message || 'Failed to load camping spots';
      toast.error(error.value);
    }
  } finally {
    loading.value = false;
  }
};

function closeAddModal() {
  showAddModal.value = false
  editingSpot.value = null
}

async function handleSaveSpot(spotData) {
  try {
    // Check if the auth store has been initialized properly
    if (!authStore.fullUser?.user_id) {
      toast.error('Authentication data not loaded. Please refresh the page and try again.');
      return;
    }
    
    // Log the form data to verify what's being sent
    console.log("Sending camping spot data:");
    for (let [key, value] of spotData.entries()) {
      console.log(`${key}: ${typeof value === 'object' ? 'File or Object' : value}`);
    }
    
    let response;
    try {
      if (editingSpot.value) {
        console.log(`Updating existing spot ID: ${editingSpot.value.camping_spot_id}`);
        response = await axios.put(`/camping-spots/${editingSpot.value.camping_spot_id}`, spotData);
        toast.success('Spot updated successfully');
      } else {
        console.log('Creating new camping spot');
        response = await axios.post('/camping-spots', spotData);
        toast.success('Spot created successfully');
      }
      
      console.log('Response data:', response.data);
      closeAddModal();
      await fetchSpots();
    } catch (apiError) {
      console.error('API Error:', apiError);
      
      if (apiError.response) {
        // Server responded with an error
        console.error('Error response:', apiError.response.data);
        const errorMessage = apiError.response.data?.error || 'Server error occurred';
        const errorDetails = apiError.response.data?.details ? `: ${apiError.response.data.details}` : '';
        toast.error(`${errorMessage}${errorDetails}`);
      } else if (apiError.request) {
        // Request was made but no response
        toast.error('No response from server. Please check your connection.');
      } else {
        // Error setting up the request
        toast.error(`Request setup error: ${apiError.message}`);
      }
    }
  } catch (error) {
    console.error('Failed to process form submission:', error);
    toast.error('Failed to process form. Please try again.');
  }
}

async function deleteSpot() {
  if (!spotToDelete.value) return
  
  try {
    await axios.delete(`/camping-spots/${spotToDelete.value.camping_spot_id}`)
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

// This function handles the date selection from our calendar component
const handleCalendarDateSelected = (dateRange) => {
  // Check if we have a valid dateRange and selectedSpot before proceeding
  if (!dateRange || !selectedSpot.value || !selectedSpot.value.camping_spot_id) {
    console.error('Invalid date range or no spot selected');
    return;
  }

  console.log('Dates blocked:', dateRange);
  
  // Refresh the list of spots when we come back
  setTimeout(() => {
    fetchSpots();
  }, 500);
}

const updateSpotPrice = async (newPrice) => {
  try {
    await axios.patch(`/camping-spots/${selectedSpot.value.camping_spot_id}/price`, { 
      price_per_night: newPrice 
    });
    
    // Update local data
    selectedSpot.value.price_per_night = newPrice;
    
    // Update in the spots list
    const spotIndex = spots.value.findIndex(s => s.camping_spot_id === selectedSpot.value.camping_spot_id);
    if (spotIndex !== -1) {
      spots.value[spotIndex].price_per_night = newPrice;
    }
    
    toast.success('Price updated successfully');
  } catch (error) {
    console.error('Failed to update price:', error);
    const errorMessage = error.response?.data?.error || 'Failed to update price';
    toast.error(errorMessage);
  }
}
</script>

<style scoped>
/* Improve the modal positioning */
.max-h-\[90vh\] {
  max-height: 90vh;
}

/* Fix modal scrolling issues */
:deep(.dp__overlay) {
  z-index: 100;
}

/* Animation for better UX feedback */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fixed {
  animation: fadeIn 0.2s ease-out;
}
</style>
