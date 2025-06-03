<template>
  <!-- Show owner warning and redirect message if user is owner of this spot -->
  <div v-if="isOwnSpot" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75">
    <div class="bg-white p-8 rounded-lg shadow-xl max-w-md text-center">
      <svg class="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z">
        </path>
      </svg>
      <h2 class="text-xl font-semibold mb-4">This is Your Camping Spot</h2>
      <p class="mb-6">You cannot book your own camping spot.</p>      <div class="flex space-x-4 justify-center">
        <button @click="goBackToCampers" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 no-underline inline-block">
          Back to Campers
        </button>
        <button @click="router.push('/dashboard/spots')" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
          Go to Dashboard
        </button>
      </div>
    </div>
  </div>
  <!-- Only show the spot details content if not user's own spot -->
  <div v-if="!isOwnSpot">
    <div class="min-h-screen bg-gray-50">
      <div v-if="loading" class="h-screen flex items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
      <div v-else-if="!spot" class="h-screen flex items-center justify-center text-lg">
        Spot not found.
      </div>
      <div v-else class="max-w-7xl mx-auto px-4 py-8">        <!-- Back Button using Component -->
        <BackButton 
          class="mb-6"
          url="/campers"
          :useRouter="true"
          @click="goBackToCampers"
        >
          Back to Campers
        </BackButton>
        <!-- Header Section -->
        <div class="mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 class="text-4xl font-semibold mb-2">{{ spot.title }}</h1>            <div class="flex flex-wrap items-center gap-4 text-lg text-gray-600">
              <div class="flex items-center">
                <span class="text-yellow-400">★</span>
                <span>{{ averageRating }} ({{ reviewStats.count || 0 }} {{ reviewStats.count === 1 ? 'review' : 'reviews' }})</span>
              </div>
              <span>•</span>
              <span>📍 {{ spot.location?.city }}, {{ spot.location?.country?.name }}</span>
            </div>
          </div>
          <button 
            @click="openMap"
            class="bg-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center gap-2 cursor-pointer hover:bg-gray-50"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
            </svg>
            View on Map
          </button>
        </div>
        <!-- Image Gallery Layout -->
        <div class="relative mb-10">
          <!-- Main Large Image -->
          <div class="w-full h-[500px] rounded-lg overflow-hidden mb-4">
            <img 
              v-if="spot.images && spot.images.length > 0 && spot.images[activeImageIndex]"
              :src="spot.images[activeImageIndex].image_url" 
              :alt="spot.title" 
              class="w-full h-full object-cover cursor-pointer"
              @click="showGallery = true"
            />
            <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
              <span class="text-gray-500">No image available</span>
            </div>
            <!-- Navigation Arrows - Only show if there are images -->
            <button 
              v-if="spot.images && spot.images.length > 1"
              @click.prevent="prevImage" 
              class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 text-gray-800 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform duration-200 hover:scale-110"
            >❮</button>
            <button 
              v-if="spot.images && spot.images.length > 1"
              @click.prevent="nextImage" 
              class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 text-gray-800 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform duration-200 hover:scale-110"
            >❯</button>
          </div>
          <!-- Thumbnail Strip - Only show if there are images -->
          <div v-if="spot.images && spot.images.length > 0" class="flex gap-2 overflow-x-auto pb-2">
            <div v-for="(image, index) in spot.images.slice(0, 4)" 
                 :key="index"
                 class="w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden"
                 :class="{ 'border-2 border-red-500': activeImageIndex === index }"
                 @click="activeImageIndex = index">
              <img :src="image.image_url" 
                   class="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" />
            </div>
            <div v-if="spot.images.length > 4"
                 class="w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden relative cursor-pointer"
                 @click="showGallery = true">
              <img :src="spot.images[4].image_url" 
                   class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white">
                +{{ spot.images.length - 4 }} more
              </div>
            </div>
          </div>
        </div>
        <!-- Main Content with Improved Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column: Details -->
          <div class="lg:col-span-2 space-y-10">
            <!-- Key Features -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
              <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div>
                  <p class="font-medium">Location</p>
                  <p class="text-gray-600">{{ spot.location?.city }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div>
                  <p class="font-medium text-lg">Max Guests</p>
                  <p class="text-gray-600">{{ spot.max_guests }} people</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.950.690h4.915c.969 0 1.371 1.240.588 1.810l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.570-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.570-.380-1.810.588-1.810h4.915a1 1 0 00.950-.690l1.519-4.674z" />
                </svg>
                <div>
                  <p class="font-medium">Rating</p>
                  <p class="text-gray-600">{{ averageRating }}</p>
                </div>
              </div>
            </div>
            <!-- Description -->
            <div class="prose max-w-none space-y-6 border-t border-b py-10">
              <h2 class="text-2xl font-semibold">About this spot</h2>
              <p class="text-gray-700 text-lg leading-relaxed whitespace-pre-line">{{ spot.description }}</p>
            </div>

            <!-- Reviews Section -->
            <ReviewsList 
              v-if="spot" 
              :camping-spot-id="spot.camping_spot_id" 
            />

            <!-- Amenities with Better Spacing -->
            <div class="space-y-6 py-6">
              <h2 class="text-2xl font-semibold">What this place offers</h2>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div v-for="amenity in spot.camping_spot_amenities" 
                     :key="amenity.amenity_id" 
                     class="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-lg">{{ amenity.amenity.name }}</span>
                </div>
              </div>
            </div>
            <!-- Availability Calendar Section -->              <div class="border-t pt-10 mt-10">
              <h2 class="text-2xl font-semibold mb-6">Availability Calendar</h2>
              <div class="grid grid-cols-1 gap-8">
                <AvailabilityCalendar 
                  v-if="spot"
                  :camping-spot-id="spot.camping_spot_id"
                  :base-price="spot.price_per_night"
                  :is-owner="false"
                  :owner-id="spot.owner_id"
                  :view-only="true"
                  @blocked-dates-loaded="handleBlockedDates"
                />
                <!-- Price suggestion widget removed for security and user-friendliness -->
              </div>
            </div>
            <!-- Location Section -->
            <div class="mt-12 space-y-6">
              <section class="bg-white p-6 rounded-xl shadow-sm">
                <h3 class="text-xl font-bold mb-4">Location</h3>
                <div v-if="mapError" class="text-center py-10 bg-gray-50 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
                  </svg>
                  <p class="text-lg font-medium">Location map cannot be displayed</p>
                  <p class="text-sm text-gray-600 mb-4">The map for this camping spot is not available.</p>
                  <button @click="mapError = false" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">Try Again</button>
                </div>
                <div v-else class="h-[60vh] rounded-lg overflow-hidden">
                  <OpenStreetLocationMap 
                    v-if="spot && spot.location"
                    :latitude="spot.location?.latitute ? Number(spot.location.latitute) : 0" 
                    :longitude="spot.location?.longtitute ? Number(spot.location.longtitute) : 0"
                    :spotTitle="spot?.title || 'Camping Spot'"
                    @map-error="mapError = true"
                  />
                </div>
              </section>
            </div>
          </div>
          <!-- Right Column: Booking Card -->
          <div class="lg:col-span-1">
            <div class="sticky top-8">
              <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div class="flex items-baseline justify-between mb-6">
                  <div>
                    <span class="text-2xl font-bold">€{{ spot.price_per_night }}</span>
                    <span class="text-gray-600">/night</span>
                  </div>
                  <div class="flex items-center">
                    <span class="text-yellow-400">★</span>
                    <span>{{ averageRating }} ({{ reviewStats.count || 0 }})</span>
                  </div>
                </div>

                <!-- Date and Guest Selection -->
                <div class="space-y-4">
                  <DateRangeSelector
                    v-model:startDate="dates.startDate"
                    v-model:endDate="dates.endDate"
                    @dateChange="calculateTotal"
                    class="date-range-selector w-full"
                  />

                  <!-- Guest Selection -->
                  <div class="mt-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                    <select 
                      v-model="guests" 
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      @change="calculateTotal">
                      <option v-for="n in spot.max_guests" :key="n" :value="n">{{ n }} {{ n === 1 ? 'guest' : 'guests' }}</option>
                    </select>
                  </div>

                  <!-- Price Breakdown -->
                  <CheckoutSummary 
                    v-if="nights > 0 && spot"
                    :basePrice="spot.price_per_night" 
                    :nights="nights"
                    :serviceFeePercent="10"
                  />

                  <!-- Availability Status -->
                  <div v-if="availabilityLoading" class="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                    <div class="flex items-center gap-2">
                      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                      <p>Checking availability...</p>
                    </div>
                  </div>
                  <div v-else-if="availabilityError" class="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <p class="font-medium">{{ availabilityError }}</p>
                    <p>Please try again or select different dates.</p>
                  </div>
                  <div v-else-if="hasBlockedDates" class="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <p class="font-medium">These dates are unavailable for booking.</p>
                    <p>Please select different dates.</p>
                  </div>
                  <div v-else-if="hasCheckedAvailability && !hasBlockedDates && dates.startDate && dates.endDate" class="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    <p class="font-medium">These dates are available!</p>
                  </div>

                  <!-- Booking Button -->
                  <button 
                    v-if="!hasBlockedDates && dates.startDate && dates.endDate"
                    @click="handleBookNow" 
                    class="w-full bg-gradient-to-r from-rose-500 to-red-600 text-white py-4 rounded-xl font-semibold hover:from-rose-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Reserve now
                  </button>
                  <button 
                    v-else-if="!hasBlockedDates && (!dates.startDate || !dates.endDate)" 
                    disabled
                    class="w-full bg-gray-300 text-gray-500 py-4 rounded-xl font-semibold cursor-not-allowed mt-6"
                  >
                    Select dates to continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Owner Warning -->
      <div v-if="isOwner && !isOwnSpot" class="bg-yellow-50 border border-yellow-200 p-4 mb-6 rounded-lg">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p class="font-medium text-yellow-800">Owner Account</p>
            <p class="text-yellow-700 text-sm">As an owner, you can browse other owners' spots but you'll need a renter account to book.</p>
          </div>
        </div>
      </div>
      <!-- Database connection error message -->
      <div v-if="dbConnectionError" class="max-w-3xl mx-auto my-20 p-8 bg-red-50 border border-red-200 rounded-lg text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="text-2xl font-bold text-red-700 mb-2">Database Connection Error</h2>
        <p class="text-red-600 mb-6">Our database is temporarily unavailable. Please try again later.</p>
        <button 
          @click="retryLoading" 
          class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
      <!-- Map Modal -->
      <div v-if="showMap" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
        <div class="bg-white rounded-lg w-full max-w-4xl p-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Location</h3>
            <button @click="closeMap" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
          </div>
          <div v-if="mapError" class="h-[60vh] bg-gray-100 rounded-lg flex items-center justify-center">
            <div class="text-center p-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
              </svg>
              <p class="text-lg font-medium">Map cannot be displayed</p>
              <p class="text-sm text-gray-600">Location information is not available for this camping spot.</p>
            </div>
          </div>
          <div v-else class="h-[60vh] rounded-lg overflow-hidden">
            <OpenStreetLocationMap 
              v-if="spot && spot.location"
              :latitude="spot.location?.latitute ? Number(spot.location.latitute) : 0" 
              :longitude="spot.location?.longtitute ? Number(spot.location.longtitute) : 0"
              :spotTitle="spot?.title || 'Camping Spot'"
              @map-error="mapError = true"
            />
          </div>
        </div>
      </div>
      <!-- Image Gallery Modal -->
      <div v-if="showGallery && spot.images && spot.images.length > 0" class="fixed inset-0 bg-black bg-opacity-90 z-[9999] flex items-center justify-center">
        <button @click="closeGallery" 
                class="absolute top-4 right-4 text-white text-4xl cursor-pointer hover:opacity-75 transition-opacity"
        >&times;</button>
        <div class="h-full w-full flex items-center justify-center">
          <button @click="prevImage" 
                  class="absolute left-4 text-white text-4xl cursor-pointer hover:opacity-75 transition-opacity p-4"
          >&lt;</button>
          <img v-if="spot.images[activeImageIndex]" 
               :src="spot.images[activeImageIndex].image_url" 
               class="max-h-[90vh] max-w-[90vw] object-contain" />
          <div v-else class="bg-gray-800 p-8 rounded-lg text-white">No image available</div>
          <button @click="nextImage" 
                  class="absolute right-4 text-white text-4xl cursor-pointer hover:opacity-75 transition-opacity p-4"
          >&gt;</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/axios'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import DateRangeSelector from '@/components/DateRangeSelector.vue'
import OpenStreetLocationMap from '@/components/OpenStreetLocationMap.vue'
import AvailabilityCalendar from '@/components/AvailabilityCalendar.vue'
import CheckoutSummary from '@/components/CheckoutSummary.vue'
import ReviewsList from '@/components/ReviewsList.vue'
import BackButton from '@/components/BackButton.vue'
import { shouldBreakAuthLoop, resetAuthLoopCounter } from '@/utils/authLoopBreaker'
const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const spot = ref(null)
const loading = ref(true)
const error = ref(null)
const activeImageIndex = ref(0)
const isAvailable = ref(true)
const dates = ref({ startDate: '', endDate: '' })
const guests = ref(1)
const blockedDates = ref([])
const showGallery = ref(false)
const showMap = ref(false)
const mapError = ref(false)
const availabilityLoading = ref(false)
const availabilityError = ref(null)
const hasCheckedAvailability = ref(false)
const hasBlockedDates = ref(false)
const dbConnectionError = ref(false)

// Define isOwner as a computed property
const isOwner = computed(() => {
  return authStore.isLoggedIn && (authStore.fullUser?.isowner === 1 || authStore.fullUser?.isowner === '1');
});

// Define isOwnSpot as a computed property
const isOwnSpot = computed(() => {
  if (!authStore.isLoggedIn || !spot.value || !authStore.fullUser) {
    return false;
  }
  return authStore.fullUser.user_id === spot.value.owner_id;
});

// Very simple back to campers function with logging
const backToCampers = () => {
  console.log("Navigating back to campers page...");
  router.push('/campers');
}
const reviewStats = ref({
  count: 0,
  average: 0,
  distribution: {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  }
});

const averageRating = computed(() => {
  if (!reviewStats.value || reviewStats.value.count === 0) return 'No ratings';
  return reviewStats.value.average.toFixed(1);
})
// Next image in the gallery
const nextImage = () => {
  if (!spot.value?.images?.length) return
  activeImageIndex.value = (activeImageIndex.value + 1) % spot.value.images.length
}
// Previous image in the gallery
const prevImage = () => {
  if (!spot.value?.images?.length) return
  activeImageIndex.value = (activeImageIndex.value - 1 + spot.value.images.length) % spot.value.images.length
}
// Open the image gallery
const openGallery = () => {
  showGallery.value = true
}
// Close the image gallery
const closeGallery = () => {
  showGallery.value = false
}

// Handle blocked dates coming from the AvailabilityCalendar component
const handleBlockedDates = (dates) => {
  if (!dates || !Array.isArray(dates)) {
    console.log('No dates provided to handleBlockedDates');
    blockedDates.value = [];
    return;
  }
  
  // Map the dates to the correct format, handling both start_date/end_date and startDate/endDate formats
  blockedDates.value = dates
    .filter(dateRange => {
      // Check for both formats and ensure we have valid dates
      const start = dateRange?.start_date || dateRange?.startDate;
      const end = dateRange?.end_date || dateRange?.endDate;
      return start && end;
    })
    .map(dateRange => {
      // Convert to standardized format using Date objects
      const start = dateRange?.start_date || dateRange?.startDate;
      const end = dateRange?.end_date || dateRange?.endDate;
      return {
        start: new Date(start),
        end: new Date(end)
      };
    });
  
  // Log for debugging
  console.log('Processed blocked dates:', blockedDates.value);
}

// Handle back button click to return to campers page while preserving filters
const goBackToCampers = () => {
  // Include any existing query parameters from the current route
  const query = { ...route.query };
  
  // Preserve date selections if they exist
  if (dates.value.startDate) query.start = dates.value.startDate;
  if (dates.value.endDate) query.end = dates.value.endDate;
  if (guests.value > 1) query.g = guests.value;
  
  // Navigate back to campers page with preserved filters
  router.push({ 
    path: '/campers',
    query
  });
}

// Gallery is opened from template directly via @click="showGallery = true"
// Save dates and guests to URL and sessionStorage for persistence
const persistDatesToUrl = (startDate, endDate, guestCount) => {
  // Update URL query parameters
  router.replace({ 
    query: { 
      ...route.query, 
      start: startDate, 
      end: endDate,
      g: guestCount
    }
  });
  // Also save to sessionStorage for cross-page persistence
  sessionStorage.setItem('campersViewDates', JSON.stringify({
    startDate,
    endDate,
    timestamp: new Date().getTime()
  }));
}

// Calculate totals when dates or guest count changes
const calculateTotal = () => {
  // Save the current state to URL
  persistDatesToUrl(dates.value.startDate, dates.value.endDate, guests.value);
  
  // Check availability if both dates are set
  if (dates.value.startDate && dates.value.endDate) {
    checkAvailability();
  }
}

// Calculate number of nights
const nights = computed(() => {
  if (!dates.value.startDate || !dates.value.endDate) return 0;
  const start = new Date(dates.value.startDate);
  const end = new Date(dates.value.endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
});

// Open map safely
const openMap = () => {
  if (!spot.value || !spot.value.location || 
      !spot.value.location.latitute || !spot.value.location.longtitute) {
    mapError.value = true
    toast.error("Location information is not available for this camping spot")
    return
  }
  // Convert coordinates to numbers and validate
  const lat = Number(spot.value.location.latitute)
  const lng = Number(spot.value.location.longtitute)
  if (isNaN(lat) || isNaN(lng)) {
    mapError.value = true
    toast.error("Invalid location coordinates for this camping spot")
    return
  }
  showMap.value = true
}
// Close map
const closeMap = () => {
  showMap.value = false
}
// Add this for the retry button
const retryLoading = () => {
  loadSpotDetails()
}
// Calculate the review stats for UI display
const calculateReviewStats = (reviews = []) => {
  const stats = {
    count: reviews.length,
    average: 0,
    distribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    }
  };

  if (stats.count === 0) return stats;

  // Calculate total and distribution
  let totalRating = 0;
  reviews.forEach(review => {
    totalRating += review.rating;
    if (stats.distribution[review.rating] !== undefined) {
      stats.distribution[review.rating]++;
    }
  });

  // Calculate average
  stats.average = totalRating / stats.count;
  return stats;
}

// Check availability for the selected dates
const checkAvailability = async () => {
  availabilityLoading.value = true;
  availabilityError.value = null;
  hasCheckedAvailability.value = false;

  try {
    if (!spot.value || !dates.value.startDate || !dates.value.endDate) {
      console.log('Missing required data for availability check');
      return;
    }

    console.log('Checking availability:', {
      spotId: spot.value.camping_spot_id,
      startDate: dates.value.startDate,
      endDate: dates.value.endDate
    });

    const response = await axios.get(`/api/camping-spots/${spot.value.camping_spot_id}/availability`, {
      params: {
        startDate: dates.value.startDate,
        endDate: dates.value.endDate
      },
      headers: {
        'X-Public-Route': 'true'
      }
    });

    // Update booking status based on response
    const existingBookings = response.data;
    const hasConflictingBookings = existingBookings.some(booking => {
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);
      const selectedStart = new Date(dates.value.startDate);
      const selectedEnd = new Date(dates.value.endDate);

      return (
        (selectedStart >= bookingStart && selectedStart <= bookingEnd) ||
        (selectedEnd >= bookingStart && selectedEnd <= bookingEnd) ||
        (selectedStart <= bookingStart && selectedEnd >= bookingEnd)
      );
    });

    // Update availability states
    isAvailable.value = !hasConflictingBookings;
    hasBlockedDates.value = hasConflictingBookings;
    hasCheckedAvailability.value = true;

    // Add the dates to blockedDates if not already there
    const newBlockedDates = existingBookings
      .map(booking => ({
        start: new Date(booking.start_date),
        end: new Date(booking.end_date)
      }))
      .filter(date => !blockedDates.value.some(
        existing => 
          existing.start.getTime() === date.start.getTime() && 
          existing.end.getTime() === date.end.getTime()
      ));

    blockedDates.value = [...blockedDates.value, ...newBlockedDates];
    console.log('Availability check complete:', { 
      isAvailable: isAvailable.value,
      blockedDates: blockedDates.value
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    isAvailable.value = false;
    availabilityError.value = 'Failed to check availability';
  } finally {
    availabilityLoading.value = false;
  }
};

// Load spot details including reviews and availability
const loadSpotDetails = async () => {
  loading.value = true
  error.value = null
  spot.value = null
  try {
    // First get base camping spot details
    const { data } = await axios.get(`/api/camping-spots/${route.params.id}`, {
      headers: {
        'X-Public-Route': 'true' 
      }
    })
    spot.value = data
    
    // If spot is found, load reviews
    if (spot.value) {
      try {
        console.log('Loading reviews for spot:', spot.value.camping_spot_id);
        const reviewsResponse = await axios.get(`/api/camping-spots/${spot.value.camping_spot_id}/reviews`, {
          headers: {
            'X-Public-Route': 'true'
          }
        });
        reviewStats.value = calculateReviewStats(reviewsResponse.data);
        console.log('Reviews loaded successfully:', reviewStats.value);

        // Also load initial availability for current month
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const response = await axios.get(`/api/camping-spots/${spot.value.camping_spot_id}/availability`, {
          params: {
            startDate: now.toISOString().split('T')[0],
            endDate: endOfMonth.toISOString().split('T')[0]
          },
          headers: {
            'X-Public-Route': 'true'
          }
        });

        // Update blocked dates from the response
        const existingBookings = response.data;
        blockedDates.value = existingBookings.map(booking => ({
          start: new Date(booking.start_date),
          end: new Date(booking.end_date)
        }));

      } catch (error) {
        console.error('Error loading additional data:', error);
        availabilityError.value = 'Failed to load availability data';
      }
    }
  } catch (err) {
    error.value = 'Failed to load spot details'
    console.error(err)
  } finally {
    loading.value = false
  }
}
// Initial load
onMounted(() => {
  // Check if spot ID is available in route params
  if (!route.params.id) {
    error.value = 'Invalid spot ID'
    loading.value = false
    return
  }
  
  // Load spot details
  loadSpotDetails()
  
  // Check if we need to restore booking state after login redirect
  checkForRestoredBookingState()
  
  // Reset auth loop counter since we've successfully loaded the camping spot detail page
  resetAuthLoopCounter()
})
// Watch for date changes and check availability
watch([() => dates.value.startDate, () => dates.value.endDate], async ([newStartDate, newEndDate], [oldStartDate, oldEndDate]) => {
  // Only check if both dates are set and either date has changed
  if (newStartDate && newEndDate && (newStartDate !== oldStartDate || newEndDate !== oldEndDate)) {
    await checkAvailability();
    calculateTotal();
  }
});

// Auth loop breaker utilities are already imported at the top of the file

const handleBookNow = async () => {
  if (!authStore.isLoggedIn) {
    // Save current booking state to localStorage with timestamp
    const bookingState = {
      start: dates.value.startDate,
      end: dates.value.endDate,
      guests: guests.value,
      spotId: spot.value?.camping_spot_id,
      timestamp: new Date().getTime()
    };
    
    // Store booking data and current URL
    localStorage.setItem('pendingBooking', JSON.stringify(bookingState));
    localStorage.setItem('pendingBookingUrl', router.currentRoute.value.path);
    localStorage.setItem('pendingRedirect', 'booking');
    
    // Navigate to auth
    router.push({ path: '/auth' });
    return;
  }

  // For logged-in users, proceed with booking
  if (!dates.value.startDate || !dates.value.endDate || !guests.value) {
    toast.error('Please select dates and number of guests');
    return;
  }

  try {
    // Prepare the booking data
    const basePrice = spot.value.price_per_night * nights.value;
    const serviceFee = basePrice * 0.1; // 10% service fee
    const totalAmount = basePrice + serviceFee;

    // Create the checkout session directly from here
    const { data } = await axios.post('/api/checkout/create-session', {
      camper_id: spot.value.camping_spot_id,
      user_id: authStore.fullUser.user_id,
      start_date: dates.value.startDate,
      end_date: dates.value.endDate,
      number_of_guests: guests.value,
      cost: basePrice.toFixed(2),
      service_fee: serviceFee.toFixed(2),
      total: totalAmount.toFixed(2),
      spot_name: spot.value.title
    });

    // Handle successful response
    if (data && data.url) {
      toast.success('Redirecting to payment...');
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } else {
      throw new Error('Invalid checkout session response');
    }
  } catch (error) {
    console.error('Booking error:', error);
    toast.error(error.response?.data?.error || 'Failed to create booking');
  }
};


// Safely restore booking state from auth redirect
const checkForRestoredBookingState = () => {
  const authComplete = localStorage.getItem('authenticationComplete');
  
  // Only check if we've just completed authentication
  if (authComplete === 'true') {
    // Clear the flag immediately
    localStorage.removeItem('authenticationComplete');
    
    // Check URL parameters for restored booking state
    const urlParams = new URLSearchParams(window.location.search);
    const startDate = urlParams.get('startDate');
    const endDate = urlParams.get('endDate');
    const guestCount = urlParams.get('guests');
    
    // If we have date parameters, restore them to the component state
    if (startDate && endDate) {
      dates.value.startDate = startDate;
      dates.value.endDate = endDate;
      
      if (guestCount) {
        const parsedGuests = parseInt(guestCount, 10);
        if (!isNaN(parsedGuests) && parsedGuests > 0) {
          guests.value = Math.min(parsedGuests, spot.value?.max_guests || 1);
        }
      }
      
      // Recalculate the booking totals with the restored values
      calculateTotal();
      
      // Show success message
      toast.success('Your booking information has been restored');
    }
  }
}

// Call the restore function on app load
onMounted(() => {
  checkForRestoredBookingState();
});
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
