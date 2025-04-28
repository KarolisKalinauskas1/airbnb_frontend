<template>
  <div v-if="!isOnline" class="network-status">
    <div class="network-status-content">
      <i class="fas fa-wifi-slash"></i>
      <span>You are offline. Some features may not be available.</span>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';

export default {
  name: 'SimpleNetworkStatus',
  setup() {
    const isOnline = ref(navigator.onLine);
    
    const updateOnlineStatus = () => {
      isOnline.value = navigator.onLine;
    };
    
    onMounted(() => {
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
    });
    
    onUnmounted(() => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    });
    
    return { isOnline };
  }
};
</script>

<style scoped>
.network-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #f44336;
  color: white;
  text-align: center;
  padding: 8px;
  z-index: 9999;
}

.network-status-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.network-status-content i {
  margin-right: 8px;
}
</style>
