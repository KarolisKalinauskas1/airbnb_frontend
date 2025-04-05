<template>
  <DashboardLayout>
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-semibold">My Camping Spots</h1>
      <button @click="showAddModal = true" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
        Add New Spot
      </button>
    </div>

    <!-- Performance Summary -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
        </div>
      </template>
    </div>

    <!-- Add/Edit Modal -->
    <!-- ...existing modal code... -->
  </DashboardLayout>
</template>

<script setup>
// ...existing script setup code...

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
