<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isOwner = computed(() => authStore.isOwner)

const features = [
  {
    icon: '🏕️',
    title: 'Unique Locations',
    description: 'Discover handpicked camping spots you won\'t find anywhere else'
  },
  {
    icon: '💰',
    title: 'Best Prices',
    description: 'Find the perfect spot for your budget with transparent pricing'
  },
  {
    icon: '🔒',
    title: 'Secure Booking',
    description: 'Book with peace of mind using our secure payment system'
  },
  {
    icon: '⭐',
    title: 'Verified Reviews',
    description: 'Read authentic reviews from fellow campers'
  }
]

const steps = [
  {
    number: 1,
    title: 'Search',
    description: 'Find camping spots by location, dates, and amenities'
  },
  {
    number: 2,
    title: 'Book',
    description: 'Reserve your spot with our secure booking system'
  },
  {
    number: 3,
    title: 'Camp',
    description: 'Enjoy your outdoor adventure!'
  }
]

const handleExplore = () => {
  if (isOwner.value) {
    router.push('/dashboard')
  } else {
    router.push('/spots')
  }
}

onMounted(async () => {
  if (authStore.isLoggedIn && !authStore.fullUser) {
    try {
      await authStore.fetchFullUserInfo(true)
    } catch (error) {
      console.error('Error fetching user info:', error)
    }
  }
})
</script>

<template>
  <div class="home-container">
    <!-- Hero section -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Discover Unique Camping Experiences</h1>
        <p class="hero-subtitle">Find perfect camping spots for your next outdoor adventure</p>
        <button 
          @click="handleExplore" 
          class="bg-red-600 hover:bg-red-700 text-white py-3 px-8 rounded-full text-lg shadow-lg transform transition hover:-translate-y-1">
          {{ isOwner ? 'Go to Dashboard' : 'Explore Camping Spots' }}
        </button>
      </div>
    </div>

    <!-- Features section -->
    <div class="features-section">
      <h2 class="section-title">Why Choose Our Platform?</h2>
      <div class="features-grid">
        <div v-for="feature in features" :key="feature.title" class="feature-card">
          <div class="feature-icon">{{ feature.icon }}</div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </div>
      </div>
    </div>

    <!-- How it works section -->
    <div class="how-it-works-section">
      <h2 class="section-title">How It Works</h2>
      <div class="steps-container">
        <div v-for="step in steps" :key="step.number" class="step">
          <div class="step-number">{{ step.number }}</div>
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </div>
      </div>
    </div>

    <!-- CTA section -->
    <div class="cta-section">
      <h2>Ready to find your perfect camping spot?</h2>
      <button 
        @click="handleExplore" 
        class="bg-red-600 hover:bg-red-700 text-white py-3 px-8 rounded-full text-lg shadow-lg transform transition hover:-translate-y-1">
        {{ isOwner ? 'Go to Dashboard' : 'Explore Camping Spots' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
:root {
  --primary-color: #2c3e50;
  --secondary-color: #42b983;
  --text-color: #333;
  --background-light: #f8f9fa;
  --card-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --spacing-unit: 1rem;
  --border-radius: 8px;
}

.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-unit);
}

.hero-section {
  text-align: center;
  padding: calc(var(--spacing-unit) * 4) var(--spacing-unit);
  background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('@/assets/hero-bg.jpg');
  background-size: cover;
  background-position: center;
  color: white;
  border-radius: var(--border-radius);
  margin-bottom: calc(var(--spacing-unit) * 3);
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  margin-bottom: calc(var(--spacing-unit) * 2);
}

.hero-subtitle {
  font-size: clamp(1rem, 3vw, 1.5rem);
  margin-bottom: calc(var(--spacing-unit) * 2);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.section-title {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: calc(var(--spacing-unit) * 3);
  font-size: clamp(1.5rem, 4vw, 2.5rem);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: calc(var(--spacing-unit) * 2);
  margin-bottom: calc(var(--spacing-unit) * 4);
}

.feature-card {
  background: var(--background-light);
  padding: calc(var(--spacing-unit) * 2);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-unit);
}

.steps-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: calc(var(--spacing-unit) * 2);
  margin-bottom: calc(var(--spacing-unit) * 4);
}

.step {
  text-align: center;
  padding: calc(var(--spacing-unit) * 2);
}

.step-number {
  width: 40px;
  height: 40px;
  background: var(--secondary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-unit);
  font-weight: bold;
}

.cta-section {
  text-align: center;
  padding: calc(var(--spacing-unit) * 4) var(--spacing-unit);
  background: var(--background-light);
  border-radius: var(--border-radius);
}

.btn {
  display: inline-block;
  padding: calc(var(--spacing-unit) * 0.75) calc(var(--spacing-unit) * 1.5);
  border-radius: var(--border-radius);
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-primary {
  background: var(--secondary-color);
  color: white;
}

.btn-primary:hover {
  background: color-mix(in srgb, var(--secondary-color) 80%, black);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .home {
    padding: calc(var(--spacing-unit) * 0.5);
  }
  
  .hero-section {
    padding: calc(var(--spacing-unit) * 2) var(--spacing-unit);
  }
  
  .features-grid,
  .steps-container {
    gap: var(--spacing-unit);
  }
}
</style>
