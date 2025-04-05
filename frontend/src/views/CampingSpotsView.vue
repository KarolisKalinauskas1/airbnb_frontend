<template>
  <DashboardLayout>
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-semibold">My Camping Spots</h1>
      <button @click="showAddModal = true" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 cursor-pointer transition-colors">
        Add New Spot
      </button>
    </div>

    <!-- Spots List -->
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
                  @click="deleteSpot(spot.id)" 
                  class="text-red-600 hover:text-red-800 cursor-pointer px-2 py-1 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>

            <!-- Amenities Tags -->
            <div class="flex flex-wrap gap-1 mt-2">
              <span 
                v-for="amenity in spot.amenities" 
                :key="amenity"
                class="px-2 py-0.5 bg-gray-100 text-black text-xs rounded-full"
              >
                {{ amenity }}
              </span>
            </div>

            <p class="text-sm text-black line-clamp-2 mt-2">{{ spot.description }}</p>
            
            <div class="text-xs text-black mt-2">
              Added: {{ new Date(spot.created_at).toLocaleDateString() }}
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
      <div class="bg-white p-6 rounded-lg w-full max-w-2xl my-8 mx-4">
        <h2 class="text-xl font-semibold mb-4">{{ editingSpot ? 'Edit' : 'Add' }} Camping Spot</h2>
        <form @submit.prevent="handleSubmit" class="space-y-4 max-h-[80vh] overflow-y-auto pr-4">
          <!-- Basic Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium" :class="[validationErrors.title ? 'text-red-700' : 'text-black-700']">
                Title *
                <span v-if="validationErrors.title" class="text-xs ml-1">({{ validationErrors.title }})</span>
              </label>
              <input 
                v-model="form.title" 
                type="text" 
                name="title"
                required
                :class="[
                  'mt-1 w-full px-3 py-2 border rounded-md text-black-900 bg-white focus:ring-2 focus:ring-offset-2 transition-all',
                  validationErrors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                ]"
                placeholder="Enter spot title"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-black
              -700">Price per night (€) *</label>
              <input 
                v-model="form.price" 
                type="number" 
                name="price"
                required 
                min="0"
                step="0.01"
                class="mt-1 w-full px-3 py-2 border rounded-md text-black-900 bg-white"
                placeholder="Enter price per night"
              >
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-black-700">Description *</label>
            <textarea 
              v-model="form.description" 
              name="description"
              rows="3" 
              required 
              class="mt-1 w-full px-3 py-2 border rounded-md text-black-900 bg-white"
              placeholder="Describe your camping spot"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-black-700">Max Guests *</label>
            <input 
              v-model="form.max_guests" 
              name="max_guests"
              type="number" 
              required 
              min="1"
              class="mt-1 w-full px-3 py-2 border rounded-md text-black-900 bg-white"
            >
          </div>

          <!-- Amenities -->
          <div>
            <label class="block text-sm font-medium text-black-700 mb-2">Amenities</label>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div v-for="amenity in availableAmenities" :key="amenity.amenity_id">
                <label class="inline-flex items-center">
                  <input 
                    type="checkbox"
                    :value="amenity.amenity_id"
                    v-model="form.amenities"
                    class="rounded border-gray-300"
                  >
                  <span class="ml-2 text-black-900">{{ amenity.name }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Address Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-black-700">Address Line 1 *</label>
              <input v-model="form.address_line1" name="address_line1" type="text" required class="mt-1 w-full px-3 py-2 border rounded-md text-black-900 bg-white" placeholder="Enter street address">
            </div>
            <div>
              <label class="block text-sm font-medium text-black-700">Address Line 2</label>
              <input v-model="form.address_line2" type="text" class="mt-1 w-full px-3 py-2 border rounded-md text-black-900 bg-white" placeholder="Apartment, suite, unit, etc. (optional)">
            </div>
            <div>
              <label class="block text-sm font-medium text-black-700">City *</label>
              <input v-model="form.city" name="city" type="text" required class="mt-1 w-full px-3 py-2 border rounded-md text-black-900 bg-white" placeholder="Enter city">
            </div>
            <div>
              <label class="block text-sm font-medium text-black-700">Postal Code *</label>
              <input v-model="form.postal_code" name="postal_code" type="text" required class="mt-1 w-full px-3 py-2 border rounded-md text-black-900 bg-white" placeholder="Enter postal code">
            </div>
            <div>
              <label class="block text-sm font-medium text-black-700">Country *</label>
              <select 
                v-model="form.country" 
                name="country"
                required 
                class="mt-1 w-full px-3 py-2 border rounded-md text-black-900 bg-white"
                :class="{'border-red-500': validationErrors.country}"
              >
                <option value="">Select a country</option>
                <option v-for="country in countries" 
                        :key="country.country_id" 
                        :value="country.country_id">
                  {{ country.name }}
                </option>
              </select>
              <span v-if="validationErrors.country" class="text-red-500 text-sm">
                {{ validationErrors.country }}
              </span>
            </div>
          </div>

          <!-- Image Upload -->
          <div>
            <label class="block text-sm font-medium text-black-700 mb-2">Images</label>
            <!-- Existing Images (when editing) -->
            <div v-if="editingSpot" class="mb-4">
              <p class="text-sm mb-2">Existing Images:</p>
              <div class="flex flex-wrap gap-4">
                <div v-for="(image, index) in editingSpot.images" 
                     :key="image.image_id" 
                     class="relative">
                  <img :src="image.image_url" 
                       class="h-24 w-24 object-cover rounded-lg" 
                       alt="Existing spot image">
                  <button 
                    @click.prevent="removeExistingImage(image.image_id)" 
                    type="button"
                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6"
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
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6"
                >×</button>
              </div>
            </div>

            <!-- File Input -->
            <input 
              type="file" 
              @change="handleImageUpload" 
              accept="image/*" 
              multiple
              class="block w-full text-sm text-black-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
            >
          </div>

          <!-- Submit Buttons -->
          <div class="flex justify-end space-x-3">
            <button 
              type="button" 
              @click="closeModal" 
              class="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 cursor-pointer transition-colors"
            >
              {{ editingSpot ? 'Save Changes' : 'Add Spot' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import axios from '@/axios'
import { useDashboardStore } from '@/stores/dashboard'
import { useAuthStore } from '@/stores/auth'

const availableAmenities = ref([])
const countries = ref([])
const spots = ref([])
const showAddModal = ref(false)
const editingSpot = ref(null)

const form = reactive({
  title: '',
  description: '',
  price: '',
  city: '',
  postal_code: '',
  country: '',
  address_line1: '',
  address_line2: '',
  max_guests: 1,
  amenities: [], // This will now store amenity IDs instead of names
  images: []
})

const validationErrors = reactive({
  title: '',
  description: '',
  price: '',
  max_guests: '',
  address_line1: '',
  city: '',
  postal_code: '',
  country: ''
})

const closeModal = () => {
  showAddModal.value = false
  editingSpot.value = null
  resetForm()
}

const resetForm = () => {
  Object.assign(form, {
    title: '',
    description: '',
    price: '',
    city: '',
    postal_code: '',
    country: '',
    address_line1: '',
    address_line2: '',
    max_guests: 1,
    amenities: [],
    images: []
  })
}

const getImageUrl = (image) => {
  if (!image) return '';
  if (image instanceof File) {
    return URL.createObjectURL(image);
  }
  if (typeof image === 'string') return image;
  return image.image_url; // Handle Cloudinary URLs
}

const handleImageUpload = (event) => {
  const files = Array.from(event.target.files || []);
  if (files.length > 0) {
    form.images.push(...files);
  }
}

const removeImage = (index) => {
  if (index >= 0 && index < form.images.length) {
    // If it's a blob URL, revoke it to free memory
    const image = form.images[index];
    if (image instanceof File) {
      URL.revokeObjectURL(getImageUrl(image));
    }
    form.images.splice(index, 1);
  }
}

const removeExistingImage = async (imageId) => {
  if (!editingSpot.value) return;
  
  if (confirm('Are you sure you want to delete this image?')) {
    try {
      await axios.delete(`/camping-spots/images/${imageId}`);
      editingSpot.value.images = editingSpot.value.images.filter(img => img.image_id !== imageId);
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('Failed to delete image');
    }
  }
};

const editSpot = (spot) => {
  console.log('Editing spot:', spot);
  editingSpot.value = spot;
  form.title = spot.title;
  form.description = spot.description;
  form.price = spot.price_per_night;
  form.max_guests = spot.max_guests;
  form.amenities = spot.camping_spot_amenities?.map(a => a.amenity_id) || [];
  
  // Correctly populate location fields
  if (spot.location) {
    form.address_line1 = spot.location.address_line1;
    form.address_line2 = spot.location.address_line2 || '';
    form.city = spot.location.city;
    form.postal_code = spot.location.postal_code;
    form.country = spot.location.country_id;
  }
  
  // Clear form images but keep reference to existing ones
  form.images = [];
  showAddModal.value = true;
};

const deleteSpot = async (id) => {
  if (!confirm('Are you sure you want to delete this spot?')) return
  
  try {
    await axios.delete(`/camping-spots/${id}`)
    spots.value = spots.value.filter(spot => spot.id !== id)
    
    // Refresh dashboard data after deletion
    const dashboardStore = useDashboardStore()
    await dashboardStore.fetchDashboardData()
  } catch (error) {
    console.error('Failed to delete spot:', error)
    alert('Failed to delete spot')
  }
}

const validateForm = () => {
  console.log('Validating form with data:', form);
  let isValid = true;
  
  // Reset errors
  Object.keys(validationErrors).forEach(key => validationErrors[key] = '');

  // Validate each field
  if (!form.title?.trim()) {
    validationErrors.title = 'Title is required';
    isValid = false;
  }

  if (!form.description?.trim()) {
    validationErrors.description = 'Description is required';
    isValid = false;
  }

  if (!form.price || Number(form.price) <= 0) {
    validationErrors.price = 'Price must be greater than 0';
    isValid = false;
  }

  if (!form.max_guests || Number(form.max_guests) <= 0) {
    validationErrors.max_guests = 'Must be greater than 0';
    isValid = false;
  }

  if (!form.address_line1?.trim()) {
    validationErrors.address_line1 = 'Address is required';
    isValid = false;
  }

  if (!form.city?.trim()) {
    validationErrors.city = 'City is required';
    isValid = false;
  }

  if (!form.postal_code?.trim()) {
    validationErrors.postal_code = 'Postal code is required';
    isValid = false;
  }

  if (!form.country) {
    validationErrors.country = 'Country is required';
    console.log('Country validation failed:', form.country);
    isValid = false;
  }

  console.log('Validation errors:', validationErrors);
  console.log('Form is valid:', isValid);

  // If not valid, scroll to first error
  if (!isValid) {
    const firstError = Object.keys(validationErrors).find(key => validationErrors[key]);
    if (firstError) {
      const element = document.querySelector(`[name="${firstError}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
    }
  }

  return isValid;
}

const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

const handleSubmit = async () => {
  console.log('Form submission started');
  try {
    if (!validateForm()) {
      return;
    }

    const formData = new FormData();
    
    const location = {
      address_line1: form.address_line1,
      address_line2: form.address_line2 || '',
      city: form.city,
      country_id: parseInt(form.country),
      postal_code: form.postal_code
    };

    if (editingSpot.value?.location?.location_id) {
      location.location_id = editingSpot.value.location.location_id;
    }

    // Prepare basic data
    const requestData = {
      title: form.title,
      description: form.description,
      price_per_night: Number(form.price),
      max_guests: Number(form.max_guests),
      owner_id: authStore.fullUser?.user_id,
      location: location,
      amenities: form.amenities.map(id => parseInt(id))
    };

    // Include existing images if editing
    if (editingSpot.value) {
      requestData.existing_images = editingSpot.value.images.map(img => img.image_id);
    }

    // Append form data
    Object.entries(requestData).forEach(([key, value]) => {
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
    });

    // Append new images
    if (form.images.length > 0) {
      form.images.forEach(image => {
        if (image instanceof File) {
          formData.append('images', image);
        }
      });
    }

    const response = editingSpot.value
      ? await axios.put(`/camping-spots/${editingSpot.value.camping_spot_id}`, formData)
      : await axios.post('/camping-spots', formData);

    if (response.data) {
      await loadSpots(); // Refresh the spots list
      await dashboardStore.fetchDashboardData();
      closeModal();
      alert(editingSpot.value ? 'Spot updated successfully!' : 'New spot added successfully!');
    }
  } catch (error) {
    console.error('Failed to save spot:', error);
    console.error('Error details:', error.response?.data);
    alert(error.response?.data?.error || 'Failed to save spot');
  }
}

// Clean up blob URLs when component is unmounted
onUnmounted(() => {
  form.images.forEach(image => {
    if (image instanceof File) {
      URL.revokeObjectURL(getImageUrl(image));
    }
  });
});

const fetchAmenities = async () => {
  try {
    const { data } = await axios.get('/camping-spots/amenities')
    console.log('Loaded amenities:', data)
    availableAmenities.value = data
  } catch (error) {
    console.error('Failed to fetch amenities:', error)
  }
}

const fetchCountries = async () => {
  try {
    const { data } = await axios.get('/camping-spots/countries')
    console.log('Loaded countries:', data)
    countries.value = data
  } catch (error) {
    console.error('Failed to fetch countries:', error)
  }
}

// Load spots on mount
onMounted(async () => {
  try {
    await Promise.all([
      fetchAmenities(),
      fetchCountries(),
      loadSpots()
    ])
  } catch (error) {
    console.error('Error during initialization:', error)
  }
})

const loadSpots = async () => {
  try {
    const { data } = await axios.get('/camping-spots/my-spots');
    spots.value = data.map(spot => ({
      ...spot,
      camping_spot_id: spot.camping_spot_id,
      id: spot.camping_spot_id,
      price: spot.price_per_night,
      location: `${spot.location?.city}, ${spot.location?.country?.name}`
    }));
  } catch (error) {
    console.error('Failed to load spots:', error);
  }
}
</script>

<style scoped>
/* Remove double scrollbar */
.overflow-y-auto {
  scrollbar-width: thin;  /* For Firefox */
  scrollbar-color: rgba(0,0,0,0.3) transparent;  /* For Firefox */
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

/* Add validation animations */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.border-red-500 {
  animation: shake 0.4s ease-in-out;
}
</style>