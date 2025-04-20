<template>
  <div>
    <slot v-if="!error"></slot>
    <div v-else class="error-container">
      <div class="error-content">
        <h2 class="error-title">{{ title }}</h2>
        <p class="error-message">{{ error.message || errorMessage }}</p>
        
        <div class="error-details" v-if="showDetails && error.stack">
          <p class="error-stack-title">Technical Details:</p>
          <pre class="error-stack">{{ error.stack }}</pre>
        </div>
        
        <div class="error-actions">
          <button @click="retry" class="retry-button">
            Try Again
          </button>
          <button @click="goHome" class="home-button">
            Go to Home
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  title: {
    type: String,
    default: 'Something went wrong'
  },
  errorMessage: {
    type: String,
    default: 'We encountered an error while trying to load this page.'
  },
  showDetails: {
    type: Boolean,
    default: false
  }
});

const router = useRouter();
const error = ref(null);

// Capture errors from child components
onErrorCaptured((err, instance, info) => {
  console.error('Component error captured:', err);
  console.info('Error occurred in component:', instance);
  console.info('Error info:', info);
  
  error.value = err;
  return false; // Prevent error from propagating further
});

// Reset error state and retry
const retry = () => {
  error.value = null;
};

// Navigate to home page
const goHome = () => {
  router.push('/');
};
</script>

<style scoped>
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 2rem;
}

.error-content {
  background-color: white;
  border-radius: 0.5rem;
  padding: 2rem;
  max-width: 600px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #e11d48;
}

.error-message {
  margin-bottom: 1.5rem;
  color: #4b5563;
}

.error-details {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.error-stack-title {
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #4b5563;
}

.error-stack {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  overflow-x: auto;
  color: #1f2937;
  max-height: 200px;
  overflow-y: auto;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.retry-button {
  background-color: #e11d48;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.retry-button:hover {
  background-color: #be123c;
}

.home-button {
  background-color: #e5e7eb;
  color: #4b5563;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.home-button:hover {
  background-color: #d1d5db;
}
</style>
