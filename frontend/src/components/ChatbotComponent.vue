<template>
  <div class="chatbot-container" :class="{ 'minimized': isMinimized }">
    <div v-if="!isMinimized" class="chatbot-header">
      <div class="chatbot-header-content">
        <div class="chatbot-avatar">
          <img :src="avatarUrl" alt="Chatbot" onerror="this.src='https://raw.githubusercontent.com/tailwindlabs/heroicons/master/optimized/solid/chat-bubble-left-right.svg'; this.onerror=null;" />
        </div>
        <h3 class="text-lg font-medium">Camping Spot Assistant</h3>
      </div>
      <button 
        @click="isMinimized = !isMinimized"
        class="minimize-button"
        aria-label="Minimize chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    
    <div v-if="!isMinimized" class="chatbot-body">
      <div class="messages-container" ref="messagesContainer">
        <div 
          v-for="(message, index) in messages" 
          :key="index" 
          :class="['message', message.sender === 'bot' ? 'bot-message' : 'user-message']"
        >
          <div class="message-avatar" v-if="message.sender === 'bot'">
            <img :src="avatarUrl" alt="Chatbot" onerror="this.src='https://raw.githubusercontent.com/tailwindlabs/heroicons/master/optimized/solid/chat-bubble-left-right.svg'; this.onerror=null;" />
          </div>
          <div class="message-content">
            <p>{{ message.text }}</p>
            
            <!-- Display recommendations if available -->
            <div v-if="message.recommendations && message.recommendations.length > 0" class="recommendations">
              <div class="recommendations-heading">Recommended Camping Spots:</div>
              <div class="recommendations-list">
                <div 
                  v-for="spot in message.recommendations" 
                  :key="spot.id" 
                  class="recommendation-card"
                  @click="viewCampingSpot(spot.id)"
                >
                  <div class="recommendation-image" 
                    :style="spot.images && spot.images.length ? `background-image: url(${spot.images[0]})` : ''"
                  >
                    <div v-if="!spot.images || !spot.images.length" class="no-image">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div class="recommendation-details">
                    <h4 class="recommendation-title">{{ spot.title }}</h4>
                    <p class="recommendation-location">{{ spot.location.city }}, {{ spot.location.country }}</p>
                    <p class="recommendation-price">${{ spot.price }} per night</p>
                    <div class="recommendation-amenities">
                      <span v-for="(amenity, i) in spot.amenities.slice(0, 3)" :key="i" class="amenity-tag">
                        {{ amenity }}
                      </span>
                      <span v-if="spot.amenities.length > 3" class="amenity-more">
                        +{{ spot.amenities.length - 3 }} more
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="isLoading" class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      
      <div class="input-container">
        <input 
          type="text" 
          v-model="userInput" 
          @keyup.enter="sendMessage"
          placeholder="Ask about camping spots..."
          :disabled="isLoading"
          class="chatbot-input"
        />
        <button 
          @click="sendMessage" 
          :disabled="isLoading || !userInput.trim()"
          class="send-button"
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      
      <!-- Suggestions -->
      <div v-if="suggestions.length > 0 && messages.length <= 1" class="suggestions-container">
        <p class="text-sm text-gray-600 mb-2">Try asking:</p>
        <div class="suggestions-list">
          <button 
            v-for="(suggestion, index) in suggestions" 
            :key="index"
            @click="usesuggestion(suggestion)"
            class="suggestion-button"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Improved bubble design when minimized -->
    <div v-if="isMinimized" class="chatbot-bubble" @click="isMinimized = false" aria-label="Open chat assistant">
      <div class="bubble-icon">
        <img :src="avatarUrl" alt="Chatbot" onerror="this.src='https://raw.githubusercontent.com/tailwindlabs/heroicons/master/optimized/solid/chat-bubble-left-right.svg'; this.onerror=null;" />
      </div>
      <div class="bubble-indicator" v-if="messages.length > 1">
        {{ messages.length - 1 }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
// Import the SVG directly using Vite's asset handling
import chatbotAvatar from '/camping-chatbot-avatar.svg';

export default {
  name: 'ChatbotComponent',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const userInput = ref('');
    const messages = ref([]);
    const isLoading = ref(false);
    const isMinimized = ref(true); // Start minimized
    const messagesContainer = ref(null);
    const suggestions = ref([]);
    const apiError = ref(false);
    
    // Make chatbot avatar available to template
    const avatarUrl = chatbotAvatar;
    
    // Generate a simple unique ID for session tracking
    const generateUniqueId = () => {
      return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    };
    
    // Get or create a unique session ID for this conversation
    const sessionId = ref(localStorage.getItem('chatbotSessionId') || generateUniqueId());
    
    // Store session ID for future use
    localStorage.setItem('chatbotSessionId', sessionId.value);
    
    // Conversation state tracking
    const conversationState = ref('initial');
    
    // Track user preferences from chatbot interaction
    const userPreferences = reactive({
      dateRange: { startDate: null, endDate: null },
      location: null,
      guestCount: null,
      priceRange: { min: null, max: null },
      amenities: []
    });
    
    // Get the API URL from environment variables
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Create an axios instance with default config for chatbot API
    const chatbotApi = axios.create({
      baseURL: apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Get auth status
    const isAuthenticated = computed(() => authStore.isAuthenticated);

    // Add initial welcome message
    onMounted(() => {
      messages.value.push({
        text: "Hello! I'm your camping assistant. How can I help you find the perfect camping spot today?",
        sender: 'bot',
        timestamp: new Date()
      });
      
      // Fetch suggestions from the backend
      fetchSuggestions();
    });

    // Auto-scroll to bottom of messages when new ones are added
    watch(messages, () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      });
    }, { deep: true });

    // Get auth headers for API requests if user is authenticated
    const getAuthHeaders = () => {
      const headers = {};
      
      if (isAuthenticated.value && authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`;
      }
      
      return headers;
    };

    // Fetch chatbot suggestions
    const fetchSuggestions = async () => {
      try {
        apiError.value = false;
        const response = await chatbotApi.get('/api/chatbot/suggestions');
        suggestions.value = response.data.suggestions || [];
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        apiError.value = true;
        // Fallback suggestions if API request fails
        suggestions.value = [
          "Find me a camping spot near a lake",
          "I need a spot for 4 people with WiFi",
          "Looking for a camping spot under $50 per night",
          "Are there any spots with campfire allowed?",
          "Show me spots with hiking trails nearby",
          "Pet-friendly camping spots"
        ];
      }
    };

    // Use a suggestion
    const usesuggestion = (suggestion) => {
      userInput.value = suggestion;
      sendMessage();
    };

    // Send message to chatbot
    const sendMessage = async () => {
      const message = userInput.value.trim();
      if (!message || isLoading.value) return;

      // Add user message to chat
      messages.value.push({
        text: message,
        sender: 'user',
        timestamp: new Date()
      });

      // Clear input
      userInput.value = '';
      
      // Show loading state
      isLoading.value = true;

      try {
        apiError.value = false;
        
        // Check for general information phrases first 
        const generalInfoRegex = /what is|how do|tell me about|explain|info on|general|basics|information about/i;
        const isGeneralInfoQuery = generalInfoRegex.test(message);
        
        // Prepare request data, including session ID and user preferences
        const requestData = {
          query: message,
          sessionId: sessionId.value,
          isGeneralInfoQuery: isGeneralInfoQuery, // Flag to backend that this is a general info query
          userPreferences: {
            priceRange: {
              min: userPreferences.priceRange.min !== null ? userPreferences.priceRange.min : undefined,
              max: userPreferences.priceRange.max !== null ? userPreferences.priceRange.max : undefined
            },
            guestCount: userPreferences.guestCount !== null ? userPreferences.guestCount : undefined,
            location: userPreferences.location || undefined,
            amenities: userPreferences.amenities.length > 0 ? userPreferences.amenities : undefined,
            dateRange: {
              startDate: userPreferences.dateRange.startDate || undefined,
              endDate: userPreferences.dateRange.endDate || undefined
            }
          }
        };
        
        // Remove empty objects from requestData.userPreferences
        if (!requestData.userPreferences.dateRange.startDate && !requestData.userPreferences.dateRange.endDate) {
          delete requestData.userPreferences.dateRange;
        }
        if (requestData.userPreferences.priceRange.min === undefined && requestData.userPreferences.priceRange.max === undefined) {
          delete requestData.userPreferences.priceRange;
        }
        
        // Check if userPreferences is empty and remove it if so
        if (Object.keys(requestData.userPreferences).every(key => 
          requestData.userPreferences[key] === undefined || 
          (typeof requestData.userPreferences[key] === 'object' && Object.keys(requestData.userPreferences[key]).length === 0)
        )) {
          delete requestData.userPreferences;
        }
        
        // Send request to backend
        const response = await chatbotApi.post('/api/chatbot/query', requestData, {
          headers: getAuthHeaders()
        });

        // If this is a follow-up question
        if (response.data.isFollowUp) {
          // Update conversation state
          conversationState.value = response.data.conversationState;
          
          // Add bot response
          messages.value.push({
            text: response.data.message,
            sender: 'bot',
            timestamp: new Date(),
            isFollowUp: true
          });
          
          // Update preferences if provided
          if (response.data.extractedPreferences) {
            Object.assign(userPreferences, response.data.extractedPreferences);
          }
          
          // We're done with this interaction
          return;
        }
        
        // Check if this is an FAQ response
        if (response.data.isFaq) {
          messages.value.push({
            text: response.data.message,
            sender: 'bot',
            timestamp: new Date(),
            isFaq: true,
            faqQuestion: response.data.faqQuestion
          });
          return;
        }
        
        // Extract data from response for recommendation
        const { message: responseMessage, recommendations, extractedPreferences } = response.data;

        // Update user preferences with extracted ones
        if (extractedPreferences) {
          Object.assign(userPreferences, extractedPreferences);
        }

        // Add bot response
        messages.value.push({
          text: responseMessage,
          sender: 'bot',
          timestamp: new Date(),
          recommendations: recommendations || []
        });
        
      } catch (error) {
        console.error('Chatbot error:', error);
        apiError.value = true;
        
        let errorMessage = "I'm sorry, I couldn't process your request. Please try again.";
        
        if (error.response) {
          if (error.response.status === 400) {
            // Show a more helpful message for bad request errors - likely missing required fields
            errorMessage = "I understand you're asking about camping, but I don't have all the information I need. Would you like to ask a general question, or would you like me to help you find a specific camping spot?";
          } else if (error.response.status === 401) {
            errorMessage = "This feature requires logging in. Would you like to sign in to access all features?";
          } else if (error.response.status === 503) {
            errorMessage = "Our service is temporarily unavailable. Please try again later.";
          }
        } else if (error.request) {
          errorMessage = "I couldn't connect to our servers. Please check your internet connection.";
        }
        
        // Add error message
        messages.value.push({
          text: errorMessage,
          sender: 'bot',
          timestamp: new Date(),
          isError: true
        });
      } finally {
        isLoading.value = false;
      }
    };

    // Show current preferences
    const showCurrentPreferences = () => {
      let preferencesText = "Your current preferences: ";
      const preferences = [];
      
      if (userPreferences.dateRange.startDate) {
        preferences.push(`dates from ${userPreferences.dateRange.startDate} to ${userPreferences.dateRange.endDate}`);
      }
      
      if (userPreferences.location) {
        preferences.push(`location near ${userPreferences.location}`);
      }
      
      if (userPreferences.guestCount) {
        preferences.push(`for ${userPreferences.guestCount} guests`);
      }
      
      if (userPreferences.priceRange.min !== null || userPreferences.priceRange.max !== null) {
        const priceDesc = userPreferences.priceRange.min !== null && userPreferences.priceRange.max !== null
          ? `between $${userPreferences.priceRange.min} and $${userPreferences.priceRange.max}`
          : userPreferences.priceRange.max !== null
            ? `under $${userPreferences.priceRange.max}`
            : `above $${userPreferences.priceRange.min}`;
        preferences.push(`price ${priceDesc} per night`);
      }
      
      if (userPreferences.amenities.length > 0) {
        preferences.push(`with ${userPreferences.amenities.join(', ')}`);
      }
      
      if (preferences.length === 0) {
        preferencesText += "None set yet. Tell me what you're looking for!";
      } else {
        preferencesText += preferences.join(', ');
      }
      
      // Add message to chat
      messages.value.push({
        text: preferencesText,
        sender: 'bot',
        timestamp: new Date()
      });
    };

    // Reset all preferences
    const resetPreferences = () => {
      Object.assign(userPreferences, {
        dateRange: { startDate: null, endDate: null },
        location: null,
        guestCount: null,
        priceRange: { min: null, max: null },
        amenities: []
      });
      
      // Add message to chat
      messages.value.push({
        text: "I've reset all your preferences. Let's start fresh! What kind of camping spot are you looking for?",
        sender: 'bot',
        timestamp: new Date()
      });
    };

    // Navigate to camping spot details
    const viewCampingSpot = (spotId) => {
      router.push(`/camper/${spotId}`);
    };

    return {
      userInput,
      messages,
      isLoading,
      isMinimized,
      messagesContainer,
      suggestions,
      apiError,
      isAuthenticated,
      conversationState,
      sendMessage,
      usesuggestion,
      viewCampingSpot,
      showCurrentPreferences,
      resetPreferences,
      avatarUrl
    };
  }
};
</script>

<style scoped>
.chatbot-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 350px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  z-index: 1000;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  max-height: 520px;
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.chatbot-container.minimized {
  width: auto;
  background-color: transparent;
  box-shadow: none;
  border: none;
}

.chatbot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #f43f5e, #ef4444);
  color: white;
}

.chatbot-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chatbot-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.chatbot-avatar img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.minimize-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
}

.minimize-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.minimize-button:active {
  transform: scale(0.95);
}

.chatbot-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f9fafb;
}

.messages-container {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 350px;
  scroll-behavior: smooth;
}

.message {
  display: flex;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  animation: messageAppear 0.4s forwards;
}

@keyframes messageAppear {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.bot-message {
  align-self: flex-start;
}

.user-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  margin-right: 10px;
  border-radius: 50%;
  background-color: white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-avatar img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.message-content {
  background-color: white;
  padding: 14px 18px;
  border-radius: 18px;
  max-width: 80%;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f1f1;
  line-height: 1.5;
  font-size: 15px;
}

.user-message .message-content {
  background: linear-gradient(135deg, #f43f5e, #ef4444);
  color: white;
  border: none;
  box-shadow: 0 3px 10px rgba(244, 63, 94, 0.2);
}

.input-container {
  display: flex;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background-color: white;
}

.chatbot-input {
  flex-grow: 1;
  padding: 14px 18px;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  outline: none;
  font-size: 15px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.chatbot-input:focus {
  border-color: #f43f5e;
  box-shadow: 0 3px 15px rgba(244, 63, 94, 0.15);
}

.send-button {
  margin-left: 12px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f43f5e, #ef4444);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  box-shadow: 0 3px 10px rgba(244, 63, 94, 0.3);
}

.send-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(244, 63, 94, 0.4);
}

.send-button:active {
  transform: translateY(-1px);
}

.send-button:disabled {
  background: #e5e7eb;
  transform: none;
  box-shadow: none;
  cursor: not-allowed;
}

/* Typing indicator */
.typing-indicator {
  display: flex;
  padding: 12px 16px;
  background-color: white;
  border-radius: 18px;
  width: fit-content;
  align-self: flex-start;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background-color: #f43f5e;
  border-radius: 50%;
  display: inline-block;
  margin: 0 3px;
  animation: bounce 1.3s linear infinite;
  opacity: 0.7;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

/* Recommendations styling */
.recommendations {
  margin-top: 14px;
  border-top: 1px solid rgba(229, 231, 235, 0.5);
  padding-top: 12px;
}

.recommendations-heading {
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 15px;
  color: #4b5563;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 5px;
}

.recommendation-card {
  display: flex;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(229, 231, 235, 0.7);
}

.recommendation-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  border-color: rgba(244, 63, 94, 0.3);
}

.recommendation-image {
  width: 90px;
  height: 90px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
}

.recommendation-details {
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.recommendation-title {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 4px;
  color: #111827;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recommendation-location {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.recommendation-price {
  font-weight: 600;
  font-size: 14px;
  color: #f43f5e;
  margin-bottom: 6px;
}

.recommendation-amenities {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.amenity-tag {
  font-size: 11px;
  background-color: #f9fafb;
  color: #6b7280;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.amenity-more {
  font-size: 11px;
  color: #6b7280;
  padding: 2px 6px;
}

/* Suggestions styling */
.suggestions-container {
  padding: 0 16px 16px;
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-button {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 8px 14px;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion-button:hover {
  background-color: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-2px);
}

/* Chatbot bubble (minimized state) */
.chatbot-bubble {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: linear-gradient(135deg, #f43f5e, #ef4444);
  box-shadow: 0 5px 20px rgba(244, 63, 94, 0.4);
  cursor: pointer;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.chatbot-bubble:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 25px rgba(244, 63, 94, 0.5);
}

.chatbot-bubble:active {
  transform: translateY(-1px) scale(0.95);
}

.bubble-icon {
  width: 32px;
  height: 32px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bubble-icon img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.bubble-indicator {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #1f2937;
  color: white;
  border-radius: 12px;
  min-width: 22px;
  height: 22px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  font-weight: 600;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .chatbot-container {
    width: 320px;
    bottom: 15px;
    right: 15px;
  }
}

@media (max-width: 480px) {
  .chatbot-container {
    width: calc(100% - 30px);
    max-width: 350px;
    bottom: 15px;
    right: 15px;
  }
  
  .message-content {
    max-width: 85%;
  }
}
</style>