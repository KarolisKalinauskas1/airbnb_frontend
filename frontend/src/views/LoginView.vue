<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">
    <Transition name="fade" mode="out-in">
      <div key="auth-form" class="max-w-md w-full p-8 border border-gray-200 rounded-2xl shadow bg-white">

        <!-- Google Button (Login only) -->
        <div v-if="currentForm === 'login'" class="flex flex-col gap-3 mb-6">
          <button @click="loginWithGoogle" class="w-full py-2 border border-gray-300 rounded-md flex items-center justify-center gap-2 hover:bg-gray-100">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="h-5 w-5" />
            <span>Continue with Google</span>
          </button>
          <div class="text-center text-sm text-gray-500">or</div>
        </div>

        <!-- Login -->
        <div v-if="currentForm === 'login'">
          <h2 class="text-2xl font-semibold mb-6 text-center">Login</h2>
          <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
            <input v-model="email" type="email" placeholder="Email" required class="px-4 py-2 border border-gray-300 rounded-md" />
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Password"
                required
                class="px-4 py-2 border border-gray-300 rounded-md w-full"
              />
              <button type="button" class="absolute right-3 top-2.5" @click="showPassword = !showPassword">
                <span v-if="showPassword">👁️</span>
                <span v-else>🙈</span>
              </button>
            </div>
            <button type="submit" class="py-2 bg-emerald-500 text-white font-semibold rounded-md hover:bg-emerald-600">Login</button>
          </form>
          <div class="text-center mt-4 space-y-1">
            <button @click="currentForm = 'forgot'" class="text-blue-500 hover:underline">Forgot Password?</button>
            <button @click="currentForm = 'register'" class="text-blue-500 hover:underline">Register</button>
            <button @click="currentForm = 'registerSeller'" class="text-blue-500 hover:underline">Register as Seller</button>
          </div>
        </div>

        <!-- Register -->
        <div v-if="currentForm === 'register'">
          <h2 class="text-2xl font-semibold mb-6 text-center">Register</h2>
          <form @submit.prevent="handleRegister" class="flex flex-col gap-4">
            <input v-model="fullName" type="text" placeholder="Full Name" required class="px-4 py-2 border rounded-md" />
            <input v-model="email" type="email" placeholder="Email" required class="px-4 py-2 border rounded-md" />
            <input v-model="password" type="password" placeholder="Password" required class="px-4 py-2 border rounded-md" />
            <button type="submit" class="py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600">Register</button>
          </form>
          <div class="text-center mt-4">
            <button @click="currentForm = 'login'" class="text-blue-500 hover:underline">Back to Login</button>
          </div>
        </div>

        <!-- Seller Register -->
        <div v-if="currentForm === 'registerSeller'">
          <h2 class="text-2xl font-semibold mb-6 text-center">Seller Registration</h2>
          <form @submit.prevent="handleRegisterSeller" class="flex flex-col gap-4">
            <input v-model="fullName" type="text" placeholder="Full Name" required class="px-4 py-2 border rounded-md" />
            <input v-model="email" type="email" placeholder="Email" required class="px-4 py-2 border rounded-md" />
            <input v-model="password" type="password" placeholder="Password" required class="px-4 py-2 border rounded-md" />
            <input v-model="license" type="text" placeholder="License ID" class="px-4 py-2 border rounded-md" />
            <button type="submit" class="py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600">Register as Seller</button>
          </form>
          <div class="text-center mt-4">
            <button @click="currentForm = 'login'" class="text-blue-500 hover:underline">Back to Login</button>
          </div>
        </div>

        <!-- Forgot Password -->
        <div v-if="currentForm === 'forgot'">
          <h2 class="text-2xl font-semibold mb-6 text-center">Reset Password</h2>
          <form @submit.prevent="handleForgotPassword" class="flex flex-col gap-4">
            <input v-model="email" type="email" placeholder="Your email" required class="px-4 py-2 border rounded-md" />
            <button type="submit" class="py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600">Send Reset Link</button>
          </form>
          <div class="text-center mt-4">
            <button @click="currentForm = 'login'" class="text-blue-500 hover:underline">Back to Login</button>
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
const license = ref('')
const showPassword = ref(false)

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

