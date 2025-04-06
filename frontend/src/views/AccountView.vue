<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import axios from 'axios'
import BookingCard from '@/components/BookingCard.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const user = ref(null)
const fullUser = ref(null)

const activeTab = ref('info')
const upcomingBookings = ref([])
const previousBookings = ref([])

const tabButton = (tab) =>
  `px-4 py-2 border-b-2 ${
    activeTab.value === tab ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500'
  } hover:text-emerald-600`

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  user.value = data.user
  if (!user.value) return router.push('/auth')

  // Use the cached data from Pinia store
  fullUser.value = authStore.fullUser
  filterBookings()
})

// Add a watcher for authStore.fullUser
watch(() => authStore.fullUser, (newValue) => {
  if (newValue) {
    fullUser.value = newValue
    filterBookings()
  }
}, { deep: true })

const filterBookings = () => {
  if (!fullUser.value || !Array.isArray(fullUser.value.bookings)) {
    upcomingBookings.value = []
    previousBookings.value = []
    if (activeTab.value === 'previous') {
      activeTab.value = 'info'
    }
    return
  }

  // 🧹 Clean nulls first
  const cleanBookings = fullUser.value.bookings.filter(b => b !== null)
  const now = new Date()

  // Show confirmed (2) bookings in upcoming if they're in the future
  upcomingBookings.value = cleanBookings.filter(b => {
    const startDate = new Date(b.start_date)
    return startDate > now && b.status_id === 2 // Only show confirmed (2) bookings
  })

  // Show completed (4) and cancelled (3) bookings in previous
  previousBookings.value = cleanBookings.filter(b => {
    const endDate = new Date(b.end_date)
    return b.status_id === 3 || b.status_id === 4 || (endDate <= now && b.status_id === 2)
  })

  if (previousBookings.value.length === 0 && activeTab.value === 'previous') {
    activeTab.value = 'info'
  }
}

// Password change logic
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const changePassword = async () => {
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    alert('Please fill in all fields')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    alert('New passwords do not match')
    return
  }

  if (newPassword.value.length < 6) {
    alert('New password must be at least 6 characters long')
    return
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: user.value.email,
    password: currentPassword.value
  })

  if (signInError) {
    alert('Current password is incorrect')
    return
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword.value
  })

  if (updateError) {
    alert('Failed to update password: ' + updateError.message)
  } else {
    alert('Password updated successfully')
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  }
}

</script>


<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">
    <div class="max-w-4xl w-full p-6">
      <div class="flex justify-between mb-6 border-b pb-2">
        <button @click="activeTab = 'info'" :class="tabButton('info')" class="cursor-pointer">Account Info</button>
        <button @click="activeTab = 'upcoming'" :class="tabButton('upcoming')" class="cursor-pointer">Upcoming Bookings</button>
        <button v-if="previousBookings.length > 0" @click="activeTab = 'previous'" :class="tabButton('previous')" class="cursor-pointer">Previous Bookings</button>
      </div>

      <!-- Account Info -->
      <div v-if="user && activeTab === 'info'">
        <h2 class="text-xl font-semibold mb-4">Account Information</h2>
        <div class="flex flex-col gap-4 mb-8">
          <div>
            <p class="text-gray-700 font-medium"><strong>Name:</strong></p>
            <p>{{ fullUser?.full_name }}</p>
          </div>
          <div>
            <p class="text-gray-700 font-medium"><strong>Email:</strong></p>
            <p>{{ fullUser?.email }}</p>
          </div>
        </div>

        <!-- Password change -->
        <div class="mt-8">
          <h3 class="text-lg font-semibold mb-4">Change Password</h3>
          <form @submit.prevent="changePassword" class="max-w-sm flex flex-col gap-5">
            <!-- Current Password -->
            <div class="flex flex-col gap-1">
              <label class="text-sm">Current Password</label>
              <div class="flex items-center border rounded px-2">
                <input
                  :type="showCurrent ? 'text' : 'password'"
                  v-model="currentPassword"
                  required
                  class="w-full p-2 outline-none"
                />
                <button type="button" @click="showCurrent = !showCurrent" class="ml-2 text-lg cursor-pointer">
                  {{ showCurrent ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <!-- New Password -->
            <div class="flex flex-col gap-1">
              <label class="text-sm">New Password</label>
              <div class="flex items-center border rounded px-2">
                <input
                  :type="showNew ? 'text' : 'password'"
                  v-model="newPassword"
                  required
                  class="w-full p-2 outline-none"
                />
                <button type="button" @click="showNew = !showNew" class="ml-2 text-lg cursor-pointer">
                  {{ showNew ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <!-- Confirm New Password -->
            <div class="flex flex-col gap-1">
              <label class="text-sm">Confirm New Password</label>
              <div class="flex items-center border rounded px-2">
                <input
                  :type="showConfirm ? 'text' : 'password'"
                  v-model="confirmPassword"
                  required
                  class="w-full p-2 outline-none"
                />
                <button type="button" @click="showConfirm = !showConfirm" class="ml-2 text-lg cursor-pointer">
                  {{ showConfirm ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <!-- Submit -->
            <button type="submit" class="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600">
              Update Password
            </button>
          </form>
        </div>
      </div>

      <!-- Upcoming Bookings -->
      <div v-if="user && activeTab === 'upcoming'">
        <h2 class="text-xl font-semibold mb-4">Upcoming Bookings</h2>
        <div v-if="upcomingBookings.length > 0">
          <BookingCard
            v-for="booking in upcomingBookings"
            :key="booking.booking_id"
            :booking="booking"
          />
        </div>
        <div v-else class="text-center p-8 bg-gray-50 rounded-lg">
          <p class="text-gray-500">No upcoming bookings found.</p>
        </div>
      </div>

      <!-- Previous Bookings -->
      <div v-if="user && activeTab === 'previous'" class="w-full">
        <h2 class="text-xl font-semibold mb-4">Previous Bookings</h2>
        <div v-if="previousBookings.length > 0" class="space-y-4">
          <BookingCard
            v-for="booking in previousBookings"
            :key="booking.booking_id"
            :booking="booking"
          />
        </div>
        <div v-else class="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <p class="text-gray-700 text-lg">No previous bookings found.</p>
        </div>
      </div>

      <!-- Not logged in -->
      <div v-if="!user" class="text-center text-gray-500">
        <p>Please <RouterLink to="/auth" class="text-blue-500 underline">log in</RouterLink> to view your account.</p>
      </div>
    </div>
  </div>
</template>
