<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useToast } from 'vue-toastification'

const router = useRouter()
const toast = useToast()

const newPassword = ref('')
const confirmPassword = ref('')
const processing = ref(false)
const error = ref(null)
const success = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// SVG icon components instead of imported ones
const eyeIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
</svg>`;

const eyeSlashIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
</svg>`;

async function handleResetPassword() {
  // Reset error state
  error.value = null
  
  // Validate passwords
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }
  
  if (newPassword.value.length < 8) {
    error.value = 'Password must be at least 8 characters'
    return
  }
  
  const hasLetter = /[a-zA-Z]/.test(newPassword.value)
  const hasNumber = /\d/.test(newPassword.value)
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword.value)
  
  if (!(hasLetter && (hasNumber || hasSpecial))) {
    error.value = 'Password must contain letters and at least one number or special character'
    return
  }
  
  processing.value = true
  
  try {
    // Update the password using the hash from the URL
    const { error: resetError } = await supabase.auth.updateUser({ 
      password: newPassword.value
    })
    
    if (resetError) throw resetError
    
    success.value = true
    toast.success('Password has been reset successfully!')
    
    // Redirect to login after a short delay
    setTimeout(() => {
      router.push('/auth')
    }, 3000)
  } catch (err) {
    console.error('Error resetting password:', err)
    error.value = err.message || 'Failed to reset password. Please try again.'
    toast.error(error.value)
  } finally {
    processing.value = false
  }
}

onMounted(async () => {
  // Check if the user is already logged in
  const { data } = await supabase.auth.getSession()
  
  // If no active session or no recovery token in URL, redirect to login
  if (!data.session) {
    // Get the hash from the URL
    const hash = window.location.hash
    
    // If there's no hash (which should contain the token), redirect to login
    if (!hash || !hash.includes('type=recovery')) {
      toast.error('Invalid or expired password reset link')
      router.push('/auth')
    }
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Enter a new password for your account
        </p>
      </div>
      
      <div v-if="success" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
        Password reset successful! You will be redirected to the login page.
      </div>
      
      <form v-if="!success" class="mt-8 space-y-6" @submit.prevent="handleResetPassword">
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {{ error }}
        </div>
        
        <div>
          <label for="new-password" class="block text-sm font-medium text-gray-700">New password</label>
          <div class="relative">
            <input 
              id="new-password" 
              v-model="newPassword" 
              :type="showNewPassword ? 'text' : 'password'"
              required 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 pr-10"
            />
            <button 
              type="button"
              @click="showNewPassword = !showNewPassword" 
              class="absolute inset-y-0 right-0 flex items-center pr-3 mt-1"
            >
              <span class="h-5 w-5 text-gray-400" v-html="showNewPassword ? eyeSlashIconSvg : eyeIconSvg"></span>
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Password must be at least 8 characters and include letters and at least one number or special character.
          </p>
        </div>
        
        <div>
          <label for="confirm-password" class="block text-sm font-medium text-gray-700">Confirm new password</label>
          <div class="relative">
            <input 
              id="confirm-password" 
              v-model="confirmPassword" 
              :type="showConfirmPassword ? 'text' : 'password'"
              required 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 pr-10"
            />
            <button 
              type="button"
              @click="showConfirmPassword = !showConfirmPassword" 
              class="absolute inset-y-0 right-0 flex items-center pr-3 mt-1"
            >
              <span class="h-5 w-5 text-gray-400" v-html="showConfirmPassword ? eyeSlashIconSvg : eyeIconSvg"></span>
            </button>
          </div>
        </div>
        
        <div>
          <button 
            type="submit" 
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            :disabled="processing"
          >
            {{ processing ? 'Updating password...' : 'Reset Password' }}
          </button>
        </div>
        
        <div class="text-center">
          <router-link to="/auth" class="font-medium text-red-600 hover:text-red-500">
            Back to login
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Password toggle animation */
button {
  transition: color 0.2s;
}

/* Form transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Improve form inputs on focus */
input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}
</style>
