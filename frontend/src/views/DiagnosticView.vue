<template>
  <div class="container mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">System Diagnostics</h1>
    
    <div class="bg-white shadow-md rounded p-4 mb-4">
      <h2 class="text-lg font-semibold mb-2">API Connection</h2>
      <div v-if="apiStatus.loading">
        Checking API connection...
      </div>
      <div v-else>
        <div :class="apiStatus.connected ? 'text-green-600' : 'text-red-600'">
          API {{ apiStatus.connected ? 'is connected' : 'is not connected' }}
        </div>
        <div v-if="apiStatus.error" class="text-red-600 mt-2">
          Error: {{ apiStatus.error }}
        </div>
      </div>
      <button 
        @click="checkApiConnection" 
        class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
      >
        Test Connection
      </button>
    </div>
    
    <div class="bg-white shadow-md rounded p-4 mb-4">
      <h2 class="text-lg font-semibold mb-2">CORS Configuration</h2>
      <div v-if="corsStatus.loading">
        Testing CORS configuration...
      </div>
      <div v-else>
        <div :class="corsStatus.success ? 'text-green-600' : 'text-red-600'">
          CORS Test: {{ corsStatus.success ? 'Successful' : 'Failed' }}
        </div>
        <div v-if="corsStatus.message" class="mt-2">
          {{ corsStatus.message }}
        </div>
        <div v-if="corsStatus.data" class="mt-2 bg-gray-100 p-2 rounded">
          <pre>{{ JSON.stringify(corsStatus.data, null, 2) }}</pre>
        </div>
        <div v-if="corsStatus.diagnostics" class="mt-2 bg-gray-100 p-2 rounded">
          <h3 class="font-semibold">Diagnostics:</h3>
          <pre>{{ JSON.stringify(corsStatus.diagnostics, null, 2) }}</pre>
        </div>
      </div>
      <button 
        @click="testCors" 
        class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
      >
        Test CORS
      </button>
    </div>
    
    <div class="bg-white shadow-md rounded p-4">
      <h2 class="text-lg font-semibold mb-2">Authentication</h2>
      <div v-if="authStore.isLoggedIn">
        <div class="text-green-600">Logged in as {{ authStore.user?.email }}</div>
        <div v-if="authStore.fullUser" class="mt-2">
          User ID: {{ authStore.fullUser.user_id }}<br>
          Full name: {{ authStore.fullUser.full_name }}
        </div>
      </div>
      <div v-else class="text-red-600">
        Not logged in
      </div>
      <button 
        @click="checkAuth" 
        class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
      >
        Check Auth
      </button>
    </div>
    
    <button 
      @click="runAllTests" 
      class="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
    >
      Run All Tests
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import axios from '@/axios';
import { testCorsSetup } from '@/utils/corsTest';
import { getRequestStats, resetAllRequests } from '@/utils/requestTracker';
import ApiDiagnostics from '@/components/ApiDiagnostics.vue';

const authStore = useAuthStore();

const apiStatus = ref({
  loading: false,
  connected: false,
  error: null
});

const corsStatus = ref({
  loading: false,
  success: false,
  message: null,
  data: null,
  diagnostics: null
});

const requestStats = ref({
  pending: 0,
  details: []
});

const resetRequests = () => {
  try {
    const count = resetAllRequests();
    console.log(`Reset ${count} pending requests`);
    // Update UI if needed
  } catch (error) {
    console.error('Error resetting requests:', error);
  }
};

const updateRequestStats = () => {
  requestStats.value = getRequestStats();
};

async function checkApiConnection() {
  apiStatus.value.loading = true;
  apiStatus.value.error = null;
  
  try {
    const response = await axios.get('/', { timeout: 5000 });
    apiStatus.value.connected = true;
    console.log('API connection successful:', response.data);
  } catch (error) {
    apiStatus.value.connected = false;
    apiStatus.value.error = error.message;
    console.error('API connection error:', error);
  } finally {
    apiStatus.value.loading = false;
  }
}

async function testCors() {
  corsStatus.value.loading = true;
  corsStatus.value = {
    ...corsStatus.value,
    loading: true,
    success: false,
    message: null,
    data: null,
    diagnostics: null
  };
  
  try {
    const result = await testCorsSetup();
    corsStatus.value = {
      ...corsStatus.value,
      ...result,
      loading: false
    };
  } catch (error) {
    corsStatus.value = {
      loading: false,
      success: false,
      message: `Error running CORS test: ${error.message}`,
      diagnostics: { error: error.toString() }
    };
  }
}

async function checkAuth() {
  await authStore.fetchFullUserInfo(true);
}

async function runAllTests() {
  await Promise.all([
    checkApiConnection(),
    testCors(),
    checkAuth()
  ]);
}

onMounted(() => {
  checkApiConnection();
});
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">System Diagnostics</h1>
    
    <div class="mb-8">
      <ApiDiagnostics />
    </div>
    
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-2">Test Form Field Limits</h2>
      <p class="text-sm text-gray-600 mb-4">
        Use this form to test field length constraints for database columns.
      </p>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Database Table
          </label>
          <select 
            v-model="selectedTable" 
            class="w-full p-2 border border-gray-300 rounded"
          >
            <option value="camping_spot">camping_spot</option>
            <option value="location">location</option>
          </select>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Field Name
          </label>
          <select 
            v-model="selectedField" 
            class="w-full p-2 border border-gray-300 rounded"
          >
            <option v-for="field in availableFields" :key="field" :value="field">
              {{ field }}
            </option>
          </select>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Test Value
          </label>
          <textarea 
            v-model="testValue" 
            class="w-full p-2 border border-gray-300 rounded"
            rows="5"
          ></textarea>
          <div class="mt-1 text-sm">
            Characters: {{ testValue.length }}
          </div>
        </div>
        
        <div class="flex items-center justify-between">
          <button 
            @click="generateTestData" 
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Generate Test Data
          </button>
          
          <button 
            @click="testFieldLimit" 
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Testing...' : 'Test Field Limit' }}
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="result" class="mt-6">
      <h3 class="text-lg font-semibold mb-2">Test Result</h3>
      <div 
        class="p-4 rounded-lg"
        :class="{
          'bg-green-100 border border-green-200': result.success,
          'bg-red-100 border border-red-200': !result.success
        }"
      >
        <div class="font-medium" :class="{'text-green-700': result.success, 'text-red-700': !result.success}">
          {{ result.success ? 'Success!' : 'Error!' }}
        </div>
        <div class="mt-2 text-sm whitespace-pre-wrap">{{ result.message }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from '@/axios';

const selectedTable = ref('camping_spot');
const selectedField = ref('');
const testValue = ref('');
const isLoading = ref(false);
const result = ref(null);

const tableFields = {
  camping_spot: ['title', 'description', 'price_per_night', 'max_guests'],
  location: ['address_line1', 'address_line2', 'city', 'postal_code', 'longtitute', 'latitute']
};

const availableFields = computed(() => {
  return tableFields[selectedTable.value] || [];
});

// Auto-select the first field when table changes
const handleTableChange = () => {
  if (availableFields.value.length > 0) {
    selectedField.value = availableFields.value[0];
  }
};

// Watch for table changes
watch(selectedTable, handleTableChange);

// Generate a string of specified length for testing
const generateTestData = () => {
  const length = prompt('Enter desired character length:', '1000');
  if (length && !isNaN(length)) {
    // Generate repeated text to reach the desired length
    const baseText = "This is a test string for database field validation. ";
    testValue.value = baseText.repeat(Math.ceil(parseInt(length) / baseText.length)).substring(0, parseInt(length));
  }
};

const testFieldLimit = async () => {
  if (!selectedTable.value || !selectedField.value || !testValue.value) {
    result.value = {
      success: false,
      message: "Please select table, field and enter a test value."
    };
    return;
  }
  
  isLoading.value = true;
  result.value = null;
  
  try {
    // Create a test object with the selected field
    const testData = {
      [selectedField.value]: testValue.value
    };
    
    // For demonstration, use a POST request to a diagnostic endpoint
    // You'll need to implement this endpoint in your backend
    const response = await axios.post('/diagnostics/field-test', {
      table: selectedTable.value,
      data: testData
    });
    
    result.value = {
      success: true,
      message: `Test passed! The field "${selectedField.value}" can accept ${testValue.value.length} characters.\n\nResponse: ${JSON.stringify(response.data, null, 2)}`
    };
  } catch (error) {
    result.value = {
      success: false,
      message: `Test failed with error: ${error.message}\n\nDetails: ${JSON.stringify(error.response?.data || {}, null, 2)}`
    };
  } finally {
    isLoading.value = false;
  }
};

// Initialize the first field
onMounted(() => {
  handleTableChange();
});
</script>
