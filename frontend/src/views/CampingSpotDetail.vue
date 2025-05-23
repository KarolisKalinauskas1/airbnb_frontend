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
                    <span class="text-gray-600">/night</span>                  </div>
                  <div class="flex items-center">
                    <span class="text-yellow-400">★</span>
                    <span>{{ averageRating }} ({{ reviewStats.count || 0 }})</span>
                  </div>
                </div>
                <!-- Owner's own spot warning - show instead of booking controls -->
                <div v-if="isOwnSpot" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
                  <div class="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-600 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p class="font-medium text-yellow-800">This is your camping spot</p>
                      <p class="text-yellow-700 text-sm mt-1">You cannot book your own camping spot. Manage it from your dashboard instead.</p>
                      <button 
                        @click="router.push('/dashboard/spots')" 
                        class="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm">
                        Go to Dashboard
                      </button>
                    </div>
                  </div>
                </div>
                <!-- Only show booking elements if not owner's own spot -->
                <div v-else class="space-y-4">
                  <DateRangeSelector
                    v-model:startDate="dates.startDate"
                    v-model:endDate="dates.endDate"
                    @dateChange="calculateTotal"
                    class="date-range-selector w-full"
                  />
                  <div class="mt-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                    <select 
                      v-model="guests" 
                      class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      @change="calculateTotal">
                      <option v-for="n in spot.max_guests" :key="n" :value="n">{{ n }} {{ n === 1 ? 'guest' : 'guests' }}</option>
                    </select>
                  </div>
                  <!-- Use the new CheckoutSummary component when dates are selected -->
                  <CheckoutSummary 
                    v-if="nights > 0 && spot"
                    :basePrice="spot.price_per_night" 
                    :nights="nights"
                    :serviceFeePercent="10"
                  />
                  <!-- Add a warning if dates overlap with blocked dates -->
                  <div v-if="hasBlockedDates" class="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <p class="font-medium">These dates are unavailable for booking.</p>
                    <p>Please select different dates.</p>
                  </div>
                  <!-- Show booking button based on user type -->
                  <button 
                    v-if="!hasBlockedDates && dates.startDate && dates.endDate"
                    @click="handleBookNow" 
                    class="w-full bg-gradient-to-r from-rose-500 to-red-600 text-white py-4 rounded-xl font-semibold hover:from-rose-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"                  >
                    Reserve now
                  </button>
                  <!-- Show a disabled state when there are no dates selected -->
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
const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const spot = ref(null)
const loading = ref(true)
const error = ref(null)
const activeImageIndex = ref(0)

// Very simple back to campers function with logging
const backToCampers = () => {
  console.log("Navigating back to campers page...");
  window.location.href = '/campers';
}
const dates = ref({ startDate: '', endDate: '' })
const guests = ref(1)
const blockedDates = ref([])
const showGallery = ref(false)
const showMap = ref(false)
const mapError = ref(false)
const dbConnectionError = ref(false)
const showRetryButton = ref(false)
const hasCheckedAvailability = ref(false)
const availabilityLoading = ref(false)
const availabilityError = ref(null)
// Track if there are any blocking dates for the selected period
const hasBlockedDates = ref(false)
// Compute the number of nights
const nights = computed(() => {
  if (!dates.value.startDate || !dates.value.endDate) return 0
  const start = new Date(dates.value.startDate)
  const end = new Date(dates.value.endDate)
  return Math.round((end - start) / (1000 * 60 * 60 * 24))
})
// Calculate base price and total price with service fees
const basePrice = computed(() => {
  if (!spot.value) return 0
  return spot.value.price_per_night * nights.value
})
const serviceFee = computed(() => {
  return basePrice.value * 0.10 // 10% service fee
})
const totalPrice = computed(() => {
  return basePrice.value + serviceFee.value
})
// Check if user is the owner of THIS specific spot
const isOwnSpot = computed(() => {
  if (!authStore.publicUser || !spot.value) return false;
  const isOwner = authStore.publicUser.user_id === spot.value.owner_id;
  // Debug logs to help identify ownership issues
  if (isOwner) {
  }
  return isOwner;
});
// Check if user is an owner generally
const isOwner = computed(() => {
  const isOwnerAccount = authStore.publicUser?.isowner === 1;
  // Debug log
  if (isOwnerAccount) {
  }
  return isOwnerAccount;
});
// Determine if the user can book the spot
// Used for UI rendering conditions
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
// Check availability of the selected dates
const checkAvailability = async () => {
  if (!dates.value.startDate || !dates.value.endDate || !spot.value) return
  availabilityLoading.value = true
  hasBlockedDates.value = false
  availabilityError.value = null
  
  console.log(`[DEBUG] Checking availability for dates:`, {
    startDate: dates.value.startDate,
    endDate: dates.value.endDate,
    spotId: spot.value.camping_spot_id
  });
  
  try {
    // First try with the API endpoint
    try {
      const { data } = await axios.get(`/api/camping-spots/${spot.value.camping_spot_id}/availability`, {
        params: {
          startDate: dates.value.startDate,
          endDate: dates.value.endDate
        },
        // Add specific config to prevent over-throttling
        bypassThrottle: true,
        timeout: 15000, // Longer timeout for availability check
        // Mark this request as a public route
        headers: {
          'X-Public-Route': 'true'
        }
      })
      console.log(`[DEBUG] Availability check succeeded:`, data);
      
      // Check if dates are available
      hasBlockedDates.value = data.hasBlockedDates
      if (hasBlockedDates.value) {
        availabilityError.value = 'Selected dates are not available for booking'
      }
    } catch (apiError) {
      console.error(`[DEBUG] Primary availability check failed:`, {
        status: apiError.response?.status, 
        message: apiError.message
      });
      
      // If API endpoint fails, try without the api prefix
      if (apiError.response?.status !== 429) { // Don't retry if rate limited
        try {
          console.log(`[DEBUG] Attempting fallback availability check`);
          
          const { data } = await axios.get(`/camping-spots/${spot.value.camping_spot_id}/availability`, {
            params: {
              startDate: dates.value.startDate,
              endDate: dates.value.endDate
            },
            bypassThrottle: true,
            timeout: 15000,
            // Mark this request as a public route
            headers: {
              'X-Public-Route': 'true'
            }
          })
          
          console.log(`[DEBUG] Fallback availability check succeeded:`, data);
          
          // Check if dates are available
          hasBlockedDates.value = data.hasBlockedDates
          if (hasBlockedDates.value) {
            availabilityError.value = 'Selected dates are not available for booking'
          }
        } catch (fallbackError) {
          console.error(`[DEBUG] Fallback availability check failed:`, {
            status: fallbackError.response?.status,
            message: fallbackError.message
          });
          throw fallbackError; // Let the outer catch handle this
        }
      } else {
        // Handle rate limiting specifically
        console.warn('[DEBUG] Availability check rate limited:', apiError)
        // Don't set hasBlockedDates to true just because of rate limiting
        // Instead, set a more appropriate error
        availabilityError.value = 'Unable to check availability right now. Please try again shortly.'
        // Return without setting hasCheckedAvailability to true
        availabilityLoading.value = false
        return
      }
    }
    hasCheckedAvailability.value = true
  } catch (error) {
    console.error('Failed to check availability:', error)
    // Check for database connection errors
    if (error.response?.status === 503 || 
        error.response?.data?.code === 'P1001' || 
        error.response?.data?.code === 'DB_CONNECTION_ERROR' ||
        (error.response?.data?.error && error.response.data.error.includes('database'))) {
      availabilityError.value = 'Database is currently unavailable. Unable to check availability.'
    } else if (error.code === 'ECONNABORTED') {
      availabilityError.value = 'Request timed out. Please try again.'
    } else {
      availabilityError.value = 'Failed to check availability for selected dates'
    }
  } finally {
    availabilityLoading.value = false
  }
}
// Handle blocked dates from calendar component
const handleBlockedDates = (dates) => {
  blockedDates.value = dates
  checkDateOverlap()
}
// Check if selected dates overlap with blocked dates
const checkDateOverlap = () => {
  if (!dates.value.startDate || !dates.value.endDate || blockedDates.value.length === 0) {
    hasBlockedDates.value = false
    return
  }
  const start = new Date(dates.value.startDate)
  const end = new Date(dates.value.endDate)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  hasBlockedDates.value = blockedDates.value.some(block => {
    const blockStart = new Date(block.start_date)
    const blockEnd = new Date(block.end_date)
    blockStart.setHours(0, 0, 0, 0)
    blockEnd.setHours(0, 0, 0, 0)
    // Check if ranges overlap
    return (start <= blockEnd && end >= blockStart)
  })
}
// Watch for changes to dates and guests to persist them and check availability
watch([() => dates.value.startDate, () => dates.value.endDate], 
  ([newStartDate, newEndDate]) => {
    if (newStartDate && newEndDate) {
      persistDatesToUrl(newStartDate, newEndDate, guests.value)
      checkAvailability() // Check availability when dates change
    }
  }
)
// Watch for changes to guests to persist them
watch(() => guests.value, (newGuests) => {
  if (dates.value.startDate && dates.value.endDate) {
    persistDatesToUrl(dates.value.startDate, dates.value.endDate, newGuests)
  }
})
// Handle the booking process
const handleBookNow = async () => {
  // Prevent owners from booking their own spot
  if (authStore.publicUser && spot.value) {
    const isCurrentUserTheOwner = authStore.publicUser.user_id === spot.value.owner_id;
    if (isCurrentUserTheOwner) {
      toast.error("You cannot book your own camping spot");
      router.push('/dashboard/spots');
      return;
    }
  }
  if (isOwnSpot.value) {
    toast.error("You cannot book your own camping spot");
    setTimeout(() => {
      router.push('/dashboard/spots');
    }, 2000);
    return;
  }
  if (!dates.value.startDate || !dates.value.endDate) {
    toast.warning('Please select check-in and check-out dates');
    return;
  }
  if (guests.value < 1) {
    toast.warning('Please specify at least 1 guest');
    return;
  }
  if (hasBlockedDates.value) {
    toast.error('Selected dates are not available for booking');
    return;
  }  if (!authStore.isAuthenticated) {
    const bookingDetails = {
      spotId: spot.value.camping_spot_id,
      startDate: dates.value.startDate,
      endDate: dates.value.endDate,
      guests: guests.value,
      fromCampers: true
    };
    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingDetails));
    router.push({
      path: '/auth',
      query: {
        redirect: route.fullPath,
        startDate: dates.value.startDate,
        endDate: dates.value.endDate,
        guests: guests.value,
        fromCampers: true
      }
    });
    return;
  }
  if (!authStore.publicUser) {
    try {
      const session = await authStore.getSupabaseSession();
      if (!session) throw new Error('No active session');
      const response = await axios.get('/api/users/me');
      if (response.data) {
        authStore.publicUser = response.data;
      } else {
        throw new Error('No user data received');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      toast.error('Failed to load user information. Please try again.');
      return;
    }
  }
  // Validate required values for the checkout session
  if (!spot.value?.camping_spot_id || !authStore.publicUser?.user_id) {
    toast.error('Required booking information is missing. Please try again.');
    console.error('Missing required IDs:', {
      camping_spot_id: spot.value?.camping_spot_id,
      user_id: authStore.publicUser?.user_id
    });
    return;
  }

  if (!dates.value.startDate || !dates.value.endDate || !guests.value || guests.value < 1) {
    toast.error('Please fill in all the booking details.');
    return;
  }

  // Validate the amounts are positive numbers
  const baseAmount = basePrice.value;
  const serviceFeeAmount = serviceFee.value;
  const totalAmount = totalPrice.value;

  if (!baseAmount || !serviceFeeAmount || !totalAmount || baseAmount <= 0 || serviceFeeAmount < 0 || totalAmount <= 0) {
    toast.error('Invalid pricing information. Please try again.');
    console.error('Invalid amounts:', { baseAmount, serviceFeeAmount, totalAmount });
    return;
  }

  loading.value = true;
  try {
    await checkAvailability();
    if (hasBlockedDates.value) {
      toast.error('Sorry, these dates are no longer available');
      loading.value = false;
      return;
    }

    const sessionData = {
      camper_id: spot.value.camping_spot_id,
      user_id: authStore.publicUser.user_id,
      start_date: dates.value.startDate,
      end_date: dates.value.endDate,
      number_of_guests: guests.value,
      cost: baseAmount,
      service_fee: serviceFeeAmount,
      total: totalAmount,
      spot_name: spot.value.title || 'Camping Spot'
    };

    // Add retry logic for better reliability
    let retries = 3;
    let response;

    while (retries > 0) {
      try {
        console.log('Attempting to create checkout session with data:', JSON.stringify(sessionData, null, 2));
        response = await axios.post('/api/checkout/create-session', sessionData);
        console.log('Stripe response received:', response.status, JSON.stringify(response.data, null, 2));
        break;
      } catch (err) {
        console.error(`Attempt failed (${retries} left):`, err.message);
        if (err.response?.data) {
          console.error('Server response:', JSON.stringify(err.response.data, null, 2));
        }
        retries--;
        if (retries === 0) throw err;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between retries
      }
    }

    // Validate and normalize the response structure
    if (!response.data || typeof response.data !== 'object') {
      console.error('Invalid response data:', response.data);
      throw new Error('Invalid response format from server');
    }
    
    // Handle both response formats: {url: string} or {url: string, session_id: string, status: string}
    const stripeUrl = response.data.url;
    if (!stripeUrl || typeof stripeUrl !== 'string') {
      console.error('Missing or invalid URL in response:', response.data);
      throw new Error('Invalid URL in server response');
    }

    // Validate that it's a Stripe URL
    if (!stripeUrl.startsWith('https://checkout.stripe.com/')) {
      console.error('Invalid Stripe URL:', stripeUrl);
      throw new Error('Invalid Stripe URL received');
    }
    const sessionUrl = stripeUrl;
    console.log('Successfully received Stripe URL:', sessionUrl);
    if (authStore.publicUser && spot.value) {
      const currentUserId = parseInt(authStore.publicUser.user_id);
      const spotOwnerId = parseInt(spot.value.owner_id);
      if (currentUserId === spotOwnerId) {
        console.error('CRITICAL SAFETY BLOCK: Prevented owner from booking their own spot');
        loading.value = false;
        toast.error("You cannot book your own camping spot");
        router.push('/dashboard/spots');
        return;
      }
    }
    toast.success('Redirecting to payment...');
    window.location.href = sessionUrl;
  } catch (error) {
    console.error('Booking Error:', error);
    loading.value = false;
    if (error.response?.status === 401) {
      toast.error('Your session has expired. Please log in again to continue.');
      router.push({
        path: '/auth',
        query: {
          redirect: route.fullPath,
          startDate: dates.value.startDate,
          endDate: dates.value.endDate,
          guests: guests.value,
          authError: 'session_expired',
          fromCampers: true
        }
      });
      return;
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Cannot connect to server. Please check your internet connection or try again later.');
    } else if (error.response?.status === 400 && error.response?.data?.error) {
      toast.error(`Booking failed: ${error.response.data.error}`);
      if (error.response.data.details) {
        console.error('Error details:', error.response.data.details);
      }
    } else if (error.response?.data?.error) {
      toast.error(`Payment error: ${error.response.data.error}`);
    } else {
      toast.error(error.message || 'Failed to process booking. Please try again.');
    }
  } finally {
    loading.value = false;
  }
};
// Handle price update (for owner)
const handlePriceUpdate = (newPrice) => {
  if (!spot.value) return
  spot.value.price_per_night = newPrice
}
// Improved error handling for loading camping spot details
const loadSpotDetails = async () => {
  const spotId = route.params.id
  if (!spotId) {
    console.error('No spot ID provided')
    router.push('/campers')
    return
  }
  loading.value = true;
  error.value = null;
  dbConnectionError.value = false;
  
  try {
    console.log(`[DEBUG] Fetching camping spot details for ID: ${spotId}`, {
      authenticated: authStore.isAuthenticated,
      publicUser: !!authStore.publicUser
    });
    
    const response = await axios.get(`/api/camping-spots/${spotId}`, {
      params: {
        startDate: dates.value.startDate || route.query.start,
        endDate: dates.value.endDate || route.query.end
      },
      // Mark this request as a public route
      headers: {
        'X-Public-Route': 'true'
      }
    });
    
    console.log(`[DEBUG] Camping spot details received for ID: ${spotId}`);
      
    if (!response || !response.data) {
      throw new Error('No data received from server')
    }
    spot.value = response.data
    // Make sure images is always an array
    if (!spot.value.images) {
      spot.value.images = []
    }
    // Make sure amenities is always an array
    if (!spot.value.camping_spot_amenities) {
      spot.value.camping_spot_amenities = []
    }
    // Make sure location exists    
    // Fetch review statistics
    await loadReviewStats(spotId);
    if (!spot.value.location) {
      spot.value.location = {
        city: 'Unknown',
        country: { name: 'Unknown' }
      }
    }
    // First check URL parameters for date information
    if (route.query.start) {
      dates.value.startDate = route.query.start
    }
    if (route.query.end) {
      dates.value.endDate = route.query.end
    }
    if (route.query.g) {
      guests.value = parseInt(route.query.g) || 1
    }
    // If URL doesn't have dates, check session storage
    if (!dates.value.startDate || !dates.value.endDate) {
      const savedDates = sessionStorage.getItem('campersDates')
      if (savedDates) {
        try {
          const parsed = JSON.parse(savedDates)
          if (parsed.startDate && parsed.endDate) {
            dates.value.startDate = parsed.startDate
            dates.value.endDate = parsed.endDate
            // Persist the dates to URL
            persistDatesToUrl(dates.value.startDate, dates.value.endDate, guests.value)
          }
        } catch (e) {
          console.error('Failed to parse saved dates:', e)
        }
      }
    }
    // Check availability if dates are set
    if (dates.value.startDate && dates.value.endDate) {
      checkAvailability()
    }
  } catch (error) {
    console.error('Failed to load camping spot:', error)
    error.value = error.message || 'Failed to load camping spot details'
    // Check for database connection errors
    if (error.response?.status === 503 || 
        error.response?.data?.code === 'P1001' || 
        error.response?.data?.code === 'DB_CONNECTION_ERROR' ||
        (error.response?.data?.error && error.response.data.error.includes('database'))) {
      dbConnectionError.value = true
    }
    showRetryButton.value = true
  } finally {
    loading.value = false
  }
}

// Load review statistics separately
const loadReviewStats = async (spotId) => {
  if (!spotId) return;
  
  try {
    console.log(`[DEBUG] Fetching review stats for ID: ${spotId}`);
    
    const reviewResponse = await axios.get(`/api/reviews/stats/${spotId}`, {
      // Mark this request as a public route
      headers: {
        'X-Public-Route': 'true'
      }
    });
    
    if (reviewResponse && reviewResponse.data) {
      reviewStats.value = reviewResponse.data;
      console.log('[DEBUG] Review stats loaded successfully:', reviewStats.value);
    }
  } catch (reviewError) {
    console.error('[DEBUG] Error fetching review statistics:', {
      error: reviewError.message,
      status: reviewError.response?.status,
      url: `/api/reviews/stats/${spotId}`
    });
    
    // Try fallback without the /api prefix if that might be the issue
    try {
      console.log('[DEBUG] Attempting fallback review stats request...');
      
      const fallbackResponse = await axios.get(`/reviews/stats/${spotId}`, {
        // Mark this request as a public route
        headers: {
          'X-Public-Route': 'true'
        }
      });
      
      if (fallbackResponse && fallbackResponse.data) {
        reviewStats.value = fallbackResponse.data;
        console.log('[DEBUG] Review stats loaded via fallback:', reviewStats.value);
      }
    } catch (fallbackError) {
      console.error('[DEBUG] Fallback review stats request also failed:', {
        error: fallbackError.message,
        status: fallbackError.response?.status,
        url: `/reviews/stats/${spotId}`
      });
      // Non-blocking error - we'll just use default reviewStats values
    }
  }
};

// After adding @dateChange="calculateTotal", implement the function:
const calculateTotal = () => {
  // Ensure dates are stored in sessionStorage
  if (dates.value.startDate && dates.value.endDate) {
    persistDatesToUrl(dates.value.startDate, dates.value.endDate, guests.value)
    checkAvailability()
  }
}
// Function already defined above, so this declaration is removed

onMounted(async () => {
  console.log('[DEBUG] CampingSpotDetail mounted:', {
    isLoggedIn: authStore.isLoggedIn,
    hasPublicUser: !!authStore.publicUser,
    spotId: route.params.id
  });
  
  // First, check if user is already authenticated with public user info
  if (authStore.isLoggedIn && authStore.publicUser) {
    console.log('[DEBUG] User already authenticated with public info');
  } 
  // Otherwise, fetch public user info if logged in
  else if (authStore.isLoggedIn) {
    try {
      console.log('[DEBUG] Fetching public user info for authenticated user');
      await authStore.fetchPublicUser(authStore.user.id, true);
    } catch (error) {
      console.error('[DEBUG] Error fetching user info:', error);
    }
  } else {
    console.log('[DEBUG] User not authenticated, proceeding as guest');
  }
  
  // Now load the spot details
  await loadSpotDetails();
});
</script>
<style scoped>
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
/* Enhanced spacing utilities */
.space-y-12 > * + * {
  margin-top: 3rem;
}
.space-y-10 > * + * {
  margin-top: 2.5rem;
}
.space-y-8 > * + * {
  margin-top: 2rem;
}
.space-y-6 > * + * {
  margin-top: 1.5rem;
}
.space-y-4 > * + * {
  margin-top: 1rem;
}
.space-y-2 > * + * {
  margin-top: 0.5rem;
}
/* Improved DateRangePicker styling */
.date-range-selector {
  padding: 10px 0;
  width: 100%;
}
:deep(.dp__main) {
  width: 100%;
}
/* Make DateRangePicker wider */
:deep(.dp__input) {
  padding: 10px 14px !important;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  line-height: 1.5;
  min-width: 320px;
}
/* Make DateRangePicker appear above all other elements */
:deep(.dp__input_wrap) {
  width: 100%;
}
:deep(.dp__overlay) {
  z-index: 9998 !important;
}
/* Make sure buttons are more clickable */
.light-text {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
/* Transition for hover effects */
.transition-colors {
  transition: background-color 0.3s ease, border-color 0.15s ease;
}
.transition-opacity {
  transition: opacity 0.3s ease;
}
/* Navigation arrow styles */
.absolute {
  z-index: 10;
}
/* Added CSS for the gallery navigation buttons */
.gallery-nav-button {
  font-size: 36px;
  color: white;
  transition: opacity 0.2s ease;
}
/* Enhanced button styles */
button {
  outline: none !important;
}
button:focus {
  outline: none !important;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}
/* Gradient animation for main booking button */
@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
.from-rose-500.to-red-600:hover {
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
}
</style>