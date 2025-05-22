// This patch checks if we have a proper URL response and redirects
// It's designed to fix the "Invalid response from server" error in CampingSpotDetail.vue
(function() {
  console.log('Booking API response patch loaded');
  
  // Store the original fetch method
  const originalFetch = window.fetch;
  
  // Override fetch to intercept Stripe checkout responses
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    // Clone the response so we can both read it and return it
    const clone = response.clone();
    
    try {
      // Only process API requests related to checkout
      if (args[0] && 
          (args[0].includes('/api/checkout/create-session') || 
           args[0].includes('/api/bookings/create-checkout-session'))) {
        
        console.log('Intercepted checkout API response');
        
        // Get the response JSON
        const data = await clone.json();
        
        // If we have a URL in the response, log it and redirect
        if (data && data.url) {
          console.log('Found valid Stripe URL:', data.url);
          
          // Additional validation
          if (data.url.startsWith('https://checkout.stripe.com/')) {
            console.log('Valid Stripe URL detected, redirecting...');
            window.location.href = data.url;
            
            // Create a modified response to avoid the error in the frontend
            return new Response(JSON.stringify({ 
              url: data.url,
              redirected: true,
              status: 'success'
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in fetch interceptor:', error);
    }
    
    return response;
  };
})();
