<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md">
      <!-- Supabase Connection Error -->
      <div v-if="!supabaseConnected" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm">Cannot connect to authentication service. Please check your internet connection.</p>
            <p class="mt-2">
              <button 
                @click="checkSupabaseConnection" 
                class="text-sm font-medium text-red-700 hover:text-red-500 focus:outline-none"
                :disabled="connectionChecking"
              >
                {{ connectionChecking ? 'Checking...' : 'Try again' }}
              </button>
            </p>
          </div>
        </div>
      </div>
      
      <!-- Login Form -->
      <div v-if="!showRegister && !showResetPassword">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Or 
          <button @click="toggleLoginForm('register')" class="text-red-600 hover:text-red-500 font-medium">
            create a new account
          </button>
        </p>
        
        <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
          <div v-if="loginError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {{ loginError }}
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
            <input 
              id="email" 
              v-model="email" 
              type="email" 
              autocomplete="email"
              required 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            />
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
            <div class="relative">
              <input 
                id="password" 
                v-model="password" 
                :type="showLoginPassword ? 'text' : 'password'"
                autocomplete="current-password" 
                required 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 pr-10"
              />
              <button 
                type="button"
                @click="showLoginPassword = !showLoginPassword" 
                class="absolute inset-y-0 right-0 flex items-center pr-3 mt-1"
              >
                <span class="h-5 w-5 text-gray-400" v-html="passwordToggleIcon"></span>
              </button>
            </div>
          </div>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input 
                id="remember-me" 
                type="checkbox" 
                class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div class="text-sm">
              <button 
                type="button"
                @click="toggleLoginForm('reset')" 
                class="font-medium text-red-600 hover:text-red-500"
              >
                Forgot your password?
              </button>
            </div>
          </div>
          
          <div>
            <button 
              type="submit" 
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              :disabled="loginProcessing"
            >
              {{ loginProcessing ? 'Signing in...' : 'Sign in' }}
            </button>
          </div>
        </form>
      </div>
      
      <!-- Register Form -->
      <div v-else-if="showRegister">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create a new account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Or 
          <button @click="toggleLoginForm('login')" class="text-red-600 hover:text-red-500 font-medium">
            sign in to your account
          </button>
        </p>
        
        <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
          <div v-if="registerError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {{ registerError }}
          </div>
          
          <div>
            <label for="register-email" class="block text-sm font-medium text-gray-700">Email address</label>
            <input 
              id="register-email" 
              v-model="registerData.email" 
              type="email"
              autocomplete="email"
              required 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            />
          </div>
          
          <div>
            <label for="register-name" class="block text-sm font-medium text-gray-700">Full name</label>
            <input 
              id="register-name" 
              v-model="registerData.fullName" 
              type="text"
              autocomplete="name"
              required 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            />
          </div>
          
          <div>
            <label for="register-password" class="block text-sm font-medium text-gray-700">Password</label>
            <div class="relative">
              <input 
                id="register-password" 
                v-model="registerData.password" 
                :type="showRegisterPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 pr-10"
              />
              <button 
                type="button"
                @click="showRegisterPassword = !showRegisterPassword" 
                class="absolute inset-y-0 right-0 flex items-center pr-3 mt-1"
              >
                <span class="h-5 w-5 text-gray-400" v-html="registerPasswordToggleIcon"></span>
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters and include letters and at least one number or special character.
            </p>
          </div>
          
          <div>
            <label for="register-confirm-password" class="block text-sm font-medium text-gray-700">Confirm Password</label>
            <div class="relative">
              <input 
                id="register-confirm-password" 
                v-model="registerData.confirmPassword" 
                :type="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 pr-10"
              />
              <button 
                type="button"
                @click="showConfirmPassword = !showConfirmPassword" 
                class="absolute inset-y-0 right-0 flex items-center pr-3 mt-1"
              >
                <span class="h-5 w-5 text-gray-400" v-html="confirmPasswordToggleIcon"></span>
              </button>
            </div>
          </div>
          
          <div class="flex items-center">
            <input 
              id="register-is-owner" 
              type="checkbox" 
              v-model="registerData.isOwner"
              class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label for="register-is-owner" class="ml-2 block text-sm text-gray-900">
              Register as a camping spot owner
            </label>
          </div>
          
          <!-- License field only shown when registering as an owner -->
          <div v-if="registerData.isOwner">
            <label for="register-license" class="block text-sm font-medium text-gray-700">Business License Number</label>
            <input 
              id="register-license" 
              v-model="registerData.license" 
              type="text"
              placeholder="Enter your business license number"
              required 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            />
            <p class="text-xs text-gray-500 mt-1">
              Required for all camping spot owners to verify your business status.
            </p>
          </div>
          
          <div>
            <button 
              type="submit" 
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              :disabled="registerProcessing"
            >
              {{ registerProcessing ? 'Creating account...' : 'Create account' }}
            </button>
          </div>
        </form>
      </div>
      
      <!-- Reset Password Form -->
      <div v-else-if="showResetPassword">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Enter your email and we'll send you instructions to reset your password
        </p>
        
        <form class="mt-8 space-y-6" @submit.prevent="handleResetPassword">
          <div v-if="resetPasswordError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {{ resetPasswordError }}
          </div>
          
          <div v-if="resetPasswordSuccess" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            Password reset instructions sent to your email. Please check your inbox.
          </div>
          
          <div>
            <label for="reset-email" class="block text-sm font-medium text-gray-700">Email address</label>
            <input 
              id="reset-email" 
              v-model="resetEmail" 
              type="email" 
              required 
              autocomplete="email"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            />
          </div>
          
          <div>
            <button 
              type="submit" 
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              :disabled="resetPasswordProcessing"
            >
              {{ resetPasswordProcessing ? 'Sending...' : 'Send reset instructions' }}
            </button>
          </div>
          
          <div class="text-center">
            <button 
              type="button"
              @click="toggleLoginForm('login')" 
              class="font-medium text-red-600 hover:text-red-500"
            >
              Back to login
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useToast } from 'vue-toastification'
import axios from '@/axios' // Add this import
import { testSupabaseConnection } from '@/utils/supabaseUtils'
import { useAuthStore } from '@/stores/auth'
import { syncSessionWithBackend } from '@/utils/sessionHelper'
import { attemptSessionRecovery, clearAuthData } from '@/utils/sessionRecovery'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

// Form data
const email = ref('')
const password = ref('')
const loginProcessing = ref(false)
const loginError = ref('')
const showRegister = ref(false)
const showResetPassword = ref(false)
const registerError = ref('')
const registerProcessing = ref(false)
const resetPasswordProcessing = ref(false)
const resetPasswordError = ref('')
const resetPasswordSuccess = ref(false)
const resetEmail = ref('')
const supabaseConnected = ref(true)
const connectionChecking = ref(false)

// Password visibility toggles
const showLoginPassword = ref(false)
const showRegisterPassword = ref(false)
const showConfirmPassword = ref(false)

const registerData = ref({
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  isOwner: false,
  license: '' // Added license field for owners
})

// Watch for owner status changes to validate license when needed
watch(() => registerData.value.isOwner, (newVal) => {
  if (!newVal) {
    // Clear license when not an owner
    registerData.value.license = ''
  }
})

// Form validation
const validateLoginForm = () => {
  loginError.value = ''
  
  if (!email.value || !email.value.trim()) {
    loginError.value = 'Email is required'
    return false
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    loginError.value = 'Please enter a valid email address'
    return false
  }
  
  if (!password.value) {
    loginError.value = 'Password is required'
    return false
  }
  
  return true
}

const validateRegisterForm = () => {
  registerError.value = ''
  
  if (!registerData.value.email || !registerData.value.email.trim()) {
    registerError.value = 'Email is required'
    return false
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(registerData.value.email)) {
    registerError.value = 'Please enter a valid email address'
    return false
  }
  
  if (!registerData.value.password) {
    registerError.value = 'Password is required'
    return false
  }
  
  // Password strength validation
  if (registerData.value.password.length < 8) {
    registerError.value = 'Password must be at least 8 characters'
    return false
  }
  
  // Check for complexity requirements
  const hasLetter = /[a-zA-Z]/.test(registerData.value.password)
  const hasNumber = /\d/.test(registerData.value.password)
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(registerData.value.password)
  
  if (!(hasLetter && (hasNumber || hasSpecial))) {
    registerError.value = 'Password must contain letters and at least one number or special character'
    return false
  }
  
  if (registerData.value.password !== registerData.value.confirmPassword) {
    registerError.value = 'Passwords do not match'
    return false
  }
  
  if (!registerData.value.fullName || !registerData.value.fullName.trim()) {
    registerError.value = 'Full name is required'
    return false
  }
  
  // Validate license for owners
  if (registerData.value.isOwner && (!registerData.value.license || !registerData.value.license.trim())) {
    registerError.value = 'License number is required for owners'
    return false
  }
  
  return true
}

const validateResetPasswordForm = () => {
  resetPasswordError.value = ''
  
  if (!resetEmail.value || !resetEmail.value.trim()) {
    resetPasswordError.value = 'Email is required'
    return false
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(resetEmail.value)) {
    resetPasswordError.value = 'Please enter a valid email address'
    return false
  }
  
  return true
}

// Test connection to Supabase
const checkSupabaseConnection = async () => {
  connectionChecking.value = true
  try {
    console.log("Checking Supabase connection with URL:", import.meta.env.VITE_SUPABASE_URL)
    const { connected, message } = await testSupabaseConnection()
    
    if (connected) {
      supabaseConnected.value = true
      console.log('Supabase connection successful')
    } else {
      console.error('Supabase connection issue:', message)
      // Don't show error to user for certain errors that might be false negatives
      if (message.includes('relation') || message.includes('does not exist')) {
        // This is likely just a missing table, but connection works
        supabaseConnected.value = true
      } else {
        supabaseConnected.value = false
        toast.error('Unable to connect to authentication service. Please check your internet connection.')
      }
    }
  } catch (err) {
    console.error('Connection test error:', err)
    supabaseConnected.value = false
    toast.error('Cannot connect to authentication service')
  } finally {
    connectionChecking.value = false
  }
}

// Try to recover session if login fails due to session issues
const trySessionRecovery = async () => {
  console.log('Attempting to recover from session issues...')
  
  // First clear any possibly corrupted auth data
  clearAuthData()
  
  // Check if recovery is possible
  const recovered = await attemptSessionRecovery()
  
  if (recovered) {
    // If recovered, refresh the auth store state
    await authStore.initAuth({ forceRefresh: true })
    
    if (authStore.isLoggedIn) {
      // Successfully recovered
      toast.success('Session restored successfully')
      
      // Navigate to redirect or home
      const redirectPath = route.query.redirect || '/'
      router.push(redirectPath)
      return true
    }
  }
  
  // Recovery failed
  toast.error('Could not restore session. Please login again.')
  return false
}

// Login handler with improved error handling
const handleLogin = async () => {
  try {
    loginError.value = null
    loginProcessing.value = true

    // Attempt login with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (error) {
      throw error
    }

    if (!data?.session) {
      console.error('No session received after login')
      throw new Error('No session received after login')
    }

    console.log('Session received, setting up auth...')
    // Set up the session in the auth store
    await authStore.setSession(data.session)
    
    // Verify we're actually logged in
    if (!authStore.isAuthenticated) {
      console.error('Auth store not properly initialized')
      throw new Error('Failed to establish session')
    }

    // Verify the session is properly stored
    const storedSession = localStorage.getItem('supabase.auth.token')
    const storedUser = localStorage.getItem('supabase.auth.user')
    
    if (!storedSession || !storedUser) {
      console.error('Session not properly stored in localStorage')
      throw new Error('Failed to store session')
    }

    console.log('Login successful, redirecting...')
    // Redirect to home page
    const redirectPath = route.query.redirect || '/'
    router.push(redirectPath)
  } catch (error) {
    console.error('Login error:', error)
    loginError.value = error.message || 'Failed to sign in'
    
    // Try session recovery if it's an auth error
    if (error.message?.includes('auth') || error.message?.includes('session')) {
      console.log('Attempting session recovery...')
      const recovered = await trySessionRecovery()
      if (recovered) return
    }
  } finally {
    loginProcessing.value = false
  }
}

// Add a timeout to prevent infinite waiting
const loginTimeout = ref(null)

// Watch for login processing state
watch(loginProcessing, (newValue) => {
  if (newValue) {
    // Set a timeout to prevent infinite waiting
    loginTimeout.value = setTimeout(() => {
      if (loginProcessing.value) {
        console.error('Login process timed out')
        loginProcessing.value = false
        loginError.value = 'Login process timed out. Please try again.'
      }
    }, 30000) // 30 second timeout
  } else {
    // Clear timeout if processing stops
    if (loginTimeout.value) {
      clearTimeout(loginTimeout.value)
      loginTimeout.value = null
    }
  }
})

// Clean up timeout on component unmount
onUnmounted(() => {
  if (loginTimeout.value) {
    clearTimeout(loginTimeout.value)
  }
})

// Register handler
const handleRegister = async () => {
  if (!validateRegisterForm()) return
  
  // Check connection before attempting registration
  if (!supabaseConnected.value) {
    await checkSupabaseConnection()
    if (!supabaseConnected.value) {
      toast.error('Cannot connect to authentication service. Please check your internet connection.')
      return
    }
  }
  
  registerProcessing.value = true
  registerError.value = ''
  
  try {
    console.log('Starting registration process...')
    
    // Use direct fetch instead of axios to rule out any axios interceptor issues
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    console.log('Using API URL:', apiUrl)
    
    // Try direct registration with backend first using fetch
    console.log('Step 1: Using direct backend registration with fetch')
    
    const registerPayload = {
      email: registerData.value.email,
      password: registerData.value.password,
      full_name: registerData.value.fullName,
      is_seller: registerData.value.isOwner,
      license: registerData.value.isOwner ? registerData.value.license : undefined
    }
    
    console.log('Registration payload:', { ...registerPayload, password: '[REDACTED]' })
    
    try {
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerPayload),
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Backend registration failed:', response.status, errorText)
        throw new Error(`Registration failed: ${response.status} ${errorText}`)
      }
      
      const responseData = await response.json()
      console.log('Direct backend registration successful:', responseData)
      
      // Auto-login after registration
      console.log('Step 2: Auto-logging in after registration')
      const { data, error } = await supabase.auth.signInWithPassword({
        email: registerData.value.email,
        password: registerData.value.password
      })
      
      if (error) {
        console.error('Auto-login failed:', error)
        throw new Error('Registration successful but auto-login failed. Please log in manually.')
      }
      
      console.log('Auto-login successful')
      
      // Set up the session in the auth store
      await authStore.setSession(data.session)
      
      toast.success('Registration successful! You are now logged in.')
      showRegister.value = false
      
      // Redirect to intended destination or dashboard
      const redirectPath = route.query.redirect || (registerData.value.isOwner ? '/dashboard' : '/')
      console.log('Redirecting to:', redirectPath)
      router.push(redirectPath)
      
      // Clear sensitive data
      registerData.value = {
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        isOwner: false,
        license: ''
      }
      
      return // Exit early if direct registration works
    } catch (directRegError) {
      console.error('Direct fetch registration failed:', directRegError)
      console.log('Falling back to Supabase + manual DB sync flow...')
      
      // Fall back to the original axios method if fetch fails
      try {
        console.log('Trying axios registration as fallback')
        const response = await axios.post('/api/auth/register', {
          email: registerData.value.email,
          password: registerData.value.password,
          full_name: registerData.value.fullName,
          is_seller: registerData.value.isOwner,
          license: registerData.value.isOwner ? registerData.value.license : undefined
        })
        
        console.log('Axios registration successful:', response.data)
        
        // Auto-login after registration
        console.log('Step 2: Auto-logging in after registration')
        const { data, error } = await supabase.auth.signInWithPassword({
          email: registerData.value.email,
          password: registerData.value.password
        })
        
        if (error) {
          console.error('Auto-login failed:', error)
          throw new Error('Registration successful but auto-login failed. Please log in manually.')
        }
        
        console.log('Auto-login successful')
        
        // Set up the session in the auth store
        await authStore.setSession(data.session)
        
        toast.success('Registration successful! You are now logged in.')
        showRegister.value = false
        
        // Redirect to intended destination or dashboard
        const redirectPath = route.query.redirect || (registerData.value.isOwner ? '/dashboard' : '/')
        console.log('Redirecting to:', redirectPath)
        router.push(redirectPath)
        
        // Clear sensitive data
        registerData.value = {
          email: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          isOwner: false,
          license: ''
        }
        
        return // Exit early if axios registration works
      } catch (axiosRegError) {
        console.error('Axios registration also failed:', axiosRegError)
        // Continue to Supabase-only registration as last resort
      }
    }
    
    // If both direct registration attempts fail, use the two-step process
    console.log('Step 1 (fallback): Registering with Supabase auth only')
    const { data, error } = await supabase.auth.signUp({
      email: registerData.value.email,
      password: registerData.value.password,
      options: {
        data: {
          full_name: registerData.value.fullName,
          isowner: registerData.value.isOwner ? 1 : 0,
          license: registerData.value.isOwner ? registerData.value.license : null
        }
      }
    })
    
    if (error) throw error
    
    if (!data || !data.user || !data.user.id) {
      console.error('No user data returned from Supabase signup')
      throw new Error('Failed to create account. No user data returned from authentication service.')
    }
    
    console.log('Supabase auth registration successful, user ID:', data.user.id)
    
    toast.warning('Account created in auth system, but database sync failed. Some features may be limited.')
    
    // Redirect to login page
    showRegister.value = false
    
    // Clear sensitive data
    registerData.value = {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      isOwner: false,
      license: ''
    }
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      registerError.value = 'Network error. Please check your internet connection and try again.'
      supabaseConnected.value = false
    } else {
      // Safely sanitize error message
      let errorMessage = 'Failed to register. Please try again.'
      
      if (error.message) {
        // Only show specific error messages that don't reveal sensitive info
        if (error.message.includes('email') || 
            error.message.includes('password') ||
            error.message.includes('wait')) {
          errorMessage = error.message
        }
      }
      
      registerError.value = errorMessage
    }
    
    toast.error(registerError.value)
  } finally {
    registerProcessing.value = false
  }
}

// Reset password handler
const handleResetPassword = async () => {
  if (!validateResetPasswordForm()) return
  
  resetPasswordProcessing.value = true
  resetPasswordError.value = ''
  resetPasswordSuccess.value = false
  
  try {
    // Request password reset
    const { error } = await supabase.auth.resetPasswordForEmail(
      resetEmail.value,
      {
        redirectTo: `${window.location.origin}/reset-password` // You'll need to create this view
      }
    )
    
    if (error) throw error
    
    resetPasswordSuccess.value = true
    toast.success('Password reset instructions sent to your email')
  } catch (error) {
    console.error('Reset password error:', error)
    
    let errorMessage = 'Failed to send reset instructions. Please try again.'
    
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      errorMessage = 'Network error. Please check your internet connection and try again.'
      supabaseConnected.value = false
    }
    
    resetPasswordError.value = errorMessage
    toast.error(resetPasswordError.value)
  } finally {
    resetPasswordProcessing.value = false
  }
}

// Toggle between login and register or reset password forms
const toggleLoginForm = (form) => {
  if (form === 'register') {
    showRegister.value = true
    showResetPassword.value = false
  } else if (form === 'reset') {
    showRegister.value = false
    showResetPassword.value = true
  } else {
    showRegister.value = false
    showResetPassword.value = false
  }
  
  loginError.value = ''
  registerError.value = ''
  resetPasswordError.value = ''
  resetPasswordSuccess.value = false
}

// Check if user is already logged in
onMounted(async () => {
  try {
    // Test Supabase connection
    await checkSupabaseConnection()

    // Only redirect if there's a valid session AND the user isn't trying to log out
    const session = await authStore.getSupabaseSession()
    const isLoggingOut = route.query.logout === 'true'
    
    if (session && !isLoggingOut) {
      const redirectPath = route.query.redirect || '/'
      router.push(redirectPath)
    } else if (isLoggingOut) {
      // If logging out, ensure we clear any remaining session
      await authStore.clearSession()
    }
  } catch (error) {
    console.error('Error in LoginView mounted hook:', error)
    // Don't throw the error, just log it
  }
})

// SVG icon components instead of imported ones
const eyeIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
</svg>`;

const eyeSlashIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
</svg>`;

// Computed properties for UI elements
const passwordToggleIcon = computed(() => showLoginPassword.value ? eyeSlashIconSvg : eyeIconSvg)
const registerPasswordToggleIcon = computed(() => showRegisterPassword.value ? eyeSlashIconSvg : eyeIconSvg)
const confirmPasswordToggleIcon = computed(() => showConfirmPassword.value ? eyeSlashIconSvg : eyeIconSvg)
</script>

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

/* Style form error animations */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.bg-red-50 {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}
</style>

