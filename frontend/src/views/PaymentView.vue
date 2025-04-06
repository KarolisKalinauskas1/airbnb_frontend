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
              <span>€{{ bookingDetails.base_price }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Service fee</span>
              <span>€{{ (bookingDetails.total - bookingDetails.base_price).toFixed(2) }}</span>
            </div>
            <div class="pt-4 border-t flex justify-between font-bold">
              <span>Total</span>
              <span>€{{ bookingDetails.total }}</span>
            </div>
          </div>
        </div>

        <!-- Stripe Payment Form -->
        <form id="payment-form" @submit.prevent="handleSubmit">
          <div id="payment-element" class="mb-6"></div>
          <button
            type="submit"
            class="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300"
            :disabled="loading"
          >
            <span v-if="loading">Processing...</span>
            <span v-else>Pay €{{ bookingDetails.total }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/axios'
import { useToast } from 'vue-toastification'
import { loadStripe } from '@stripe/stripe-js'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const stripe = ref(null)
const elements = ref(null)
const bookingDetails = ref(null)

onMounted(async () => {
  try {
    // Get booking details from route state
    bookingDetails.value = route.params.bookingDetails
    if (!bookingDetails.value) {
      throw new Error('No booking details found')
    }

    // Initialize Stripe
    stripe.value = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

    // Create payment intent
    const { data } = await axios.post('/api/bookings/create-payment-intent', {
      amount: bookingDetails.value.total
    })
    
    // Create payment elements
    elements.value = stripe.value.elements({
      clientSecret: data.clientSecret,
      appearance: {
        theme: 'stripe'
      }
    })

    const paymentElement = elements.value.create('payment')
    paymentElement.mount('#payment-element')
  } catch (error) {
    toast.error('Failed to initialize payment')
    router.push('/account')
  }
})

const handleSubmit = async () => {
  loading.value = true

  try {
    const { error } = await stripe.value.confirmPayment({
      elements: elements.value,
      confirmParams: {
        return_url: `${window.location.origin}/booking-success`,
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    // Create booking after successful payment
    const response = await axios.post('/api/bookings/confirm', bookingDetails.value)
    if (response.data.success) {
      toast.success('Booking confirmed successfully!')
      router.push('/account')
    }
  } catch (error) {
    toast.error('Payment failed: ' + error.message)
  } finally {
    loading.value = false
  }
}
</script>
