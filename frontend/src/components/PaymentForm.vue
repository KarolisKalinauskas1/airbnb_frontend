<template>
  <div class="w-full">
    <form id="payment-form" @submit.prevent="handleSubmit">
      <div id="payment-element" class="mb-4">
        <!-- Stripe Elements will be inserted here -->
      </div>
      <button 
        type="submit"
        class="w-full py-4 rounded-xl font-semibold shadow-md transition-all duration-200"
        :class="[
          !loading
            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        ]"
        :disabled="loading"
      >
        <span v-if="loading">Processing...</span>
        <span v-else>Pay €{{ amount }}</span>
      </button>
      <div v-if="errorMessage" class="text-red-500 mt-4">
        {{ errorMessage }}
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { loadStripe } from '@stripe/stripe-js';

const props = defineProps({
  amount: {
    type: String,
    required: true
  },
  clientSecret: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['payment-succeeded', 'payment-failed']);
const loading = ref(false);
const errorMessage = ref('');
let elements;
let stripe;

onMounted(async () => {
  stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  elements = stripe.elements({
    clientSecret: props.clientSecret,
    appearance: {
      theme: 'stripe',
    }
  });

  const paymentElement = elements.create('payment');
  paymentElement.mount('#payment-element');
});

const handleSubmit = async (e) => {
  e.preventDefault();
  loading.value = true;
  errorMessage.value = '';

  try {
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required'
    });

    if (error) {
      errorMessage.value = error.message;
      emit('payment-failed', error);
    } else {
      emit('payment-succeeded');
    }
  } catch (e) {
    errorMessage.value = 'An unexpected error occurred.';
    emit('payment-failed', e);
  } finally {
    loading.value = false;
  }
};
</script>
