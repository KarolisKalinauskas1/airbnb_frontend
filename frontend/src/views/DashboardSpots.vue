<template>
  <DashboardLayout>
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-semibold">My Camping Spots</h1>
      <button @click="handleAddNewClick" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 cursor-pointer transition-colors">
        Add New Spot
      </button>
    </div>

    <!-- Spots Management Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <template v-for="spot in spots" :key="spot.camping_spot_id">
        <div class="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
          <!-- Spot Card Content -->
          <div class="relative mb-3">
            <div class="w-full h-48">
              <img 
                v-if="spot.images?.length > 0"
                :src="spot.images[0].image_url"
                class="w-full h-full object-cover rounded-lg"
                alt="Spot image"
              />
              <div v-else class="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <span class="text-gray-400">No image available</span>
              </div>
            </div>
          </div>

          <!-- Spot Details -->
          <div class="space-y-4">
            <div class="flex justify-between">
              <div>
                <h3 class="text-lg font-semibold">{{ spot.title }}</h3>
                <p class="text-sm text-gray-600">{{ formatLocation(spot) }}</p>
                <p class="mt-1 font-bold">€{{ spot.price_per_night }} / night</p>
              </div>
              <div class="flex gap-2">
                <button 
                  @click="editSpot(spot)"
                  class="text-blue-600 hover:text-blue-800 cursor-pointer px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                  Edit
                </button>
                <button 
                  @click="confirmDelete(spot)"
                  class="text-red-600 hover:text-red-800 cursor-pointer px-3 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            <!-- Performance Stats -->
            <div class="grid grid-cols-3 gap-4 text-sm">
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
        </div>
      </template>
    </div>

    <!-- Form Modal -->
    <SpotFormModal
      v-if="showModal"
      :spot="editingSpot"
      @close="closeModal"
      @submit="handleSubmit"
    />

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4">Confirm Deletion</h3>
        <p class="mb-6">Are you sure you want to delete "{{ spotToDelete?.title }}"? This action cannot be undone.</p>
        <div class="flex justify-end gap-4">
          <button 
            @click="showDeleteModal = false" 
            class="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            @click="deleteSpot(spotToDelete?.camping_spot_id)" 
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import SpotFormModal from '@/components/SpotFormModal.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import axios from '@/axios'

const spots = ref([])
const showModal = ref(false)
const editingSpot = ref(null)
const showDeleteModal = ref(false)
const spotToDelete = ref(null)
const dashboardStore = useDashboardStore()
const toast = useToast()

// Methods
const loadSpots = async () => {
  try {
    const { data } = await axios.get('/camping-spots/my-spots')
    spots.value = data
  } catch (error) {
    console.error('Failed to load spots:', error)
    toast.error('Failed to load your camping spots')
  }
}

// Add new method to handle Add New button click
const handleAddNewClick = () => {
  editingSpot.value = null // Ensure we're not in edit mode
  showModal.value = true
}

const editSpot = (spot) => {
  editingSpot.value = spot
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingSpot.value = null
}

const handleSubmit = async (formData) => {
  try {
    if (editingSpot.value) {
      await axios.put(`/camping-spots/${editingSpot.value.camping_spot_id}`, formData)
      toast.success('Spot updated successfully')
    } else {
      await axios.post('/camping-spots', formData)
      toast.success('New spot added successfully')
    }
    await loadSpots()
    await dashboardStore.fetchDashboardData()
    closeModal()
  } catch (error) {
    console.error('Failed to save spot:', error)
    toast.error(error.response?.data?.error || 'Failed to save spot')
  }
}

const confirmDelete = (spot) => {
  spotToDelete.value = spot
  showDeleteModal.value = true
}

const deleteSpot = async (id) => {
  if (!id) return
  
  try {
    await axios.delete(`/camping-spots/${id}`)
    spots.value = spots.value.filter(spot => spot.camping_spot_id !== id)
    await dashboardStore.fetchDashboardData()
    showDeleteModal.value = false
    toast.success('Spot deleted successfully')
  } catch (error) {
    console.error('Failed to delete spot:', error)
    toast.error('Failed to delete spot')
  }
}

const formatLocation = (spot) => {
  return `${spot.location?.city}, ${spot.location?.country?.name}`
}

onMounted(() => {
  loadSpots()
})
</script>

<style scoped>
/* Ensure proper modal positioning */
:deep(.fixed) {
  position: fixed;
}

:deep(.py-10) {
  padding-top: 2.5rem;
  padding-bottom: 2.5rem;
}

:deep(.my-16) {
  margin-top: 4rem;
  margin-bottom: 4rem;
}

:deep(.z-50) {
  z-index: 50;
}
</style>
