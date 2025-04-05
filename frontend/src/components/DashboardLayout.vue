<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <div class="w-64 bg-white shadow-md">
      <div class="p-4 border-b">
        <h2 class="text-xl font-semibold text-gray-800">Dashboard</h2>
      </div>
      <nav class="p-4">
        <RouterLink 
          v-for="item in menuItems" 
          :key="item.path"
          :to="item.path"
          class="block px-4 py-2 mb-2 rounded-lg transition-colors cursor-pointer"
          :class="[
            $route.path === item.path 
              ? 'bg-red-100 text-red-600' 
              : 'text-gray-600 hover:bg-gray-100'
          ]"
        >
          {{ item.name }}
        </RouterLink>
      </nav>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-auto">
      <div class="p-8">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
const menuItems = [
  { name: 'Overview', path: '/dashboard' },
  { name: 'Camping Spots', path: '/dashboard/spots' },
  { name: 'Analytics', path: '/dashboard/analytics' }
]
</script>