<template>
  <div class="home-container">
    <!-- Hero section -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Discover Unique Camping Experiences</h1>
        <p class="hero-subtitle">Find perfect camping spots for your next outdoor adventure</p>
        <RouterLink to="/campers" class="hero-button">
          Browse Camping Spots
        </RouterLink>
      </div>
    </div>

    <!-- Features section -->
    <div class="features-section">
      <h2 class="section-title">Why Choose Our Platform?</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🏕️</div>
          <h3>Unique Locations</h3>
          <p>Discover handpicked camping spots you won't find anywhere else</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">💰</div>
          <h3>Best Prices</h3>
          <p>Find the perfect spot for your budget with transparent pricing</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔒</div>
          <h3>Secure Booking</h3>
          <p>Book with peace of mind using our secure payment system</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⭐</div>
          <h3>Verified Reviews</h3>
          <p>Read authentic reviews from fellow campers</p>
        </div>
      </div>
    </div>

    <!-- How it works section -->
    <div class="how-it-works-section">
      <h2 class="section-title">How It Works</h2>
      <div class="steps-container">
        <div class="step">
          <div class="step-number">1</div>
          <h3>Search</h3>
          <p>Find camping spots by location, dates, and amenities</p>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <h3>Book</h3>
          <p>Reserve your spot with our secure booking system</p>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <h3>Camp</h3>
          <p>Enjoy your outdoor adventure!</p>
        </div>
      </div>
    </div>

    <!-- CTA section -->
    <div class="cta-section">
      <h2>Ready to find your perfect camping spot?</h2>
      <RouterLink to="/campers" class="cta-button">
        Start Browsing Now
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.hero-section {
  background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/src/assets/hero-camping.jpg');
  background-size: cover;
  background-position: center;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
  border-radius: 10px;
  margin: 20px 0;
}

.hero-content {
  max-width: 800px;
  padding: 20px;
}

.hero-title {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: 1.25rem;
  margin-bottom: 2rem;
}

.hero-button {
  background-color: #e31c5f;
  color: white;
  padding: 12px 24px;
  border-radius: 30px;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.3s;
  display: inline-block;
}

.hero-button:hover {
  background-color: #d1174d;
}

.section-title {
  text-align: center;
  font-size: 2rem;
  margin: 3rem 0 2rem;
}

.features-section {
  margin: 4rem 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  background-color: #f8f8f8;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.how-it-works-section {
  margin: 4rem 0;
}

.steps-container {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 2rem;
}

.step {
  flex: 1;
  min-width: 200px;
  text-align: center;
  padding: 1.5rem;
}

.step-number {
  background-color: #e31c5f;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 auto 1rem;
}

.cta-section {
  background-color: #f8f8f8;
  padding: 4rem 2rem;
  text-align: center;
  border-radius: 10px;
  margin: 4rem 0;
}

.cta-button {
  background-color: #e31c5f;
  color: white;
  padding: 12px 24px;
  border-radius: 30px;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.3s;
  display: inline-block;
  margin-top: 1.5rem;
}

.cta-button:hover {
  background-color: #d1174d;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .steps-container {
    flex-direction: column;
  }
}
</style>
