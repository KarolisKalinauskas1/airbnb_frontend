<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Date Selection Header -->
    <div class="bg-white border-b">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <DateRangeSelector
          v-model:startDate="dates.startDate"
          v-model:endDate="dates.endDate"
          @dateChange="fetchSpots"
        />
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex gap-8">
        <!-- Filters Sidebar -->
        <div class="w-80 flex-shrink-0">
          <FiltersPanel @filter="handleFilters" />
        </div>

        <!-- Spots Grid -->
        <div class="flex-1 space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CampingSpotCard
              v-for="spot in spots"
              :key="spot.camping_spot_id"
              :spot="spot"
              :startDate="dates.startDate"
              :endDate="dates.endDate"
              mode="customer"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import DateRangeSelector from '@/components/DateRangeSelector.vue';
import FiltersPanel from '@/components/FiltersPanel.vue';
import CampingSpotCard from '@/components/CampingSpotCard.vue';
import axios from '@/axios';
import { processApiResponseData } from '@/utils/dataValidation';

const spots = ref([]);
const loading = ref(false);
const dates = reactive({
  startDate: '',
  endDate: ''
});
const currentFilters = ref({});

onMounted(() => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  dates.startDate = today.toISOString().split('T')[0];
  dates.endDate = tomorrow.toISOString().split('T')[0];
  
  fetchSpots();
});

const fetchSpots = async () => {
  if (!dates.startDate || !dates.endDate) return;
  
  loading.value = true;
  
  try {
    const params = {
      startDate: dates.startDate,
      endDate: dates.endDate
    };
    
    if (currentFilters.value.minPrice) params.minPrice = currentFilters.value.minPrice;
    if (currentFilters.value.maxPrice) params.maxPrice = currentFilters.value.maxPrice;
    if (currentFilters.value.guests) params.guests = currentFilters.value.guests;
    if (currentFilters.value.amenities?.length) params.amenities = currentFilters.value.amenities.join(',');
    
    // Add radius if present
    if (currentFilters.value.radius) {
      params.radius = parseInt(currentFilters.value.radius);
    }
    
    const { data } = await axios.get('/camping-spots', { params });
    
    // Process the response data safely
    spots.value = processApiResponseData(data);
    console.log(`Processed API response: ${spots.value.length} valid spots`);
  } catch (error) {
    console.error('Failed to fetch spots:', error);
  } finally {
    loading.value = false;
  }
};

const handleFilters = (filters) => {
  // Ensure radius is a number
  if (filters.radius) {
    filters.radius = parseInt(filters.radius);
  }
  
  currentFilters.value = filters;
  fetchSpots();
};
</script>
