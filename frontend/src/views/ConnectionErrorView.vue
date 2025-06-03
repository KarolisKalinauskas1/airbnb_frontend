<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md">
      <div class="text-center">
        <h2 class="text-3xl font-extrabold text-gray-900">
          Connection Error
        </h2>
        <div class="mt-4">
          <div class="rounded-md bg-red-50 p-4 mb-6">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  {{ errorTitle }}
                </h3>
                <div class="mt-2 text-sm text-red-700">
                  <p>{{ errorMessage }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Troubleshooting Steps -->
      <div class="mt-6">
        <h3 class="text-lg font-medium text-gray-900">Try these steps:</h3>
        <ul class="mt-2 list-disc list-inside text-sm text-gray-600 space-y-2">
          <li v-for="(step, index) in troubleshootingSteps" :key="index">
            {{ step }}
          </li>
        </ul>
      </div>
      
      <!-- Diagnostic Information -->
      <div class="mt-8 pt-6 border-t border-gray-200">
        <h3 class="text-sm font-medium text-gray-900">Diagnostic Information:</h3>
        <div class="mt-2 text-xs text-gray-500 space-y-2">
          <div class="flex justify-between">
            <span>Browser Online:</span>
            <span :class="diagnosticResults.browserOnline ? 'text-green-600' : 'text-red-600'">
              {{ diagnosticResults.browserOnline ? '✓ Yes' : '✗ No' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span>Internet Connectivity:</span>
            <span :class="diagnosticResults.googleReachable ? 'text-green-600' : 'text-red-600'">
              {{ diagnosticResults.googleReachable ? '✓ Available' : '✗ Not Available' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span>Auth Service:</span>
            <span :class="diagnosticResults.supabaseReachable ? 'text-green-600' : 'text-red-600'">
              {{ diagnosticResults.supabaseReachable ? '✓ Reachable' : '✗ Not Reachable' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span>Application Server:</span>
            <span :class="diagnosticResults.backendReachable ? 'text-green-600' : 'text-red-600'">
              {{ diagnosticResults.backendReachable ? '✓ Reachable' : '✗ Not Reachable' }}
            </span>
          </div>
          <div v-if="errorType" class="flex justify-between">
            <span>Error Type:</span>
            <span class="font-mono">{{ errorType }}</span>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="mt-8 flex flex-col space-y-3">
        <button
          @click="runDiagnostic"
          class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          :disabled="isRunningDiagnostic"
        >
          {{ isRunningDiagnostic ? 'Running Diagnostic...' : 'Run Connection Diagnostic' }}
        </button>
        <button
          @click="retryLogin"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          :disabled="isRunningDiagnostic"
        >
          Try Again
        </button>
        <button
          @click="goHome"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          :disabled="isRunningDiagnostic"
        >
          Go to Home Page
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { diagnoseNetworkIssues, getNetworkErrorMessage } from '@/utils/networkDiagnostic'

const router = useRouter()
const route = useRoute()

// State
const errorType = ref(route.query.errorType || 'CONNECTION_ERROR')
const isRunningDiagnostic = ref(false)
const diagnosticResults = ref({
  browserOnline: navigator.onLine,
  googleReachable: false,
  supabaseReachable: false,
  backendReachable: false,
  recommendedAction: null
})

// Computed properties for dynamic content
const errorTitle = computed(() => {
  switch(errorType.value) {
    case 'DNS_ERROR':
      return 'Authentication Service Unreachable'
    case 'NETWORK_ERROR':
      return 'Network Connection Error'
    case 'TIMEOUT_ERROR':
      return 'Connection Timeout'
    case 'FETCH_ERROR':
      return 'Failed to Connect to Authentication Service'
    default:
      return 'Connection Error'
  }
})

const errorMessage = computed(() => {
  switch(errorType.value) {
    case 'DNS_ERROR':
      return "Your browser couldn't resolve the domain name of our authentication service. This is typically caused by DNS configuration issues or network restrictions."
    case 'NETWORK_ERROR':
      return "Unable to connect to our authentication service due to network issues."
    case 'TIMEOUT_ERROR':
      return "Connection to our authentication service timed out. This could be due to slow internet or service issues."
    case 'FETCH_ERROR':
      return "Failed to connect to authentication service. This may be due to network connectivity issues."
    default:
      return "Unable to connect to our authentication service. This might be due to network issues or service unavailability."
  }
})

const troubleshootingSteps = computed(() => {
  const steps = [
    "Check that your device is connected to the internet",
    "Try refreshing the page"
  ]
  
  if (errorType.value === 'DNS_ERROR') {
    steps.push("Try using a different DNS server (e.g., Google's 8.8.8.8 or Cloudflare's 1.1.1.1)")
    steps.push("Check if your network blocks access to external services")
    steps.push("If using a VPN, try disabling it temporarily")
  } else if (errorType.value === 'NETWORK_ERROR' || errorType.value === 'TIMEOUT_ERROR') {
    steps.push("Check if your firewall is blocking connections")
    steps.push("Try using a different network connection (e.g., switch from WiFi to mobile data)")
  }
  
  steps.push("If the problem persists, please contact support")
  
  return steps
})

// Methods
const runDiagnostic = async () => {
  isRunningDiagnostic.value = true
  try {
    diagnosticResults.value = await diagnoseNetworkIssues()
    
    // Update error type based on diagnostic results
    if (!diagnosticResults.value.browserOnline) {
      errorType.value = 'OFFLINE'
    } else if (diagnosticResults.value.error === 'DNS_RESOLUTION_FAILED') {
      errorType.value = 'DNS_ERROR'
    } else if (!diagnosticResults.value.googleReachable) {
      errorType.value = 'NETWORK_ERROR'
    }
  } catch (error) {
    console.error('Error running diagnostic:', error)
  } finally {
    isRunningDiagnostic.value = false
  }
}

const retryLogin = () => {
  router.push('/auth')
}

const goHome = () => {
  router.push('/')
}

// Run diagnostic on mount
onMounted(async () => {
  await runDiagnostic()
})
</script>
