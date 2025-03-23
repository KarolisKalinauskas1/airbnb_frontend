

<template>
  <div class="main flex">
    <div class="filters w-1/4 p-4">
      <h2>Filters</h2>
      <div class="filter-item">
        <label for="price-range">Price Range</label>
        <input type="range" id="price-range" name="price-range" min="0" max="500">
      </div>
      <div class="filter-item">
        <label for="category">Category</label>
        <select id="category" name="category">
          <option value="tent">Tent</option>
          <option value="rv">RV</option>
          <option value="cabin">Cabin</option>
        </select>
      </div>
      <div class="filter-item">
        <label for="map">Map</label>
        <input type="checkbox" id="map" name="map">
      </div>
    </div>
    <div class="camping_spots w-3/4 p-4">
      <CamperGridComponent></CamperGridComponent>
    </div>
  </div>
</template>


<script setup>
  import CamperGridComponent from '@/components/CamperGridComponent.vue';


</script>