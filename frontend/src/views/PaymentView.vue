<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-2xl mx-auto px-4">
      <button 
        @click="router.back()" 
        class="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <span class="text-xl">←</span> Back
      </button>

      <div class="bg-white rounded-lg shadow-lg p-6">
        <h1 class="text-2xl font-semibold mb-6">Complete Payment</h1>
        
        <!-- Order Summary -->
        <div class="mb-8 border-b pb-6">
          <h2 class="text-lg font-medium mb-4">Order Summary</h2>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">{{ bookingDetails.nights }} nights</span>
              <span>€{{ bookingDetails.subtotal }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Service fee</span>
              <span>€{{ bookingDetails.serviceFee }}</span>
            </div>
            <div class="flex justify-between font-bold mt-4 pt-4 border-t">
              <span>Total</span>
              <span>€{{ bookingDetails.total }}</span>
            </div>
          </div>
        </div>

        <!-- Payment Form -->
        <PaymentForm
          v-if="clientSecret"
          :amount="bookingDetails.total"
          :client-secret="clientSecret"
          @payment-succeeded="handlePaymentSuccess"
          @payment-failed="handlePaymentFailure"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PaymentForm from '@/components/PaymentForm.vue'
import { useToast } from 'vue-toastification'
import axios from '@/axios'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const clientSecret = ref(null)
const bookingDetails = ref(null)

onMounted(async () => {
  try {
    // Get booking details from route state
    bookingDetails.value = route.params.bookingDetails
    if (!bookingDetails.value) {
      throw new Error('No booking details found')
    }

    // Create payment intent
    const { data } = await axios.post('/api/bookings/create-payment-intent', {
      amount: parseFloat(bookingDetails.value.total)
    })
    clientSecret.value = data.clientSecret
  } catch (error) {
    toast.error('Failed to initialize payment')
    router.push('/account')
  }
})

const handlePaymentSuccess = async () => {
  try {
    const response = await axios.post('/api/bookings/confirm', bookingDetails.value)
    if (response.data) {
      toast.success('Booking confirmed successfully!')
      router.push('/account')
    }
  } catch (error) {
    toast.error('Booking failed: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

const handlePaymentFailure = (error) => {
  toast.error('Payment failed: ' + error.message)
}
</script>
