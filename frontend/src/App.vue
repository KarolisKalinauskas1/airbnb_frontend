<script setup>
import { RouterLink, RouterView } from 'vue-router'
import NavComponent from './components/NavComponent.vue'
</script>

<template>
  <div>
    <div class="navigation">
      <NavComponent/>

    </div>
  </div>

    
      
 

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}


</style>
