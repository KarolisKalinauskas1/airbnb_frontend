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

// ...existing script setup code...
