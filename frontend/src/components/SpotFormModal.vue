<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center overflow-y-auto pt-20 pb-10 z-50">
    <div class="bg-white p-6 rounded-lg w-full max-w-2xl my-10 mx-4 shadow-xl relative">
      <!-- Close button in the top-right corner -->
      <button 
        @click="$emit('close')" 
        class="absolute -top-4 -right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-110 border border-gray-200 cursor-pointer"
      >
        <span class="text-gray-600 hover:text-red-600 transition-colors">&times;</span>
      </button>
      
      <h2 class="text-xl font-semibold mb-4">{{ spot ? 'Edit' : 'Add' }} Camping Spot</h2>
      <form @submit.prevent="handleSubmit" class="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium" :class="[validationErrors.title ? 'text-red-700' : 'text-gray-700']">
              Title *
              <span v-if="validationErrors.title" class="text-xs ml-1">({{ validationErrors.title }})</span>
            </label>
            <input 
              v-model="form.title" 
              type="text" 
              name="title"
              required
              :class="[
                'mt-1 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-offset-2 transition-all',
                validationErrors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
              ]"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Price per night (€) *</label>
            <input 
              v-model="form.price" 
              type="number" 
              name="price"
              required 
              min="0"
              step="0.01"
              class="mt-1 w-full px-3 py-2 border rounded-md"
            >
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Description *</label>
          <textarea 
            v-model="form.description" 
            name="description"
            rows="3" 
            required 
            class="mt-1 w-full px-3 py-2 border rounded-md"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Max Guests *</label>
          <input 
            v-model="form.max_guests" 
            name="max_guests"
            type="number" 
            required 
            min="1"
            class="mt-1 w-full px-3 py-2 border rounded-md"
          >
        </div>

        <!-- Amenities -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div v-for="amenity in availableAmenities" :key="amenity.amenity_id">
              <label class="inline-flex items-center">
                <input 
                  type="checkbox"
                  :value="amenity.amenity_id"
                  v-model="form.amenities"
                  class="rounded border-gray-300"
                >
                <span class="ml-2">{{ amenity.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Address Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Address Line 1 *</label>
            <input v-model="form.address_line1" name="address_line1" type="text" required class="mt-1 w-full px-3 py-2 border rounded-md" >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Address Line 2</label>
            <input v-model="form.address_line2" type="text" class="mt-1 w-full px-3 py-2 border rounded-md">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">City *</label>
            <input v-model="form.city" name="city" type="text" required class="mt-1 w-full px-3 py-2 border rounded-md">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Postal Code *</label>
            <input v-model="form.postal_code" name="postal_code" type="text" required class="mt-1 w-full px-3 py-2 border rounded-md">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Country *</label>
            <select 
              v-model="form.country" 
              name="country"
              required 
              class="mt-1 w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select a country</option>
              <option v-for="country in countries" 
                      :key="country.country_id" 
                      :value="country.country_id">
                {{ country.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Image Management -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Images</label>
          
          <!-- Existing Images -->
          <div v-if="spot" class="mb-4">
            <p class="text-sm mb-2">Existing Images:</p>
            <div class="flex flex-wrap gap-4 mb-4">
              <div v-for="(image, index) in spot.images" 
                   :key="image.image_id" 
                   class="relative">
                <img :src="image.image_url" 
                     class="h-24 w-24 object-cover rounded-lg" 
                     alt="Existing spot image">
                <button 
                  @click.prevent="removeExistingImage(image.image_id)" 
                  type="button"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 cursor-pointer hover:bg-red-600 transition-colors"
                >×</button>
              </div>
            </div>
          </div>

          <!-- New Images -->
          <div class="flex flex-wrap gap-4 mb-4">
            <div v-for="(image, index) in form.images" 
                 :key="index"
                 class="relative">
              <img :src="getImageUrl(image)"
                   class="h-24 w-24 object-cover rounded-lg"
                   alt="New spot image">
              <button 
                @click.prevent="removeImage(index)" 
                type="button"
                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 cursor-pointer hover:bg-red-600 transition-colors"
              >×</button>
            </div>
          </div>

          <!-- File Input -->
          <input 
            type="file" 
            @change="handleImageUpload" 
            accept="image/*" 
            multiple
            class="block w-full text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 file:cursor-pointer"
          >
        </div>

        <!-- Submit Buttons -->
        <div class="flex justify-end space-x-3 mt-6">
          <button 
            type="button" 
            @click="$emit('close')" 
            class="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 cursor-pointer transition-colors"
          >
            {{ spot ? 'Save Changes' : 'Add Spot' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from '@/axios'

const props = defineProps({
  spot: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'submit'])

const availableAmenities = ref([])
const countries = ref([])
const validationErrors = reactive({})

const form = reactive({
  title: '',
  description: '',
  price: '',
  max_guests: 1,
  address_line1: '',
  address_line2: '',
  city: '',
  postal_code: '',
  country: '',
  amenities: [],
  images: []
})

const getImageUrl = (image) => {
  if (!image) return '';
  if (image instanceof File) {
    return URL.createObjectURL(image);
  }
  if (typeof image === 'string') return image;
  return image.image_url;
}

const handleImageUpload = (event) => {
  const files = Array.from(event.target.files || []);
  if (files.length > 0) {
    form.images.push(...files);
  }
}

const removeImage = (index) => {
  if (index >= 0 && index < form.images.length) {
    const image = form.images[index];
    if (image instanceof File) {
      URL.revokeObjectURL(getImageUrl(image));
    }
    form.images.splice(index, 1);
  }
}

const removeExistingImage = async (imageId) => {
  if (!props.spot) return;
  
  if (confirm('Are you sure you want to delete this image?')) {
    try {
      await axios.delete(`/camping-spots/images/${imageId}`);
      props.spot.images = props.spot.images.filter(img => img.image_id !== imageId);
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('Failed to delete image');
    }
  }
}

const fetchAmenities = async () => {
  try {
    const { data } = await axios.get('/camping-spots/amenities')
    availableAmenities.value = data
  } catch (error) {
    console.error('Failed to fetch amenities:', error)
  }
}

const fetchCountries = async () => {
  try {
    const { data } = await axios.get('/camping-spots/countries')
    countries.value = data
  } catch (error) {
    console.error('Failed to fetch countries:', error)
  }
}

const handleSubmit = async () => {
  // Create FormData instance
  const formData = new FormData();
  
  const location = {
    address_line1: form.address_line1,
    address_line2: form.address_line2 || '',
    city: form.city,
    country_id: parseInt(form.country),
    postal_code: form.postal_code
  };

  if (props.spot?.location?.location_id) {
    location.location_id = props.spot.location.location_id;
  }

  const requestData = {
    title: form.title,
    description: form.description,
    price_per_night: Number(form.price),
    max_guests: Number(form.max_guests),
    location: location,
    amenities: form.amenities.map(id => parseInt(id))
  };

  if (props.spot) {
    requestData.existing_images = props.spot.images.map(img => img.image_id);
  }

  // Append form data
  Object.entries(requestData).forEach(([key, value]) => {
    formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
  });

  // Append new images
  form.images.forEach(image => {
    if (image instanceof File) {
      formData.append('images', image);
    }
  });

  emit('submit', formData);
}

// Initialize form if editing
onMounted(async () => {
  await Promise.all([fetchAmenities(), fetchCountries()]);
  
  if (props.spot) {
    Object.assign(form, {
      title: props.spot.title,
      description: props.spot.description,
      price: props.spot.price_per_night,
      max_guests: props.spot.max_guests,
      amenities: props.spot.camping_spot_amenities?.map(a => a.amenity_id) || [],
      address_line1: props.spot.location?.address_line1 || '',
      address_line2: props.spot.location?.address_line2 || '',
      city: props.spot.location?.city || '',
      postal_code: props.spot.location?.postal_code || '',
      country: props.spot.location?.country_id || ''
    })
  }
})
</script>

<style scoped>
/* Add styles to ensure modal is properly positioned */
.fixed {
  position: fixed;
}

.pt-20 {
  padding-top: 5rem; /* Ensure it's below the navbar */
}

.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.3) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.3);
  border-radius: 3px;
}

/* Animation for close button hover */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

button.absolute:hover {
  animation: pulse 1s infinite;
}
</style>
