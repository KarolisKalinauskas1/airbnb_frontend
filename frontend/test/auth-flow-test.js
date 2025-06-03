/**
 * Authentication Flow Test Script
 * 
 * This script can be used to simulate various authentication flows and test
 * the infinite loop protection measures. Run this in the browser console to test.
 */

// Configuration
const TEST_DELAY_MS = 500;
const MAX_REDIRECTS = 10;
const TEST_SOURCE_NAMES = ['component-a', 'component-b', 'axios', 'router-guard'];

// Import required utilities
const { navigateToAuth } = require('@/utils/routerNavigation');
const { 
  shouldBreakAuthLoop, 
  resetAuthLoopCounter, 
  getAuthRedirectState 
} = require('@/utils/authLoopBreaker');

// Utility to wait between operations
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to create test promises
const createPromise = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

/**
 * Test the loop detection using multiple sources
 * This simulates different components triggering auth redirects
 */
async function testMultiSourceDetection() {
  console.log('==== Testing Multi-Source Loop Detection ====');
  
  // Reset counters first
  resetAuthLoopCounter();
  console.log('Initial state:', getAuthRedirectState());
  
  // Trigger redirects from different sources
  for (let i = 0; i < 5; i++) {
    const randomSource = TEST_SOURCE_NAMES[Math.floor(Math.random() * TEST_SOURCE_NAMES.length)];
    console.log(`Triggering redirect #${i+1} from source: ${randomSource}`);
    
    // Call shouldBreakAuthLoop but don't actually navigate
    const shouldBreak = shouldBreakAuthLoop(randomSource);
    
    if (shouldBreak) {
      console.log(`🛑 Loop detected after ${i+1} redirects!`);
      console.log('Final state:', getAuthRedirectState());
      return;
    }
    
    await wait(TEST_DELAY_MS);
  }
  
  console.log('✅ Test completed without detecting loop');
  console.log('Final state:', getAuthRedirectState());
}

/**
 * Test rapid redirects from the same source
 */
async function testRapidRedirects() {
  console.log('==== Testing Rapid Redirects from Same Source ====');
  
  // Reset counters first
  resetAuthLoopCounter();
  console.log('Initial state:', getAuthRedirectState());
  
  // Trigger redirects from the same source in quick succession
  for (let i = 0; i < 5; i++) {
    const source = 'rapid-redirect-test';
    console.log(`Triggering rapid redirect #${i+1} from source: ${source}`);
    
    // Call shouldBreakAuthLoop but don't actually navigate
    const shouldBreak = shouldBreakAuthLoop(source);
    
    if (shouldBreak) {
      console.log(`🛑 Loop detected after ${i+1} rapid redirects!`);
      console.log('Final state:', getAuthRedirectState());
      return;
    }
    
    // Very short delay to test rapid redirects
    await wait(100);
  }
  
  console.log('✅ Test completed without detecting loop');
  console.log('Final state:', getAuthRedirectState());
}

/**
 * Test the URL parameter accumulation prevention
 */
async function testUrlParameterCleaning() {
  console.log('==== Testing URL Parameter Cleaning ====');
  
  // Create a test URL with accumulated parameters
  const dirtyUrl = '/auth?redirect=%2Fbooking%2Fcreate%2F123&booking=%7B%22start%22%3A%222023-05-01%22%7D&redirect=%2Fbooking%2Fcreate%2F123&timestamp=1621234567890';
  
  // Parse and clean the URL
  const url = new URL(dirtyUrl, window.location.origin);
  
  // Print before state
  console.log('Before cleaning:', url.toString());
  
  // Get unique parameter keys
  const paramKeys = new Set();
  for (const [key] of url.searchParams.entries()) {
    paramKeys.add(key);
  }
  
  // Clean the URL by keeping only the first occurrence of each parameter
  const cleanParams = new URLSearchParams();
  for (const key of paramKeys) {
    cleanParams.append(key, url.searchParams.get(key));
  }
  
  // Replace search params
  url.search = cleanParams.toString();
  
  // Print after state
  console.log('After cleaning:', url.toString());
  
  return url.toString();
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('==== Running All Authentication Flow Tests ====');
  
  try {
    await testMultiSourceDetection();
    console.log('---------------');
    
    await wait(1000);
    await testRapidRedirects();
    console.log('---------------');
    
    await wait(1000);
    const cleanedUrl = await testUrlParameterCleaning();
    console.log('Cleaned URL:', cleanedUrl);
    
    console.log('==== All Tests Completed ====');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Export functions for browser console testing
window.authFlowTest = {
  testMultiSourceDetection,
  testRapidRedirects,
  testUrlParameterCleaning,
  runAllTests,
  resetAuthLoopCounter,
  getAuthRedirectState
};

console.log('Auth Flow Test Script loaded. Run window.authFlowTest.runAllTests() to test authentication flow protection.');
