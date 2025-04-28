<template>
  <footer class="bg-gray-800 text-white py-8">
    <div class="container mx-auto px-4">
      <div class="flex flex-wrap justify-between">
        <!-- About Section -->
        <div class="w-full md:w-1/3 mb-6 md:mb-0">
          <h3 class="text-lg font-semibold mb-4">About CampingSpot</h3>
          <p class="text-gray-300 text-sm">
            CampingSpot connects outdoor enthusiasts with unique camping locations across the country.
            Discover the perfect spot for your next adventure.
          </p>
        </div>
        
        <!-- Links Section -->
        <div class="w-full md:w-1/3 mb-6 md:mb-0">
          <h3 class="text-lg font-semibold mb-4">Quick Links</h3>
          <ul class="space-y-2">
            <li>
              <RouterLink to="/campers" class="text-gray-300 hover:text-white text-sm">Find Camping Spots</RouterLink>
            </li>
            <li>
              <RouterLink to="/auth" class="text-gray-300 hover:text-white text-sm">Login / Register</RouterLink>
            </li>
            <li>
              <a href="#" class="text-gray-300 hover:text-white text-sm">Help Center</a>
            </li>
            <li>
              <RouterLink to="/network-diagnostics" class="text-gray-300 hover:text-white text-sm">Network Status</RouterLink>
            </li>
          </ul>
        </div>
        
        <!-- Contact Section -->
        <div class="w-full md:w-1/3">
          <h3 class="text-lg font-semibold mb-4">Contact Us</h3>
          <address class="text-gray-300 text-sm not-italic">
            <p>Email: support@campingspot.com</p>
            <p>Phone: +1 (555) 123-4567</p>
            <p>Address: 123 Campsite Avenue, Outdoorsy, CA 90210</p>
          </address>
        </div>
      </div>
      
      <!-- Copyright & Social Links -->
      <div class="mt-8 pt-6 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center">
        <p class="text-sm text-gray-400">&copy; 2023 CampingSpot. All rights reserved.</p>
        
        <div class="flex space-x-4 mt-4 md:mt-0">
          <a href="#" class="text-gray-400 hover:text-white">
            <span class="sr-only">Facebook</span>
            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
            </svg>
          </a>
          <a href="#" class="text-gray-400 hover:text-white">
            <span class="sr-only">Instagram</span>
            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465.668.25 1.235.6 1.8 1.165.565.566.916 1.132 1.166 1.8.247.636.416 1.363.465 2.427.048 1.024.06 1.379.06 3.808 0 2.43-.013 2.784-.06 3.808-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.166 1.8c-.565.566-1.132.916-1.8 1.166-.636.247-1.363.416-2.427.465-1.024.048-1.379.06-3.808.06-2.43 0-2.784-.013-3.808-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.8-1.166 4.902 4.902 0 01-1.166-1.8c-.247-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.379-.06-3.808 0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.166-1.8 4.902 4.902 0 011.8-1.166c.636-.247 1.363-.416 2.427-.465 1.024-.048 1.379-.06 3.808-.06z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </a>
          <a href="#" class="text-gray-400 hover:text-white">
            <span class="sr-only">Twitter</span>
            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
// No complex logic needed for the footer
</script>
