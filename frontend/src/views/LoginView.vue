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
            <form @submit.prevent="handleLogin" class="space-y-8">
              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input v-model="email" type="email" placeholder="Enter your email" required 
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200" />
                </div>
                <div class="relative">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div class="relative">
                    <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Enter your password" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200" />
                    <button type="button" @click="showPassword = !showPassword" 
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                      <span class="text-xl">{{ showPassword ? '🙈' : '👁️' }}</span>
                    </button>
                  </div>
                </div>
              </div>
              <button type="submit" 
                      class="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer">
                Sign in
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
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const currentForm = ref('login')
const email = ref('')
const password = ref('')
const fullName = ref('')
const license = ref('') // Fixed: Removed extra quote
const showPassword = ref(false)
const showRegisterPassword = ref(false)
const showSellerPassword = ref(false)

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 🔁 Fetch full user data from backend and store in Pinia + localStorage
const fetchAndStoreUser = async () => {
  try {
    const {
      data: { session }
    } = await supabase.auth.getSession()

    const token = session?.access_token
    if (!token) return

    const { data } = await axios.get('/users/full-info', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    authStore.fullUser = data
    localStorage.setItem('userData', JSON.stringify(data))
  } catch (err) {
    console.error('Failed to fetch full user info:', err)
  }
}

const handleLogin = async () => {
  try {
    const { success, error, isOwner } = await authStore.handleLogin({
      email: email.value,
      password: password.value
    })

    if (!success) throw new Error(error)

    // Check if we came from booking
    const redirectPath = route.query.redirect
    const startDate = route.query.startDate
    const endDate = route.query.endDate

    if (redirectPath && redirectPath.includes('create-booking')) {
      router.push({
        path: redirectPath,
        query: {
          startDate,
          endDate
        }
      })
    } else if (isOwner) {
      router.push('/dashboard')
    } else {
      router.push('/campers')
    }
  } catch (error) {
    console.error('Login error:', error)
    alert(error.message)
  }
}

const handleRegister = async () => {
  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: { data: { full_name: fullName.value } }
  })
  if (error) return alert(error.message)

  const user = data.user
  if (user) {
    await axios.post('/users', {
      email: email.value,
      full_name: fullName.value,
      isowner: false,
      auth_user_id: user.id
    })

    await fetchAndStoreUser()
    setTimeout(() => {
      router.push(route.query.redirect || '/')
    }, 50)
  }
}

const handleRegisterSeller = async () => {
  try {
    // First register with Supabase
    const { data, error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: { 
        data: { 
          full_name: fullName.value,
          isowner: 1,
          license: license.value 
        } 
      }
    })
    if (error) throw error

    const user = data.user
    if (user) {
      // Then create user in your database
      await axios.post('/users', {
        email: email.value,
        full_name: fullName.value,
        is_seller: true,
        license: license.value,
        auth_user_id: user.id
      })

      // Login after registration
      await authStore.handleLogin({
        email: email.value,
        password: password.value
      })

      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Registration error:', error)
    alert(error.message)
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

