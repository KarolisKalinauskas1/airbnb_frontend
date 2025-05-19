<template>
  <DashboardLayout>
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-semibold">My Camping Spots</h1>
      <button @click="showAddModal = true" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
        Add New Spot
      </button>
    </div>

    <!-- Performance Summary -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-medium">Total Spots</h3>
        <p class="text-2xl font-bold">{{ spots.length }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-medium">Total Revenue</h3>
        <p class="text-2xl font-bold">€{{ totalRevenue }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-medium">Active Bookings</h3>
        <p class="text-2xl font-bold">{{ activeBookings }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-medium">Occupancy Rate</h3>
        <p class="text-2xl font-bold">{{ averageOccupancy }}%</p>
      </div>
    </div>

    <!-- Spots Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <template v-for="spot in spots" :key="spot.id">
        <div class="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
          <!-- Images Gallery -->
          <div class="relative mb-3">
            <div class="w-full h-36">
              <img 
                v-if="spot.images && spot.images.length > 0"
                :src="spot.images[0].image_url"
                class="w-full h-full object-contain rounded-md bg-gray-50"
                alt="Spot image"
              />
              <div 
                v-else 
                class="h-full w-full bg-gray-100 rounded-md flex items-center justify-center"
              >
                <span class="text-black-400 text-sm">No image available</span>
              </div>
            </div>
          </div>

          <!-- Spot Details -->
          <div class="space-y-2">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-lg font-semibold text-black">{{ spot.title }}</h3>
                <p class="text-sm text-black">{{ spot.location }}</p>
                <p class="mt-1 font-bold text-black">€{{ spot.price }} per night</p>
                <p class="text-sm text-black">Max guests: {{ spot.max_guests }}</p>
              </div>
              <div class="flex gap-3">
                <button 
                  @click="editSpot(spot)" 
                  class="text-blue-600 hover:text-blue-800 cursor-pointer px-2 py-1 rounded hover:bg-blue-50"
                >
                  Edit
                </button>
                <button 
                  @click="deleteSpot(spot.camping_spot_id)"
                  class="text-red-600 hover:text-red-800 cursor-pointer px-2 py-1 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>

            <!-- Stats -->
            <div class="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div class="bg-gray-50 p-2 rounded">
                <p class="text-gray-600">Bookings</p>
                <p class="font-semibold">{{ spot.stats?.totalBookings || 0 }}</p>
              </div>
              <div class="bg-gray-50 p-2 rounded">
                <p class="text-gray-600">Revenue</p>
                <p class="font-semibold">€{{ spot.stats?.revenue || 0 }}</p>
              </div>
              <div class="bg-gray-50 p-2 rounded">
                <p class="text-gray-600">Occupancy</p>
                <p class="font-semibold">{{ spot.stats?.occupancyRate || 0 }}%</p>
              </div>
            </div>
          </div>

          <!-- Add a manage availability button -->
          <div class="px-4 pb-4">
            <button 
              @click="selectSpot(spot)"
              class="w-full py-2 mt-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              Manage Availability & Pricing
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Add a new management section -->
    <div v-if="selectedSpot" class="mt-6 bg-white rounded-lg shadow p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold">Manage: {{ selectedSpot.title }}</h2>
        <button @click="selectedSpot = null" class="text-gray-500 hover:text-gray-700">
          &times;
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="text-lg font-medium mb-3">Availability Calendar</h3>
          <AvailabilityCalendar 
            :camping-spot-id="selectedSpot.camping_spot_id"
            :base-price="selectedSpot.price_per_night"
            :is-owner="true"
            :owner-id="authStore.fullUser?.user_id"
            :view-only="false"
          />
        </div>
        
        <div>
          <PriceSuggestionWidget
            :camping-spot-id="selectedSpot.camping_spot_id"
            :current-price="selectedSpot.price_per_night"
            :show-update-button="true"
            @update-price="updateSpotPrice"
          />
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <!-- ...existing modal code... -->
  </DashboardLayout>
</template>

<script setup>
// ...existing script setup code...
import AvailabilityCalendar from '@/components/AvailabilityCalendar.vue'
import PriceSuggestionWidget from '@/components/PriceSuggestionWidget.vue'
import { useToast } from 'vue-toastification'

const toast = useToast()
const spots = ref([])
const selectedSpot = ref(null)

const selectSpot = (spot) => {
  selectedSpot.value = spot
}

const updateSpotPrice = async (newPrice) => {
  try {
    if (!selectedSpot.value) return;
    
    // Show loading state or toast
    toast.info('Updating price...');
    
    const response = await axios.patch(`/api/camping-spots/${selectedSpot.value.camping_spot_id}/price`, {
      price: newPrice // Changed from price_per_night to price to match the backend API
    });
    
    if (response.data) {
      // Update the price in the selectedSpot and in spots array
      selectedSpot.value.price_per_night = newPrice;
      
      const spotIndex = spots.value.findIndex(s => s.camping_spot_id === selectedSpot.value.camping_spot_id);
      if (spotIndex !== -1) {
        spots.value[spotIndex].price_per_night = newPrice;
      }
      
      // Removed duplicate success toast - the PriceSuggestionWidget already shows one
      
      // Force refresh the PriceSuggestionWidget component
      // by temporarily unsetting and resetting the selectedSpot
      const temp = selectedSpot.value;
      selectedSpot.value = null;
      setTimeout(() => {
        selectedSpot.value = temp;
      }, 100);
    } else {
      throw new Error('Invalid response data');
    }
  } catch (error) {
    console.error('Failed to update price:', error);
    toast.error(error.response?.data?.error || 'Failed to update price. Please try again.');
  }
}

// Additional computed properties for summary stats
const totalRevenue = computed(() => {
  return spots.value.reduce((sum, spot) => sum + (spot.stats?.revenue || 0), 0);
});

const activeBookings = computed(() => {
  return spots.value.reduce((sum, spot) => sum + (spot.stats?.activeBookings || 0), 0);
});

const averageOccupancy = computed(() => {
  const totalOccupancy = spots.value.reduce((sum, spot) => sum + (spot.stats?.occupancyRate || 0), 0);
  return Math.round(totalOccupancy / (spots.value.length || 1));
});
</script>
