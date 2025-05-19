<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center overflow-y-auto pt-20 pb-10 z-50" @click.self="handleClose">
    <div class="bg-white p-6 rounded-lg w-full max-w-2xl my-10 mx-4 shadow-xl relative">
      <!-- Close button in the top-right corner -->
      <button 
        @click.stop="handleClose" 
        type="button"
        class="absolute -top-4 -right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-110 border border-gray-200 cursor-pointer"
      >
        <span class="text-gray-600 hover:text-red-600 transition-colors">&times;</span>
      </button>
      
      <h2 class="text-xl font-semibold mb-4">{{ spot ? 'Edit' : 'Add' }} Camping Spot</h2>
      <form ref="formRef" @submit.prevent="handleSubmit" class="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="mb-4">
            <label class="block text-sm font-medium text-black-700 mb-2">Title</label>
            <input
              v-model="form.title"
              type="text"
              class="w-full p-2 border border-gray-300 rounded"
              :class="{'border-red-500': errors.title}"
              maxlength="100"
            >
            <div v-if="errors.title" class="text-red-500 text-sm mt-1">{{ errors.title }}</div>
            <div class="text-xs text-gray-500 mt-1">
              {{ form.title.length }}/100 characters
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Price per night (€) *</label>
            <input 
              v-model="form.price_per_night" 
              type="number" 
              name="price_per_night"
              required 
              min="0"
              step="0.01"
              class="mt-1 w-full px-3 py-2 border rounded-md"
            >
          </div>
        </div>

        <!-- Description -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-black-700 mb-2">Description</label>
          <textarea
            v-model="form.description"
            class="w-full p-2 border border-gray-300 rounded h-32"
            :class="{'border-red-500': errors.description}"
            maxlength="2000"
          ></textarea>
          <div v-if="errors.description" class="text-red-500 text-sm mt-1">{{ errors.description }}</div>
          <div class="text-xs text-gray-500 mt-1">
            {{ form.description.length }}/2000 characters
          </div>
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
                  v-model="selectedAmenities"
                  class="rounded border-gray-300"
                >
                <span class="ml-2">{{ amenity.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Address Information -->
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Address Line 1 *</label>
              <input v-model="form.address_line1" name="address_line1" type="text" required class="mt-1 w-full px-3 py-2 border rounded-md">
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
                v-model="form.country_id" 
                name="country_id"
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
            <div v-for="(image, index) in newImages" 
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
            @click="handleClose" 
            :disabled="isSubmitting"
            class="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 cursor-pointer transition-colors disabled:opacity-50 flex items-center"
          >
            <span v-if="isSubmitting" class="mr-2">
              <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </span>
            {{ isSubmitting ? 'Creating...' : (spot ? 'Save Changes' : 'Add Spot') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import axios from '@/axios'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  spot: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'spot-created', 'spot-updated'])
const toast = useToast()
const authStore = useAuthStore()
const isSubmitting = ref(false)
const newImages = ref([])
const selectedAmenities = ref([])

const availableAmenities = ref([])
const countries = ref([])
const validationErrors = reactive({})

const form = reactive({
  title: '',
  description: '',
  price_per_night: '',
  max_guests: '',
  address_line1: '',
  address_line2: '',
  city: '',
  country_id: '',
  postal_code: ''
})

const errors = reactive({
  title: '',
  description: ''
})

const submissionLock = ref(false);

const getImageUrl = (image) => {
  console.log('Getting URL for image:', image);
  if (!image) {
    console.log('No image provided');
    return '';
  }
  if (image instanceof File) {
    const url = URL.createObjectURL(image);
    console.log('Created object URL for File:', url);
    return url;
  }
  if (typeof image === 'string') {
    console.log('Returning string URL:', image);
    return image;
  }
  console.log('Returning image_url from object:', image.image_url);
  return image.image_url;
}

const handleImageUpload = (event) => {
  const files = Array.from(event.target.files || []);
  console.log('Files selected:', files);
  if (files.length > 0) {
    newImages.value.push(...files);
    console.log('New images array after upload:', newImages.value);
  }
}

const removeImage = (index) => {
  if (index >= 0 && index < newImages.value.length) {
    const image = newImages.value[index];
    if (image instanceof File) {
      URL.revokeObjectURL(getImageUrl(image));
    }
    newImages.value.splice(index, 1);
  }
}

const removeExistingImage = async (imageId) => {
  if (!props.spot) return;
  
  if (confirm('Are you sure you want to delete this image?')) {
    try {
      await axios.delete(`/api/camping-spots/images/${imageId}`);
      props.spot.images = props.spot.images.filter(img => img.image_id !== imageId);
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('Failed to delete image');
    }
  }
}

const fetchAmenities = async () => {
  try {
    const response = await axios.get('/api/camping-spots/amenities');
    availableAmenities.value = response.data;
  } catch (error) {
    console.error('Error fetching amenities:', error);
    toast.error('Failed to load amenities');
  }
};

const fetchCountries = async () => {
  try {
    const response = await axios.get('/api/camping-spots/countries');
    countries.value = response.data;
  } catch (error) {
    console.error('Error fetching countries:', error);
    toast.error('Failed to load countries');
  }
};

const handleClose = () => {
  if (isSubmitting.value) return
  emit('close')
}

const handleSubmit = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;

  try {
    const formErrors = validateForm();
    if (formErrors.length > 0) {
      toast.error(formErrors.join(', '));
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('price_per_night', form.price_per_night);
    formData.append('max_guests', form.max_guests);

    const location = {
      address_line1: form.address_line1,
      address_line2: form.address_line2,
      city: form.city,
      postal_code: form.postal_code,
      country_id: form.country_id
    }
    
    formData.append('location', JSON.stringify(location))
    formData.append('amenities', JSON.stringify(selectedAmenities.value))

    // Append new images
    newImages.value.forEach((image) => {
      formData.append('images', image)
    })

    let response;
    if (props.spot) {
      // Update existing spot
      try {
        // Ensure we have a fresh token before making the PUT request
        await authStore.getAuthToken(true); // Force refresh token
        
        response = await axios.put(`/api/camping-spots/${props.spot.camping_spot_id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // Make sure we have the complete updated data to emit
        if (response.data && response.data.camping_spot_id) {
          emit('spot-updated', response.data);
          toast.success('Spot updated successfully');
        } else {
          // If the response data is incomplete, fetch the full spot data
          const fullSpotResponse = await axios.get(`/api/camping-spots/${props.spot.camping_spot_id}`);
          emit('spot-updated', fullSpotResponse.data);
          toast.success('Spot updated successfully');
        }
      } catch (error) {
        console.error('Error updating camping spot:', error);
        if (error.response?.status === 401) {
          // If we get a 401, try to refresh the token and retry once
          try {
            await authStore.refreshToken();
            response = await axios.put(`/api/camping-spots/${props.spot.camping_spot_id}`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
            emit('spot-updated', response.data);
          } catch (retryError) {
            throw retryError;
          }
        } else {
          throw error;
        }
      }    } else {
      // Create new spot
      const token = await authStore.getAuthToken();
      response = await axios.post('/api/camping-spots', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      emit('spot-created', response.data);
    }

    emit('close');
  } catch (error) {
    console.error('Error saving camping spot:', error);
    toast.error(error.response?.data?.message || 'Error saving camping spot');
  } finally {
    isSubmitting.value = false;
  }
}

const validateForm = () => {
  const errors = [];
  
  if (!form.title?.trim()) errors.push('Title is required');
  if (!form.description?.trim()) errors.push('Description is required');
  if (!form.price_per_night || form.price_per_night <= 0) errors.push('Valid price is required');
  if (!form.max_guests || form.max_guests <= 0) errors.push('Valid number of guests is required');
  if (!form.address_line1?.trim()) errors.push('Address is required');
  if (!form.city?.trim()) errors.push('City is required');
  if (!form.country_id) errors.push('Country is required');
  if (!form.postal_code?.trim()) errors.push('Postal code is required');
  
  return errors;
};

// Initialize form if editing
onMounted(async () => {
  await Promise.all([fetchAmenities(), fetchCountries()]);
  
  if (props.spot) {
    Object.assign(form, {
      title: props.spot.title,
      description: props.spot.description,
      price_per_night: props.spot.price_per_night,
      max_guests: props.spot.max_guests,
      address_line1: props.spot.location?.address_line1 || '',
      address_line2: props.spot.location?.address_line2 || '',
      city: props.spot.location?.city || '',
      postal_code: props.spot.location?.postal_code || '',
      country_id: props.spot.location?.country_id || '',
    });
    
    // Initialize selected amenities
    selectedAmenities.value = props.spot.camping_spot_amenities?.map(a => a.amenity_id) || [];
  }

  console.log('SpotFormModal mounted');
});

onUnmounted(() => {
  console.log('SpotFormModal unmounted');
  isSubmitting.value = false;
  submissionLock.value = false;
  
  // Clean up object URLs
  newImages.value.forEach(image => {
    if (image instanceof File) {
      URL.revokeObjectURL(getImageUrl(image));
    }
  });
});
</script>

<style scoped>
/* Add styles to ensure modal is properly positioned */
.fixed {
  position: fixed;
  z-index: 9999; /* Higher than sidebar */
}

.pt-20 {
  padding-top: 5rem; /* Ensure it's below the navbar */
}

/* Make sure the overlay covers everything */
.bg-black.bg-opacity-50 {
  z-index: 9998; /* Just below modal content */
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
