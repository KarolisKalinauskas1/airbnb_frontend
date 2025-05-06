<template>
  <div class="dashboard-bookings">
    <div class="mb-8">
      <h1 class="text-2xl font-semibold mb-6">Manage Bookings</h1>
      
      <!-- Filter tabs -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div class="flex flex-wrap gap-2">
          <button 
            v-for="filter in filterOptions" 
            :key="filter.value"
            @click="currentFilter = filter.value"
            class="px-4 py-2 rounded-lg transition-colors"
            :class="currentFilter === filter.value ? 
              'bg-red-100 text-red-700 font-medium border border-red-200' : 
              'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'"
          >
            {{ filter.label }}
            <span 
              v-if="filter.value !== 'all'" 
              class="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs"
            >
              {{ getCountForFilter(filter.value) }}
            </span>
          </button>
        </div>
      </div>
      
      <!-- Loading state -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p>{{ error }}</p>
        <button @click="fetchBookings" class="mt-2 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded">
          Retry
        </button>
      </div>
      
      <!-- No bookings state -->
      <div v-else-if="filteredBookings.length === 0" class="bg-white rounded-lg shadow-sm p-8 text-center">
        <div class="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 class="text-lg font-medium text-gray-900 mb-2">No {{ currentFilterLabel.toLowerCase() }} bookings found</h2>
        <p class="text-gray-500 mb-4">When you receive new bookings, they will appear here.</p>
      </div>
      
      <!-- Bookings list -->
      <div v-else class="space-y-4">
        <div 
          v-for="booking in filteredBookings" 
          :key="booking.booking_id" 
          class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
        >
          <div class="border-l-4 px-6 py-4" :class="getStatusBorderClass(booking.status)">
            <div class="flex flex-col md:flex-row justify-between">
              <!-- Left section: Booking details -->
              <div class="md:w-1/2">
                <div class="flex items-start space-x-4">
                  <!-- Spot image - only show if image exists -->
                  <div v-if="booking.camping_spot?.image_url" class="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                    <img 
                      :src="booking.camping_spot.image_url"
                      class="w-full h-full object-cover"
                      :alt="booking.camping_spot.title"
                    />
                  </div>
                  
                  <!-- Booking info -->
                  <div>
                    <h3 class="font-medium text-gray-900">{{ booking.camping_spot?.title || 'Unnamed Spot' }}</h3>
                    <p class="text-sm text-gray-600 mt-1">Booking #{{ booking.booking_id }}</p>
                    <div class="flex items-center mt-2">
                      <span :class="getStatusClass(booking.status)" class="px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {{ getStatusLabel(booking.status) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Right section: Customer and dates -->
              <div class="md:w-1/2 mt-4 md:mt-0">
                <div class="flex flex-col md:items-end">
                  <!-- Guest info -->
                  <div class="text-sm mb-2">
                    <p class="text-gray-900 font-medium">{{ booking.user?.full_name || 'Unknown' }}</p>
                    <p class="text-gray-600">{{ booking.user?.email || 'Unknown' }}</p>
                  </div>
                  
                  <!-- Dates -->
                  <p class="text-sm text-gray-600 mt-1">
                    {{ formatDate(booking.start_date) }} - {{ formatDate(booking.end_date) }}
                    <span class="text-xs ml-1 text-gray-500">({{ calculateNights(booking.start_date, booking.end_date) }} nights)</span>
                  </p>
                  
                  <!-- Price -->
                  <p class="text-lg font-semibold text-red-600 mt-1">€{{ formatCurrency(booking.total_price) }}</p>
                  
                  <!-- Action buttons removed for fairness to users -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Pagination controls -->
      <div v-if="filteredBookings.length > 0 && totalPages > 1" class="flex justify-center mt-8">
        <div class="flex space-x-2">
          <button 
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-4 py-2 rounded-md border"
            :class="currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'"
          >
            Previous
          </button>
          
          <button 
            v-for="page in displayedPageNumbers" 
            :key="page"
            @click="currentPage = page"
            class="px-4 py-2 rounded-md border"
            :class="currentPage === page ? 'bg-red-100 text-red-600 border-red-200' : 'bg-white text-gray-700 hover:bg-gray-50'"
          >
            {{ page }}
          </button>
          
          <button 
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-4 py-2 rounded-md border"
            :class="currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import axios from '@/axios'
import { useToast } from 'vue-toastification'
import { useRouter, useRoute } from 'vue-router'
import dashboardService from '@/services/dashboardService'
import { format } from 'date-fns'

const authStore = useAuthStore()
const toast = useToast()
const router = useRouter()
const route = useRoute()

const bookings = ref([])
const loading = ref(true)
const error = ref(null)
const currentFilter = ref('all')
const currentPage = ref(1)
const itemsPerPage = 10

// Filter options
const filterOptions = [
  { label: 'All Bookings', value: 'all' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' }
]

const currentFilterLabel = computed(() => {
  const filter = filterOptions.find(f => f.value === currentFilter.value);
  return filter ? filter.label : 'All Bookings';
});

// Filtered bookings based on status filter
const filteredBookings = computed(() => {
  if (!bookings.value.length) return [];
  
  let filtered;
  if (currentFilter.value === 'all') {
    filtered = bookings.value;
  } else if (currentFilter.value === 'confirmed') {
    filtered = bookings.value.filter(booking => booking.status === 2);
  } else if (currentFilter.value === 'completed') {
    filtered = bookings.value.filter(booking => booking.status === 4);
  } else if (currentFilter.value === 'cancelled') {
    filtered = bookings.value.filter(booking => booking.status === 3);
  } else {
    filtered = bookings.value;
  }
  
  // Paginate the results
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filtered.slice(startIndex, endIndex);
});

// Pagination
const totalItems = computed(() => {
  if (!bookings.value.length) return 0;
  
  if (currentFilter.value === 'all') {
    return bookings.value.length;
  } else if (currentFilter.value === 'confirmed') {
    return bookings.value.filter(booking => booking.status === 2).length;
  } else if (currentFilter.value === 'completed') {
    return bookings.value.filter(booking => booking.status === 4).length;
  } else if (currentFilter.value === 'cancelled') {
    return bookings.value.filter(booking => booking.status === 3).length;
  } else {
    return bookings.value.length;
  }
});

const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage));

const displayedPageNumbers = computed(() => {
  const pages = [];
  const maxPagesToShow = 5;
  
  if (totalPages.value <= maxPagesToShow) {
    // If we have 5 or fewer pages, show them all
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    // Otherwise, calculate which pages to show
    const leftSide = Math.floor(maxPagesToShow / 2);
    const rightSide = maxPagesToShow - leftSide - 1;
    
    // If current page is close to the start
    if (currentPage.value <= leftSide + 1) {
      for (let i = 1; i <= maxPagesToShow - 1; i++) {
        pages.push(i);
      }
      pages.push(totalPages.value);
    } 
    // If current page is close to the end
    else if (currentPage.value >= totalPages.value - rightSide) {
      pages.push(1);
      for (let i = totalPages.value - maxPagesToShow + 2; i <= totalPages.value; i++) {
        pages.push(i);
      }
    } 
    // If current page is in the middle
    else {
      pages.push(1);
      for (let i = currentPage.value - leftSide + 1; i <= currentPage.value + rightSide - 1; i++) {
        pages.push(i);
      }
      pages.push(totalPages.value);
    }
  }
  
  return pages;
});

// Get count for each status filter
const getCountForFilter = (filterValue) => {
  if (!bookings.value.length) return 0;
  
  if (filterValue === 'confirmed') {
    return bookings.value.filter(booking => booking.status === 2).length;
  } else if (filterValue === 'completed') {
    return bookings.value.filter(booking => booking.status === 4).length;
  } else if (filterValue === 'cancelled') {
    return bookings.value.filter(booking => booking.status === 3).length;
  } else {
    return bookings.value.length;
  }
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return format(date, 'MMM d, yyyy');
};

// Format currency
const formatCurrency = (value) => {
  const num = parseFloat(value || 0);
  return num.toFixed(2);
};

// Calculate number of nights
const calculateNights = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Get status border class
const getStatusBorderClass = (status) => {
  if (!status) return 'border-gray-300';
  
  const statusMap = {
    1: 'border-yellow-400',  // Pending
    2: 'border-blue-400',    // Confirmed
    3: 'border-red-400',     // Cancelled
    4: 'border-green-400',   // Completed
    5: 'border-gray-400'     // Blocked
  };
  
  return statusMap[status] || 'border-gray-300';
};

// Get status badge class
const getStatusClass = (status) => {
  if (!status) return 'bg-gray-100 text-gray-800';
  
  const statusMap = {
    1: 'bg-yellow-100 text-yellow-800',  // Pending
    2: 'bg-blue-100 text-blue-800',      // Confirmed
    3: 'bg-red-100 text-red-800',        // Cancelled
    4: 'bg-green-100 text-green-800',    // Completed
    5: 'bg-gray-100 text-gray-800'       // Blocked
  };
  
  return statusMap[status] || 'bg-gray-100 text-gray-800';
};

// Get human-readable status label
const getStatusLabel = (status) => {
  if (!status) return 'Unknown';
  
  const statusMap = {
    1: 'Pending',
    2: 'Confirmed',
    3: 'Cancelled',
    4: 'Completed',
    5: 'Blocked'
  };
  
  return statusMap[status] || 'Unknown';
};

// Fetch all bookings
const fetchBookings = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    console.log('Fetching owner bookings...');
    
    const data = await dashboardService.getOwnerBookings();
    
    // Basic validation
    if (!data) {
      throw new Error('No data returned from server');
    }
    
    // Check if response is actually an array
    if (!Array.isArray(data)) {
      console.error('Unexpected data format:', data);
      throw new Error('Invalid data format received from server. Expected an array.');
    }
    
    console.log(`Retrieved ${data.length} bookings`);
    
    // Filter out blocked dates (status_id 5) and process the booking data
    bookings.value = data
      .filter(booking => booking.status_id !== 5)
      .map(booking => {
        console.log('Raw booking data:', booking);
        console.log('Camping spot data:', booking.camping_spot);
        console.log('Spot images:', booking.camping_spot?.images);
        
        // Ensure we have the correct image URL structure
        const spotImages = booking.camping_spot?.images || [];
        const firstImage = spotImages[0] || {};
        const imageUrl = firstImage.image_url || '';
        
        return {
          ...booking,
          status: booking.status_id,
          total_price: booking.cost || 0,
          camping_spot: {
            ...booking.camping_spot,
            title: booking.camping_spot?.title || 'Unknown Spot',
            price_per_night: booking.camping_spot?.price_per_night || 0,
            location: booking.camping_spot?.location || {},
            images: spotImages,
            image_url: imageUrl // Add direct image_url access
          },
          user: {
            full_name: booking.users?.full_name || 'Unknown',
            email: booking.users?.email || 'Unknown'
          }
        };
      });
    
    console.log(`Processed ${bookings.value.length} bookings after filtering`);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    error.value = 'Failed to load bookings. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Watch for filter changes to reset pagination
watch(currentFilter, () => {
  currentPage.value = 1;
});

// Initialize component
onMounted(async () => {
  await fetchBookings();
});
</script>

<style scoped>
.dashboard-bookings {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
