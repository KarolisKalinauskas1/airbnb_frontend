/**
 * Simple Dashboard Loading Test
 * This script will help identify where exactly the dashboard loading is getting stuck
 */

console.log('🔍 Starting Dashboard Loading Investigation...');

// Check if we're on the right page
if (!window.location.pathname.includes('/dashboard')) {
  console.log('❌ Not on dashboard page. Navigate to /dashboard first.');
} else {
  console.log('✅ On dashboard page');

  // Check if Vue app is loaded
  if (!window.Vue && !document.querySelector('#app').__vue__) {
    console.log('❌ Vue app not detected');
  } else {
    console.log('✅ Vue app detected');
  }

  // Monitor network requests
  let requestCount = 0;
  const originalFetch = window.fetch;
  const originalXMLHttpRequest = window.XMLHttpRequest.prototype.open;

  // Intercept fetch requests
  window.fetch = function(...args) {
    requestCount++;
    const url = args[0];
    console.log(`📡 Request #${requestCount}: FETCH ${url}`);
    
    return originalFetch.apply(this, args)
      .then(response => {
        console.log(`📡 Response #${requestCount}: ${response.status} ${url}`);
        return response;
      })
      .catch(error => {
        console.log(`📡 Error #${requestCount}: ${error.message} ${url}`);
        throw error;
      });
  };

  // Intercept XMLHttpRequest
  window.XMLHttpRequest.prototype.open = function(method, url, ...args) {
    requestCount++;
    console.log(`📡 Request #${requestCount}: ${method} ${url}`);
    
    this.addEventListener('load', () => {
      console.log(`📡 Response #${requestCount}: ${this.status} ${method} ${url}`);
    });
    
    this.addEventListener('error', () => {
      console.log(`📡 Error #${requestCount}: ${method} ${url}`);
    });
    
    return originalXMLHttpRequest.call(this, method, url, ...args);
  };

  // Check for loading states every 2 seconds
  let checkCount = 0;
  const loadingChecker = setInterval(() => {
    checkCount++;
    console.log(`🔄 Loading Check #${checkCount}:`);
    
    // Check for loading spinners
    const spinners = document.querySelectorAll('.spinner, .loading, [class*="spin"], [class*="load"]');
    if (spinners.length > 0) {
      console.log(`  - Found ${spinners.length} loading indicator(s)`);
      spinners.forEach((spinner, i) => {
        console.log(`    ${i + 1}. ${spinner.className} in ${spinner.parentElement?.tagName || 'unknown'}`);
      });
    } else {
      console.log('  - No loading indicators found');
    }
    
    // Check for error messages
    const errors = document.querySelectorAll('.error, [class*="error"]');
    if (errors.length > 0) {
      console.log(`  - Found ${errors.length} error element(s)`);
      errors.forEach((error, i) => {
        const text = error.textContent?.trim();
        if (text) {
          console.log(`    ${i + 1}. Error: "${text}"`);
        }
      });
    }
    
    // Check dashboard content
    const dashboardContent = document.querySelector('.dashboard-content, .dashboard-view');
    if (dashboardContent) {
      console.log('  - Dashboard content element found');
    } else {
      console.log('  - No dashboard content element found');
    }
    
    // Stop after 30 seconds
    if (checkCount >= 15) {
      clearInterval(loadingChecker);
      console.log('🏁 Investigation complete. Check the logs above for issues.');
    }
  }, 2000);

  console.log('🔍 Investigation started. Monitor the console for 30 seconds...');
}
