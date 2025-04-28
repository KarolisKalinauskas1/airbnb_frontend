<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { isBackendAvailable } from '@/utils/connectionHelper';

const router = useRouter();
const checkingConnection = ref(false);
const checkInterval = ref(null);

// Try to reconnect to the server
const checkConnection = async () => {
  if (checkingConnection.value) return;
  
  checkingConnection.value = true;
  const available = await isBackendAvailable();
  checkingConnection.value = false;
  
  if (available) {
    // Backend is back online, redirect to home
    router.push('/');
  }
};

// Set up the reconnection interval
onMounted(() => {
  checkInterval.value = setInterval(checkConnection, 5000);
});

onUnmounted(() => {
  if (checkInterval.value) {
    clearInterval(checkInterval.value);
  }
});
</script>

<template>
  <div class="offline-container">
    <div class="offline-content">
      <h1>Unable to Connect to Server</h1>
      <div class="offline-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
          <path d="M10.706 3.294A12.545 12.545 0 0 0 8 3C5.259 3 2.723 3.882.663 5.379a.485.485 0 0 0-.048.736.518.518 0 0 0 .668.05A11.448 11.448 0 0 1 8 4c.63 0 1.249.05 1.852.148l.854-.854zM8 6c-1.905 0-3.68.56-5.166 1.526a.48.48 0 0 0-.063.745.525.525 0 0 0 .652.065 8.448 8.448 0 0 1 3.51-1.27L8 6zm2.596 1.404.785-.785c.63.24 1.227.545 1.785.907a.482.482 0 0 1 .063.745.525.525 0 0 1-.652.065 8.462 8.462 0 0 0-1.98-.932zM8 10l.933-.933a6.455 6.455 0 0 1 2.013.637c.285.145.326.524.1.75l-.015.015a.532.532 0 0 1-.611.09A5.478 5.478 0 0 0 8 10zm4.905-4.905.747-.747c.59.3 1.153.645 1.685 1.03a.485.485 0 0 1 .047.737.518.518 0 0 1-.668.05 11.493 11.493 0 0 0-1.811-1.07zM9.02 11.78c.238.14.236.464.04.66l-.707.706a.5.5 0 0 1-.707 0l-.707-.707c-.195-.195-.197-.518.04-.66A1.99 1.99 0 0 1 8 11.5c.374 0 .723.102 1.021.28zm4.355-9.905a.53.53 0 0 1 .75.75l-10.75 10.75a.53.53 0 0 1-.75-.75l10.75-10.75z"/>
        </svg>
      </div>
      <p>
        We're having trouble connecting to the server. Please check your internet connection 
        and ensure the server is running.
      </p>
      <div class="reconnect-status">
        <div v-if="checkingConnection" class="loading-spinner"></div>
        <span v-if="checkingConnection">Checking connection...</span>
        <span v-else>Waiting to reconnect...</span>
      </div>
      <div class="btn-container">
        <button class="btn-retry" @click="checkConnection" :disabled="checkingConnection">
          Retry Connection
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.offline-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 20px;
}

.offline-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 40px;
  text-align: center;
  max-width: 500px;
  width: 100%;
}

h1 {
  color: #dc2626;
  font-size: 1.8rem;
  margin-bottom: 20px;
}

.offline-icon {
  color: #dc2626;
  margin: 20px 0;
}

p {
  color: #4b5563;
  margin-bottom: 30px;
  line-height: 1.6;
}

.reconnect-status {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: #6b7280;
  font-size: 0.9rem;
  gap: 8px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spinner 1s ease-in-out infinite;
}

@keyframes spinner {
  to { transform: rotate(360deg); }
}

.btn-container {
  margin-top: 20px;
}

.btn-retry {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-retry:hover {
  background-color: #2563eb;
}

.btn-retry:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}
</style>
