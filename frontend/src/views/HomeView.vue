<script setup>
import { ref, computed, onMounted, reactive, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { supabase } from '@/lib/supabase'
import axios from '@/axios'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

// State for OAuth handling
const oauthProcessing = ref(false)

const isOwner = computed(() => authStore.isOwner)
const activeTab = ref(0) // For feature tabs animation
const heroVisible = ref(false) // For hero section animation
const activeExperience = ref(0) // For unique experiences carousel

// Handle OAuth callback if needed
async function handleOAuthCallback() {
  if (route.query.source === 'oauth') {
    oauthProcessing.value = true
    
    try {
      console.log('HomeView: Detected OAuth callback, processing...')
      
      // Clean up the URL to remove the OAuth parameters
      const cleanPath = router.currentRoute.value.path
      router.replace({ path: cleanPath })
      
      // Get Supabase session
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error retrieving Supabase session:', error)
        toast.error('Login was not completed successfully. Please try again.')
        return
      }
      
      if (data?.session?.user) {
        const user = data.session.user
        console.log('Successfully retrieved user data from Supabase session')
        
        // Sync with our backend
        try {
          const backendResponse = await axios.post('/api/auth/oauth/google/supabase-callback', {
            supabase_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url
          })
          
          // Store token and user info
          localStorage.setItem('token', backendResponse.data.token)
          localStorage.setItem('user_id', backendResponse.data.user.user_id)
          localStorage.setItem('user_email', user.email)
          
          // Initialize auth store with the new token
          await authStore.initAuth({ forceRefresh: true })
          toast.success('Login successful! Welcome back.')
        } catch (backendError) {
          console.error('Backend synchronization error:', backendError)
          toast.error('There was an issue completing your login. Please try again.')
        }
      } else {
        console.error('No user data found in Supabase session')
        toast.warning('Login was not completed. Please try again.')
      }
    } catch (error) {
      console.error('Error in OAuth processing:', error)
      toast.error('Authentication error. Please try again.')
    } finally {
      oauthProcessing.value = false
    }
  }
}

// Unique camping experiences - impressive showcase section
const uniqueExperiences = [
  {
    title: 'Lakeside Serenity',
    description: 'Wake up to the gentle sounds of water lapping against the shore with stunning sunrise views.',
    color: 'from-blue-500 to-cyan-600',
    highlight: 'Perfect for photography enthusiasts and nature lovers.',
    icon: '🏞️'
  },
  {
    title: 'Forest Retreats',
    description: 'Immerse yourself in the tranquility of ancient woodlands with secluded spots among towering trees.',
    color: 'from-emerald-600 to-green-700',
    highlight: 'Ideal for those seeking peace and quiet away from city life.',
    icon: '🌲'
  },
  {
    title: 'Mountain Views',
    description: 'Set up camp with breathtaking panoramic mountain vistas as your daily backdrop.',
    color: 'from-amber-600 to-orange-700',
    highlight: 'Perfect for hikers and outdoor adventurers.',
    icon: '⛰️'
  },
  {
    title: 'Stargazing Havens',
    description: 'Experience the night sky like never before in locations with minimal light pollution.',
    color: 'from-indigo-700 to-purple-800',
    highlight: 'Astronomical wonders await in these specially selected spots.',
    icon: '✨'
  }
]

// Platform benefits for owners
const ownerBenefits = [
  {
    title: 'Extra Income',
    description: 'Turn your unused land into a profitable venture with minimal investment.',
    icon: '💰',
    color: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  {
    title: 'Simple Management',
    description: 'Our platform handles bookings, payments, and customer service so you can focus on hosting.',
    icon: '🔄',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    title: 'Flexible Hosting',
    description: 'Choose when your property is available and set your own rules and rates.',
    icon: '📅',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    title: 'Growing Community',
    description: 'Join a network of hosts sharing knowledge and tips to improve guest experiences.',
    icon: '👥',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    title: 'Insurance Protection',
    description: 'Rest easy with our comprehensive insurance coverage for hosts.',
    icon: '🛡️',
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  {
    title: 'Verified Guests',
    description: 'All guests are verified for security and peace of mind.',
    icon: '✅',
    color: 'bg-green-100 text-green-800 border-green-200'
  }
]

// Interactive features with additional details
const features = reactive([
  {
    icon: '🏕️',
    title: 'Unique Locations',
    description: 'Discover handpicked camping spots you won\'t find anywhere else',
    detail: 'Our community has curated over 500 unique camping spots across the country that you won\'t find on typical booking platforms.'
  },
  {
    icon: '💰',
    title: 'Best Prices',
    description: 'Find the perfect spot for your budget with transparent pricing',
    detail: 'No hidden fees or surprise charges. We ensure all hosts provide clear pricing and optional add-ons are clearly marked.'
  },
  {
    icon: '🔒',
    title: 'Secure Booking',
    description: 'Book with peace of mind using our secure payment system',
    detail: 'All payments are processed through our secure payment gateway with fraud protection and 24/7 customer support.'
  },
  {
    icon: '⭐',
    title: 'Verified Reviews',
    description: 'Read authentic reviews from fellow campers',
    detail: 'We verify that reviews come from real campers who have stayed at the location, providing honest feedback about their experience.'
  }
])

// Essential camping gear section - replacing testimonials
const campingGear = [
  {
    name: 'Quality Tent',
    icon: '⛺',
    description: 'Your home away from home. Choose weather-appropriate size and materials.'
  },
  {
    name: 'Sleeping Bag',
    icon: '🛌',
    description: 'Select one rated for the temperatures you\'ll be camping in.'
  },
  {
    name: 'Cooking Gear',
    icon: '🍳',
    description: 'Portable stove, pots, utensils, and don\'t forget the coffee maker!'
  },
  {
    name: 'First Aid Kit',
    icon: '🩹',
    description: 'Safety first! Include bandages, antiseptics, and any personal medications.'
  },
  {
    name: 'Navigation Tools',
    icon: '🧭',
    description: 'Maps, compass, or GPS devices to help you find your way.'
  },
  {
    name: 'Lighting',
    icon: '🔦',
    description: 'Headlamps, lanterns, and flashlights with extra batteries.'
  }
]

const steps = [
  {
    number: 1,
    title: 'Search',
    description: 'Find camping spots by location, dates, and amenities',
    icon: '🔍'
  },
  {
    number: 2,
    title: 'Book',
    description: 'Reserve your spot with our secure booking system',
    icon: '📅'
  },
  {
    number: 3,
    title: 'Camp',
    description: 'Enjoy your outdoor adventure!',
    icon: '⛺'
  }
]

// Camping tips & hacks - interactive accordion
const campingTips = ref([
  {
    title: 'Stay Dry in Unexpected Rain',
    content: 'Pack a tarp or extra rain fly that\'s larger than your tent footprint. Set it up as an additional layer of protection or as a dry area for cooking and gathering.',
    isOpen: false
  },
  {
    title: 'Fire Starting Tips',
    content: 'Bring waterproof matches and fire starters like dryer lint stored in wax paper or empty toilet paper rolls filled with dryer lint and covered in wax.',
    isOpen: false
  },
  {
    title: 'Keep Food Cold Longer',
    content: 'Freeze water bottles before your trip to use as ice packs. They\'ll keep food cold then provide drinking water as they melt.',
    isOpen: false
  },
  {
    title: 'Natural Insect Repellent',
    content: 'Burn sage or lavender in your campfire as a natural bug repellent, or bring citronella candles to keep mosquitoes at bay.',
    isOpen: false
  }
])

// Experience interval for auto-changing
let experienceInterval = null

const toggleTip = (index) => {
  campingTips.value[index].isOpen = !campingTips.value[index].isOpen
}

const setExperience = (index) => {
  activeExperience.value = index
  // Reset the auto-rotation timer when manually changed
  if (experienceInterval) {
    clearInterval(experienceInterval)
    startExperienceRotation()
  }
}

const startExperienceRotation = () => {
  experienceInterval = setInterval(() => {
    activeExperience.value = (activeExperience.value + 1) % uniqueExperiences.length
  }, 5000) // Change every 5 seconds
}

const handleExplore = () => {
  if (isOwner.value) {
    router.push('/dashboard')
  } else {
    router.push('/campers') // Updated to correct path
  }
}

const setActiveTab = (index) => {
  activeTab.value = index
}

onMounted(async () => {
  if (authStore.isLoggedIn && !authStore.fullUser) {
    try {
      await authStore.fetchFullUserInfo(true)
    } catch (error) {
      console.error('Error fetching user info:', error)
    }
  }
  
  // Trigger entrance animation after a short delay
  setTimeout(() => {
    heroVisible.value = true
  }, 100)
  
  // Start auto-rotation for experiences
  startExperienceRotation()

  // Handle OAuth callback
  await handleOAuthCallback()
})

// Clean up interval on unmount
onBeforeUnmount(() => {
  if (experienceInterval) {
    clearInterval(experienceInterval)
  }
})
</script>

<template>
  <div class="home-container bg-gray-50">
    <!-- Hero section with animated entrance -->
    <div class="relative overflow-hidden bg-gradient-to-br from-emerald-800 to-teal-600 text-white">
      <!-- Animated background pattern -->
      <div class="absolute inset-0 overflow-hidden opacity-20">
        <div class="absolute top-0 left-0 right-0 h-px bg-white/20 animate-slide-right"></div>
        <div class="absolute top-0 bottom-0 right-0 w-px bg-white/20 animate-slide-down"></div>
        <div class="absolute bottom-0 left-0 right-0 h-px bg-white/20 animate-slide-left"></div>
        <div class="absolute top-0 bottom-0 left-0 w-px bg-white/20 animate-slide-up"></div>
        
        <div class="grid grid-cols-4 grid-rows-3 h-full w-full">
          <div v-for="i in 12" :key="i" class="border border-white/10"></div>
        </div>
      </div>
      
      <!-- Hero content -->
      <div class="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div class="max-w-4xl mx-auto text-center">
          <!-- Animated hero content that fades and slides in -->
          <div :class="['transition-all duration-1000 transform', 
                       heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']">
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Discover Unique Camping Experiences
            </h1>
            
            <p class="text-xl md:text-2xl opacity-90 mb-8 max-w-2xl mx-auto">
              Find perfect camping spots for your next outdoor adventure
            </p>
            
            <button 
              @click="handleExplore" 
              class="bg-white text-emerald-700 hover:bg-emerald-50 py-3 px-8 rounded-full text-lg shadow-lg transform transition duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 pulse-on-hover">
              {{ isOwner ? 'Go to Dashboard' : 'Explore Camping Spots' }}
            </button>
          </div>
          
          <!-- Scroll indicator -->
          <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Features section with tabs -->
    <div class="py-16 bg-gradient-to-b from-white to-gray-50">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-4 text-gray-800">
          Why Choose Our Platform?
        </h2>
        <p class="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          We've built a platform that makes finding and booking camping spots simple, secure, and enjoyable.
        </p>
        
        <!-- Feature tabs navigation -->
        <div class="flex flex-wrap justify-center mb-8 gap-2">
          <button 
            v-for="(feature, index) in features" 
            :key="feature.title"
            @click="setActiveTab(index)"
            class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 focus:outline-none"
            :class="[
              activeTab === index 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            ]">
            <span class="mr-1">{{ feature.icon }}</span> {{ feature.title }}
          </button>
        </div>
        
        <!-- Feature content with animations -->
        <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
          <div class="relative h-80 overflow-hidden">
            <div
              v-for="(feature, index) in features"
              :key="feature.title"
              :class="[
                'absolute inset-0 p-8 md:p-12 transition-all duration-500 flex flex-col justify-center',
                activeTab === index
                  ? 'opacity-100 translate-x-0'
                  : index < activeTab
                    ? 'opacity-0 -translate-x-full'
                    : 'opacity-0 translate-x-full'
              ]"
            >
              <div class="text-5xl mb-4">{{ feature.icon }}</div>
              <h3 class="text-2xl font-bold text-gray-900 mb-2">{{ feature.title }}</h3>
              <p class="text-gray-600 mb-4">{{ feature.description }}</p>
              <p class="text-gray-700 text-sm border-l-4 border-emerald-500 pl-4 italic">
                {{ feature.detail }}
              </p>
            </div>
          </div>
          
          <!-- Tab indicator -->
          <div class="flex border-t border-gray-100 justify-center">
            <div class="flex gap-2 py-4">
              <div 
                v-for="(feature, index) in features" 
                :key="`indicator-${index}`"
                class="w-2 h-2 rounded-full transition-all duration-300"
                :class="activeTab === index ? 'bg-emerald-500' : 'bg-gray-200'"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- How it works section -->
    <div class="py-16 bg-emerald-50">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-4 text-gray-800">How It Works</h2>
        <p class="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Get started with three simple steps to find your perfect camping experience
        </p>
        
        <div class="flex flex-col md:flex-row max-w-5xl mx-auto">
          <div 
            v-for="(step, index) in steps" 
            :key="step.number" 
            class="flex-1 p-8 relative"
          >
            <div 
              v-if="index < steps.length - 1" 
              class="hidden md:block absolute top-1/4 right-0 w-1/2 h-0.5 bg-emerald-200 z-0">
            </div>
            
            <div class="bg-white rounded-xl p-8 shadow-md relative z-10 h-full transform transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
              <div class="flex flex-col items-center text-center">
                <div class="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 transform transition-all duration-500 hover:rotate-12">
                  <div class="animate-pulse-subtle">{{ step.icon }}</div>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">{{ step.title }}</h3>
                <p class="text-gray-600">{{ step.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Camping tips & hacks section -->
    <div class="py-16 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold mb-4 text-gray-800">Camping Tips & Hacks</h2>
          <p class="text-gray-600 max-w-2xl mx-auto">
            Essential advice to make your camping experience more enjoyable
          </p>
        </div>
        
        <div class="max-w-3xl mx-auto">
          <!-- Essential camping gear grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div 
              v-for="item in campingGear" 
              :key="item.name"
              class="bg-emerald-50 rounded-lg p-6 transition-all duration-300 hover:bg-emerald-100 hover:shadow-md"
            >
              <div class="text-4xl mb-3">{{ item.icon }}</div>
              <h3 class="font-bold text-gray-900 mb-2">{{ item.name }}</h3>
              <p class="text-gray-600 text-sm">{{ item.description }}</p>
            </div>
          </div>
          
          <!-- Camping tips accordion -->
          <div class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div 
              v-for="(tip, index) in campingTips" 
              :key="index"
              class="border-b border-gray-100 last:border-b-0"
            >
              <button 
                @click="toggleTip(index)"
                class="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200 focus:outline-none"
              >
                <h3 class="font-medium text-gray-900">{{ tip.title }}</h3>
                <svg 
                  class="w-5 h-5 text-gray-500 transition-transform duration-200"
                  :class="tip.isOpen ? 'transform rotate-180' : ''"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div 
                class="overflow-hidden transition-all duration-300 bg-gray-50"
                :class="tip.isOpen ? 'max-h-40' : 'max-h-0'"
              >
                <div class="px-6 py-4 text-gray-600">
                  {{ tip.content }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Host benefits section - New section for owners -->
    <div class="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold mb-4 text-gray-800">Become a Camping Host</h2>
          <p class="text-gray-600 max-w-2xl mx-auto mb-8">
            Turn your unused land into a profitable camping destination. 
            Join our community of hosts and start earning today.
          </p>
          
          <button 
            @click="() => router.push('/auth')" 
            class="bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-8 rounded-full text-lg shadow-lg transform transition duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50 pulse-on-hover mb-12">
            Start Hosting Today
          </button>
        </div>
        
        <!-- Benefits grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div 
            v-for="benefit in ownerBenefits" 
            :key="benefit.title"
            class="bg-white rounded-lg p-6 shadow-md border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col"
            :class="benefit.color"
          >
            <!-- Icon with animated background -->
            <div class="w-16 h-16 rounded-full mb-4 flex items-center justify-center text-3xl relative overflow-hidden">
              <div class="animate-pulse-subtle absolute inset-0 bg-current opacity-10 rounded-full"></div>
              <span>{{ benefit.icon }}</span>
            </div>
            
            <h3 class="text-xl font-bold mb-2">{{ benefit.title }}</h3>
            <p class="text-gray-700 flex-grow">{{ benefit.description }}</p>
          </div>
        </div>
        
        <!-- Earnings calculator teaser -->
        <div class="mt-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 md:p-10 text-white max-w-4xl mx-auto shadow-xl">
          <div class="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 class="text-2xl md:text-3xl font-bold mb-3">Estimate Your Earnings</h3>
              <p class="text-white/90 mb-6 text-lg">
                Hosts in your area earn an average of €1,500 per month during peak season.
                Join now and start earning with your land.
              </p>
              <button 
                @click="() => router.push('/auth')" 
                class="bg-white text-emerald-700 hover:bg-emerald-50 py-2 px-6 rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50">
                Join Us
              </button>
            </div>
            
            <!-- Animated earnings graphic -->
            <div class="relative">
              <div class="text-6xl animate-float opacity-90">💰</div>
              <div class="absolute -top-3 -right-3 animate-pulse-fast">
                <div class="text-2xl">€</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA section -->
    <div class="py-16 bg-gradient-to-br from-emerald-700 to-teal-700 text-white">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">Ready to find your perfect camping spot?</h2>
        <p class="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
          Join thousands of happy campers discovering unique outdoor experiences
        </p>
        <button 
          @click="handleExplore" 
          class="bg-white text-emerald-700 hover:bg-emerald-50 py-3 px-8 rounded-full text-lg shadow-lg transform transition duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 pulse-on-hover"
        >
          {{ isOwner ? 'Go to Dashboard' : 'Explore Camping Spots' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom animations */
.pulse-on-hover:hover {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1) translateY(-0.25rem);
  }
  50% {
    transform: scale(1.05) translateY(-0.25rem);
  }
  100% {
    transform: scale(1) translateY(-0.25rem);
  }
}

.animate-pulse-subtle {
  animation: pulse-subtle 3s infinite;
}

@keyframes pulse-subtle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(0.95);
  }
}

.animate-pulse-fast {
  animation: pulse-fast 2s infinite;
}

@keyframes pulse-fast {
  0% {
    opacity: 0.4;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: 0.4;
    transform: scale(0.8);
  }
}

/* Float animation */
.animate-float {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

/* Random floating particles animation */
.animate-float-random {
  position: absolute;
  animation-name: float-random;
  animation-duration: calc(10s + (var(--random, 0) * 10s));
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-delay: calc(var(--random, 0) * -10s);
  top: calc(var(--random, 0.5) * 100%);
  left: calc(var(--random, 0.5) * 100%);
  opacity: calc(var(--random, 0.5) * 0.7);
}

@keyframes float-random {
  0% {
    transform: translate(0, 0);
  }
  33% {
    transform: translate(calc(var(--random, 0.5) * 30px), calc(var(--random, 0.5) * -20px));
  }
  66% {
    transform: translate(calc(var(--random, 0.5) * -20px), calc(var(--random, 0.5) * 10px));
  }
  100% {
    transform: translate(0, 0);
  }
}

/* 3D transforms & perspective */
.perspective-1000 {
  perspective: 1000px;
}

.transform-style-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
}

.rotate-y-0 {
  transform: rotateY(0deg);
}

.rotate-y-90 {
  transform: rotateY(90deg);
}

.-rotate-y-90 {
  transform: rotateY(-90deg);
}

/* Text shadows */
.text-shadow-sm {
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.text-shadow-lg {
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.text-shadow-none {
  text-shadow: none;
}

/* Glowing shadow effects */
.shadow-glow {
  box-shadow: 0 0 5px 0 rgba(var(--glow-color, 74, 222, 128), 0.5);
  transition: box-shadow 0.3s ease;
}

.shadow-glow-strong {
  box-shadow: 0 0 15px 5px rgba(var(--glow-color, 74, 222, 128), 0.7);
}

/* Animated background elements */
.animate-slide-right {
  animation: slide-right 15s linear infinite;
}

.animate-slide-left {
  animation: slide-left 15s linear infinite;
}

.animate-slide-up {
  animation: slide-up 15s linear infinite;
}

.animate-slide-down {
  animation: slide-down 15s linear infinite;
}

@keyframes slide-right {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes slide-left {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

@keyframes slide-up {
  0% { transform: translateY(100%); }
  100% { transform: translateY(-100%); }
}

@keyframes slide-down {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}
</style>
