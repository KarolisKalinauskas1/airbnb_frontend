<template>
  <div class="bg-white p-6 rounded-xl shadow-md space-y-8">
    <div class="flex justify-between items-center border-b pb-4">
      <h2 class="text-xl font-semibold text-gray-800">Filters</h2>
      <button 
        @click="resetFilters"
        class="text-sm text-red-500 hover:text-red-600 cursor-pointer transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-red-50"
      >
        Reset Filters
      </button>
    </div>

    <!-- Dates (if provided) -->
    <div v-if="dates.startDate && dates.endDate" class="border-b pb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Selected Dates</label>
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <span>{{ formatDate(dates.startDate) }}</span>
        <span>→</span>
        <span>{{ formatDate(dates.endDate) }}</span>
      </div>
    </div>

    <!-- Price Range Buttons -->
    <div class="space-y-4 border-t pt-6">
      <h3 class="text-base font-medium text-gray-800">Price Range</h3>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="range in priceRanges"
          :key="range.id"
          @click="selectPriceRange(range)"
          class="px-4 py-2 rounded-lg border cursor-pointer transition-colors duration-200"
          :class="selectedPriceRange?.id === range.id ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-300 hover:bg-gray-50'"
        >
          {{ range.label }}
        </button>
      </div>
    </div>

    <!-- Custom Price Range -->
    <div class="mt-4">
      <h3 class="text-sm font-medium mb-2">Custom Price Range</h3>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <input
            type="number"
            v-model="filters.minPrice"
            placeholder="Min €"
            class="w-full px-3 py-2 border rounded-lg"
            @change="emitFilters"
          >
        </div>
        <div>
          <input
            type="number"
            v-model="filters.maxPrice"
            placeholder="Max €"
            class="w-full px-3 py-2 border rounded-lg"
            @change="emitFilters"
          >
        </div>
      </div>
    </div>

    <!-- Price Range with better styling -->
    <div class="border-b pb-4">
      <label class="block text-sm font-medium text-gray-700 mb-3">Price Range</label>
      <div class="space-y-4">
        <div class="flex justify-between text-sm text-gray-600">
          <span>€{{ filters.minPrice }}</span>
          <span>€{{ filters.maxPrice }}</span>
        </div>
        <div class="relative pt-1">
          <div class="h-1 bg-gray-200 rounded-full">
            <div 
              class="absolute h-1 bg-red-500 rounded-full"
              :style="{ 
                left: `${(filters.minPrice / 1000) * 100}%`,
                right: `${100 - (filters.maxPrice / 1000) * 100}%`
              }"
            ></div>
          </div>
          <input
            type="range"
            v-model="filters.minPrice"
            :min="0"
            :max="filters.maxPrice"
            class="absolute w-full top-0 h-1 appearance-none pointer-events-none opacity-0"
            @input="updateFilters"
          >
          <input
            type="range"
            v-model="filters.maxPrice"
            :min="filters.minPrice"
            :max="1000"
            class="absolute w-full top-0 h-1 appearance-none pointer-events-none opacity-0"
            @input="updateFilters"
          >
        </div>
      </div>
    </div>

    <!-- Guests Counter -->
    <div class="space-y-4 border-t pt-6">
      <h3 class="text-base font-medium text-gray-800">Number of Guests</h3>
      <div class="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
        <button 
          @click="decrementGuests"
          class="w-10 h-10 rounded-full border-2 border-red-500 flex items-center justify-center hover:bg-red-50 transition-colors text-red-500 text-xl cursor-pointer"
          :disabled="filters.guests <= 1"
        >-</button>
        <span class="text-xl font-medium">{{ filters.guests }}</span>
        <button 
          @click="incrementGuests"
          class="w-10 h-10 rounded-full border-2 border-red-500 flex items-center justify-center hover:bg-red-50 transition-colors text-red-500 text-xl cursor-pointer"
        >+</button>
      </div>
    </div>

    <!-- Amenities Section -->
    <div class="space-y-4 border-t pt-6">
      <h3 class="text-base font-medium text-gray-800">Amenities</h3>
      <div class="space-y-3 max-h-48 overflow-y-auto pr-2">
        <label 
          v-for="amenity in availableAmenities" 
          :key="amenity.amenity_id"
          class="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors duration-200"
        >
          <input
            type="checkbox"
            :value="amenity.amenity_id"
            v-model="filters.amenities"
            class="rounded-lg border-gray-300 text-red-500 focus:ring-red-500 w-5 h-5 cursor-pointer"
          >
          <span class="ml-3 text-gray-700">{{ amenity.name }}</span>
        </label>
      </div>
    </div>

    <!-- Apply Button -->
    <button 
      type="button" 
      @click="applyFilters"
      class="w-full px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-lg font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5 cursor-pointer"
    >
      Apply Filters
    </button>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import axios from '@/axios'

const props = defineProps({
  isSticky: Boolean,
  dates: {
    type: Object,
    default: () => ({ startDate: '', endDate: '' })
  }
})

const emit = defineEmits(['filter'])

const filters = reactive({
  minPrice: null,
  maxPrice: null,
  guests: 1,
  amenities: []
})

const availableAmenities = ref([])

const fetchAmenities = async () => {
  try {
    const { data } = await axios.get('/camping-spots/amenities')
    availableAmenities.value = data
  } catch (error) {
    console.error('Failed to fetch amenities:', error)
    // Import toast dynamically to avoid undefined reference
    import('vue-toastification').then(toastModule => {
      const { useToast } = toastModule;
      useToast().error('Failed to load amenities');
    }).catch(err => {
      console.error('Could not show toast notification:', err);
    });
  }
}

const applyFilters = () => {
  emit('filter', {
    minPrice: filters.minPrice || null,
    maxPrice: filters.maxPrice || null,
    guests: Number(filters.guests) || null,
    amenities: filters.amenities
  })
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString()
}

const decrementGuests = () => {
  if (filters.guests > 1) {
    filters.guests--
    updateFilters()
  }
}

const incrementGuests = () => {
  filters.guests++
  updateFilters()
}

const updateFilters = () => {
  emit('filter', { ...filters })
}

onMounted(() => {
  fetchAmenities()
  const savedFilters = JSON.parse(localStorage.getItem('campingFilters'))
  if (savedFilters) {
    Object.assign(filters, savedFilters)
    emitFilters()
  }
})

const priceRanges = [
  { id: 1, label: '< €50', min: 0, max: 50 },
  { id: 2, label: '€50-100', min: 50, max: 100 },
  { id: 3, label: '€100-150', min: 100, max: 150 },
  { id: 4, label: '> €150', min: 150, max: null }
]

const selectedPriceRange = ref(null)

const selectPriceRange = (range) => {
  if (selectedPriceRange.value?.id === range.id) {
    selectedPriceRange.value = null
    filters.minPrice = null
    filters.maxPrice = null
  } else {
    selectedPriceRange.value = range
    filters.minPrice = range.min
    filters.maxPrice = range.max
  }
  emitFilters()
}

const emitFilters = () => {
  emit('filter', { ...filters })
}

watch(filters, (newFilters) => {
  localStorage.setItem('campingFilters', JSON.stringify(newFilters))
}, { deep: true })

const resetFilters = () => {
  filters.minPrice = null
  filters.maxPrice = null
  filters.guests = 1
  filters.amenities = []
  selectedPriceRange.value = null
  localStorage.removeItem('campingFilters')
  emitFilters()
}
</script>

<style scoped>
/* Improve range input styling */
input[type="range"] {
  height: 1px;
  -webkit-appearance: none;
  pointer-events: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  pointer-events: auto;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  border: 2px solid #ef4444;
  cursor: pointer;
}

/* Rest of the styles */
input[type="range"] {
  height: 2px;
  background: #ef4444;
}

input[type="range"]::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  background: #fff;
  border: 2px solid #ef4444;
  border-radius: 50%;
  cursor: pointer;
}

.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #9CA3AF transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #9CA3AF;
  border-radius: 3px;
}
</style>
