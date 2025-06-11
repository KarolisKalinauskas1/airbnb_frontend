/**
 * Dashboard Debug Helper
 * Run this in the browser console to debug dashboard loading issues
 */

window.debugDashboard = {
  // Force reset the loading state
  resetLoading() {
    console.log('🔧 Forcing dashboard loading state reset...');
    
    // Try to find the Vue app instance and reset loading
    const app = document.querySelector('#app');
    if (app && app.__vue__) {
      const vue = app.__vue__;
      if (vue.$refs && vue.$refs.dashboard) {
        vue.$refs.dashboard.loading = false;
        console.log('✅ Reset loading via Vue ref');
      }
    }
    
    // Reset global loading tracker
    window.dashboardLoadingStartTime = null;
    
    // Try to reset Pinia store if available
    if (window.pinia) {
      try {
        const dashboardStore = window.pinia._s.get('dashboard');
        if (dashboardStore) {
          dashboardStore.loading = false;
          console.log('✅ Reset dashboard store loading state');
        }
      } catch (e) {
        console.log('❌ Could not access dashboard store:', e.message);
      }
    }
    
    console.log('🔧 Loading state reset complete. Try refreshing the dashboard now.');
  },
  
  // Check current loading state
  checkState() {
    console.log('🔍 Dashboard State Check:');
    console.log('- dashboardLoadingStartTime:', window.dashboardLoadingStartTime);
    console.log('- Time elapsed:', window.dashboardLoadingStartTime ? (Date.now() - window.dashboardLoadingStartTime) + 'ms' : 'Not loading');
    
    // Check for loading elements
    const loadingElements = document.querySelectorAll('.loading, .spinner, [class*="load"]');
    console.log('- Loading elements found:', loadingElements.length);
    loadingElements.forEach((el, i) => {
      console.log(`  ${i + 1}. ${el.className} - visible: ${el.offsetParent !== null}`);
    });
    
    // Check for error elements
    const errorElements = document.querySelectorAll('.error, [class*="error"]');
    console.log('- Error elements found:', errorElements.length);
    errorElements.forEach((el, i) => {
      const text = el.textContent?.trim();
      if (text) {
        console.log(`  ${i + 1}. ${text}`);
      }
    });
  },
  
  // Force reload dashboard data
  forceReload() {
    console.log('🔄 Forcing dashboard reload...');
    window.location.reload();
  },
  
  // Clear all caches and reset everything
  fullReset() {
    console.log('🧹 Full dashboard reset...');
    
    // Clear localStorage dashboard data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('dashboard') || key.includes('analytics')) {
        localStorage.removeItem(key);
        console.log(`Cleared localStorage: ${key}`);
      }
    });
    
    // Reset loading state
    this.resetLoading();
    
    // Clear any intervals or timeouts
    for (let i = 1; i < 99999; i++) {
      clearTimeout(i);
      clearInterval(i);
    }
    
    console.log('🧹 Full reset complete. Reloading page...');
    setTimeout(() => window.location.reload(), 1000);
  }
};

console.log('🚀 Dashboard Debug Helper loaded!');
console.log('Available commands:');
console.log('- debugDashboard.resetLoading() - Reset loading state');
console.log('- debugDashboard.checkState() - Check current state');
console.log('- debugDashboard.forceReload() - Force page reload');
console.log('- debugDashboard.fullReset() - Clear everything and reload');
