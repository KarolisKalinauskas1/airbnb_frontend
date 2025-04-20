<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <Transition name="fade" mode="out-in">
      <div key="auth-form" class="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl backdrop-blur-sm border border-gray-100">
        <!-- Logo/Brand -->
        <div class="mb-8">
          <div class="text-center flex flex-col items-center space-y-6">
            <img src="@/assets/logo_for_airbnb.webp" class="h-12 mb-6" alt="Logo" />
            <h2 class="text-3xl font-bold text-gray-900 mb-2">
              {{ currentForm === 'login' ? 'Welcome back' : currentForm === 'registerSeller' ? 'Become a host' : currentForm === 'register' ? 'Create an account' : 'Reset Password' }}
            </h2>
            <p class="text-gray-500">{{ currentForm === 'login' ? 'Sign in to your account' : currentForm === 'forgot' ? 'Enter your email to reset password' : 'Start your journey with us' }}</p>
          </div>
        </div>

        <!-- Google Button (Login only) -->
        <div v-if="currentForm === 'login'" class="mb-8">
          <div class="space-y-8">
            <button @click="loginWithGoogle" 
                    class="w-full py-3 px-4 border border-gray-300 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors duration-200 group cursor-pointer">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="h-5 w-5" />
              <span class="text-gray-700 group-hover:text-gray-900">Continue with Google</span>
            </button>
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-200"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Login Form -->
        <div v-if="currentForm === 'login'" class="flex flex-col gap-6">
          <div class="space-y-10">
            <form @submit.prevent="handleLogin" class="space-y-4">
              <div>
                <label for="email" class="block text-gray-700 mb-1">Email Address</label>
                <input 
                  id="email" 
                  type="email" 
                  v-model="loginForm.email"
                  class="w-full p-2 border rounded-md" 
                  autocomplete="email"
                  required
                >
                <div v-if="loginErrors.email" class="text-red-600 text-sm mt-1">{{ loginErrors.email }}</div>
              </div>
              
              <div>
                <label for="password" class="block text-gray-700 mb-1">Password</label>
                <div class="relative">
                  <input 
                    id="password" 
                    :type="showPassword ? 'text' : 'password'" 
                    v-model="loginForm.password"
                    class="w-full p-2 border rounded-md" 
                    autocomplete="current-password"
                    required
                  >
                  <button 
                    type="button" 
                    @click="showPassword = !showPassword" 
                    class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {{ showPassword ? 'Hide' : 'Show' }}
                  </button>
                </div>
                <div v-if="loginErrors.password" class="text-red-600 text-sm mt-1">{{ loginErrors.password }}</div>
              </div>
              
              <div v-if="error" class="text-red-600">{{ error }}</div>
              
              <button 
                type="submit" 
                class="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md"
                :disabled="loading"
              >
                {{ loading ? 'Logging in...' : 'Login' }}
              </button>
            </form>
            <div class="space-y-6 text-center">
              <button @click="currentForm = 'forgot'" class="text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer">Forgot Password?</button>
              <div class="space-y-4">
                <div class="space-x-1 text-sm">
                  <span class="text-gray-500">Don't have an account?</span>
                  <button @click="currentForm = 'register'" class="text-red-600 hover:text-red-700 font-medium cursor-pointer">Sign up</button>
                </div>
                <button @click="currentForm = 'registerSeller'" 
                        class="text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer">Become a host</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Register Form -->
        <div v-if="currentForm === 'register'" class="flex flex-col gap-6">
          <div class="space-y-10">
            <form @submit.prevent="handleRegister" class="space-y-6">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input v-model="fullName" type="text" placeholder="Enter your full name" required 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input v-model="email" type="email" placeholder="Enter your email" required 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200" />
                </div>
                <div class="relative">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input v-model="password" :type="showRegisterPassword ? 'text' : 'password'" placeholder="Create a password" required 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200" />
                  <button type="button" @click="showRegisterPassword = !showRegisterPassword" 
                          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                    <span class="text-xl">{{ showRegisterPassword ? '🙈' : '👁️' }}</span>
                  </button>
                </div>
              </div>
              <button type="submit" 
                      class="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer mt-6">
                Create Account
              </button>
            </form>
            <div class="text-center space-y-4">
              <button @click="currentForm = 'login'" class="text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer">Back to Login</button>
            </div>
          </div>
        </div>

        <!-- Seller Register -->
        <div v-if="currentForm === 'registerSeller'" class="flex flex-col gap-6">
          <div class="space-y-10">
            <form @submit.prevent="handleRegisterSeller" class="space-y-6">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input v-model="fullName" type="text" placeholder="Enter your full name" required 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input v-model="email" type="email" placeholder="Enter your email" required 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200" />
                </div>
                <div class="relative">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input v-model="password" :type="showSellerPassword ? 'text' : 'password'" placeholder="Create a password" required 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200" />
                  <button type="button" @click="showSellerPassword = !showSellerPassword" 
                          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                    <span class="text-xl">{{ showSellerPassword ? '🙈' : '👁️' }}</span>
                  </button>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">License ID</label>
                  <input v-model="license" type="text" placeholder="Enter your license ID" required 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200" />
                </div>
              </div>
              <button type="submit" 
                      class="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer mt-6">
                Register as Host
              </button>
            </form>
            <div class="text-center space-y-4">
              <button @click="currentForm = 'login'" class="text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer">Back to Login</button>
            </div>
          </div>
        </div>

        <!-- Forgot Password -->
        <div v-if="currentForm === 'forgot'" class="flex flex-col gap-6">
          <div class="space-y-10">
            <form @submit.prevent="handleForgotPassword" class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input v-model="email" type="email" placeholder="Enter your email" required 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200" />
              </div>
              <button type="submit" 
                      class="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer mt-6">
                Send Reset Link
              </button>
            </form>
            <div class="text-center space-y-4">
              <button @click="currentForm = 'login'" class="text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer">Back to Login</button>
            </div>
          </div>
        </div>

      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import axios from '@/axios'
import { useAuthStore } from '@/stores/auth'

const currentForm = ref('login')
const email = ref('')
const password = ref('')
const fullName = ref('')
const license = ref('')
const showPassword = ref(false)
const showRegisterPassword = ref(false)
const showSellerPassword = ref(false)
const initComplete = ref(false)  // Track initialization to prevent loops
const loading = ref(false)
const error = ref(null)

// Add proper form data and validation
const loginForm = ref({
  email: '',
  password: '',
})
const loginErrors = ref({
  email: '',
  password: '',
})

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Fetch full user data from backend and store in Pinia + localStorage
const fetchAndStoreUser = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return

    try {
      const userData = await authStore.fetchFullUserInfo(true)
      console.log('User data fetched successfully:', !!userData)
    } catch (err) {
      console.error('Failed to fetch full user info:', err)
    }
  } catch (err) {
    console.error('Error in fetchAndStoreUser:', err)
  }
}

// Modified to prevent loops and use proper form variables
const handleLogin = async (e) => {
  e.preventDefault();
  
  // Reset error
  error.value = null;
  
  // Validate form
  loginErrors.value.email = !loginForm.value.email ? 'Email is required' : '';
  loginErrors.value.password = !loginForm.value.password ? 'Password is required' : '';
  
  if (loginErrors.value.email || loginErrors.value.password) {
    return;
  }
  
  try {
    loading.value = true;
    
    await authStore.login(loginForm.value.email, loginForm.value.password);
    
    // Check for redirect or navigate to dashboard
    if (route.query.redirect) {
      router.push(route.query.redirect);
    } else if (authStore.isSeller) {
      router.push('/dashboard');
    } else {
      router.push('/campers');
    }
  } catch (err) {
    console.error('Login error:', err);
    error.value = err.message || 'Login failed. Please check your credentials.';
  } finally {
    loading.value = false;
  }
};

const handleRegister = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    await authStore.register({
      email: email.value,
      password: password.value,
      full_name: fullName.value
    });

    router.push(route.query.redirect || '/campers');
  } catch (err) {
    console.error('Registration error:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

const handleRegisterSeller = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    await authStore.register({
      email: email.value,
      password: password.value,
      full_name: fullName.value,
      is_seller: true,
      license: license.value
    });

    router.push('/dashboard');
  } catch (err) {
    console.error('Seller registration error:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

const handleForgotPassword = async () => {
  const { error } = await supabase.auth.resetPasswordForEmail(email.value)
  if (error) alert(error.message)
  else alert('Password reset email sent')
}

const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/login-redirect' }
  })
  if (error) alert(error.message)
}

// Add a fix to prevent loops when component mounts
onMounted(async () => {
  // Prevent running initialization multiple times
  if (initComplete.value) return
  
  try {
    // Check if user is already authenticated
    if (authStore.isLoggedIn) {
      console.log('User already logged in, redirecting away from auth page')
      // If the user is already logged in, they shouldn't be on the login page
      if (authStore.isSeller) {
        router.push('/dashboard')
      } else {
        router.push('/campers')
      }
      return
    }
    
    // Do lightweight auth check without triggering full initialization
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      console.log('Session found on auth page, redirecting')
      // User has a session but is on login page - redirect to appropriate place
      const { data } = await axios.get('/users/full-info', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      }).catch(() => ({ data: null }))
      
      if (data?.isowner) {
        router.push('/dashboard')
      } else {
        router.push('/campers')
      }
    }
  } catch (err) {
    console.error('Auth page init error:', err)
  } finally {
    initComplete.value = true
  }
})

</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Updated spacing values */
form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

form > div {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.space-y-6 > * + * {
  margin-top: 1.25rem !important;
}

.space-y-8 > * + * {
  margin-top: 1.75rem !important;
}

.space-y-10 > * + * {
  margin-top: 2rem !important;
}

/* Add cursor pointer to all interactive elements */
button, 
a,
input[type="submit"],
.cursor-pointer {
  cursor: pointer;
}

/* Add hover effect to all interactive elements */
button:not(:disabled):hover,
a:hover {
  opacity: 0.9;
}
</style>

