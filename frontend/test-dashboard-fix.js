/**
 * Test Dashboard Fix - Verification Script
 * This script tests that the infinite loop fixes are working correctly
 */

// Configuration
const TEST_TIMEOUT = 30000; // 30 seconds
const MAX_REQUEST_COUNT = 10; // Should not exceed this many requests

class DashboardFixTester {
  constructor() {
    this.requestCount = 0;
    this.requests = [];
    this.startTime = Date.now();
    this.originalFetch = window.fetch;
    this.testResults = {
      infiniteLoopPrevented: false,
      maxRequestsRespected: false,
      authErrorsHandled: false,
      retryLogicWorking: false
    };
  }

  // Mock fetch to track requests
  setupRequestTracking() {
    const self = this;
    window.fetch = function(...args) {
      const url = args[0];
      const options = args[1] || {};
      
      // Track analytics requests specifically
      if (url.includes('/api/dashboard/analytics')) {
        self.requestCount++;
        self.requests.push({
          timestamp: Date.now(),
          url: url,
          method: options.method || 'GET',
          headers: options.headers || {}
        });
        
        console.log(`🔍 Analytics Request #${self.requestCount}:`, {
          url,
          timestamp: new Date().toISOString(),
          totalRequests: self.requestCount
        });
        
        // Prevent infinite loops by failing after too many requests
        if (self.requestCount > MAX_REQUEST_COUNT) {
          console.error('❌ Too many requests detected! Infinite loop prevention failed.');
          return Promise.reject(new Error('Too many requests - infinite loop detected'));
        }
      }
      
      return self.originalFetch.apply(this, args);
    };
  }

  // Restore original fetch
  cleanup() {
    window.fetch = this.originalFetch;
  }

  // Analyze request patterns
  analyzeRequests() {
    const analyticsRequests = this.requests.filter(r => r.url.includes('/api/dashboard/analytics'));
    
    console.log('\n📊 Request Analysis:');
    console.log(`Total Analytics Requests: ${analyticsRequests.length}`);
    console.log(`Time Window: ${(Date.now() - this.startTime) / 1000}s`);
    
    if (analyticsRequests.length > 0) {
      const intervals = [];
      for (let i = 1; i < analyticsRequests.length; i++) {
        intervals.push(analyticsRequests[i].timestamp - analyticsRequests[i-1].timestamp);
      }
      
      if (intervals.length > 0) {
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        console.log(`Average Interval Between Requests: ${avgInterval}ms`);
        
        // Check for rapid fire requests (less than 1 second apart)
        const rapidRequests = intervals.filter(interval => interval < 1000).length;
        console.log(`Rapid Requests (< 1s apart): ${rapidRequests}`);
        
        this.testResults.infiniteLoopPrevented = analyticsRequests.length <= MAX_REQUEST_COUNT;
        this.testResults.maxRequestsRespected = rapidRequests < 3; // Allow some rapid requests but not many
      }
    }
    
    return this.testResults;
  }

  // Test dashboard loading
  async testDashboardLoading() {
    console.log('🧪 Starting Dashboard Loading Test...');
    
    try {
      // Navigate to dashboard if not already there
      if (!window.location.pathname.includes('/dashboard')) {
        console.log('📍 Navigating to dashboard...');
        window.location.href = '/dashboard';
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for navigation
      }
      
      // Wait for any authentication and initial loading
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check if we can find dashboard elements
      const dashboardElements = document.querySelectorAll('.dashboard-view, .dashboard-content, .loading, .error');
      console.log(`📋 Dashboard elements found: ${dashboardElements.length}`);
      
      // Check for error states
      const errorElements = document.querySelectorAll('.error, [class*="error"]');
      if (errorElements.length > 0) {
        console.log('⚠️ Error elements detected:', errorElements.length);
        errorElements.forEach((el, i) => {
          console.log(`Error ${i + 1}:`, el.textContent.trim());
        });
      }
      
      // Check for loading states that persist too long
      setTimeout(() => {
        const stillLoading = document.querySelectorAll('.loading, .spinner');
        if (stillLoading.length > 0) {
          console.log('⚠️ Still loading after extended time:', stillLoading.length);
        }
      }, 10000);
      
      this.testResults.authErrorsHandled = errorElements.length === 0;
      
    } catch (error) {
      console.error('❌ Dashboard loading test failed:', error);
    }
  }

  // Run all tests
  async runTests() {
    console.log('🚀 Starting Dashboard Fix Verification Tests');
    console.log('='.repeat(50));
    
    this.setupRequestTracking();
    
    try {
      await this.testDashboardLoading();
      
      // Wait for additional requests to complete
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const results = this.analyzeRequests();
      
      console.log('\n🎯 Test Results:');
      console.log('='.repeat(30));
      console.log(`✅ Infinite Loop Prevented: ${results.infiniteLoopPrevented}`);
      console.log(`✅ Max Requests Respected: ${results.maxRequestsRespected}`);
      console.log(`✅ Auth Errors Handled: ${results.authErrorsHandled}`);
      
      const allTestsPassed = Object.values(results).every(result => result === true);
      
      if (allTestsPassed) {
        console.log('\n🎉 ALL TESTS PASSED - Dashboard fixes are working correctly!');
      } else {
        console.log('\n⚠️ SOME TESTS FAILED - Review the issues above');
      }
      
      return results;
      
    } finally {
      this.cleanup();
    }
  }

  // Manual test trigger
  static async runManualTest() {
    const tester = new DashboardFixTester();
    return await tester.runTests();
  }
}

// Export for use in browser console
window.DashboardFixTester = DashboardFixTester;

// Instructions for manual testing
console.log(`
🔧 Dashboard Fix Test Suite Ready!

To run tests manually in browser console:
1. Navigate to: http://localhost:5174/dashboard
2. Run: DashboardFixTester.runManualTest()
3. Check console output for results

Expected behavior:
- No infinite loop of requests to /api/dashboard/analytics
- Proper error handling for 401/429 errors
- Maximum ${MAX_REQUEST_COUNT} analytics requests
- No stuck loading states
`);

export default DashboardFixTester;
