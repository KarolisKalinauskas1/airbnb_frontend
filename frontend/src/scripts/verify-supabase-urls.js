/**
 * Verification script for Supabase URL update
 * Run this script to verify the Supabase URL has been updated correctly
 */

import { createClient } from '@supabase/supabase-js';

const EXPECTED_URL = 'https://qbhrwpgejrhbfesbomuo.supabase.co';
const OLD_URL = 'https://kyxmgifuawpoiocyuexh.supabase.co';

// Helper function to check a URL
async function checkUrl(url) {
  console.log(`\nTesting URL: ${url}`);
  
  try {
    // First test DNS resolution with a simple fetch
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const fetchResponse = await fetch(`${url}/`, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('✅ URL is reachable (DNS resolution works)');
      
    } catch (fetchError) {
      console.error('❌ URL is not reachable:', fetchError.message);
      if (fetchError.message.includes('ERR_NAME_NOT_RESOLVED')) {
        console.error('   DNS resolution failed - domain may not exist');
      }
      return false;
    }
    
    // Try a basic Supabase operation (without auth)
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!anonKey) {
      console.warn('⚠️ No Supabase anon key available - skipping API check');
      return true;
    }
    
    const supabase = createClient(url, anonKey);
    
    // Simple health check that doesn't require authentication
    const startTime = Date.now();
    const { error } = await supabase.auth.getSession();
    const endTime = Date.now();
    
    if (error && error.message !== 'Invalid session') {
      console.error('❌ Supabase API error:', error.message);
      return false;
    }
    
    console.log(`✅ Supabase API responded in ${endTime - startTime}ms`);
    return true;
    
  } catch (error) {
    console.error('❌ Error testing URL:', error.message);
    return false;
  }
}

// Run tests
async function verifyUrls() {
  console.log('=== SUPABASE URL VERIFICATION ===');
  
  // Check environment configuration
  const configuredUrl = import.meta.env.VITE_SUPABASE_URL || 'Not configured';
  console.log(`Configured URL: ${configuredUrl}`);
  console.log(`Expected URL:   ${EXPECTED_URL}`);
  
  if (configuredUrl !== EXPECTED_URL) {
    console.error('❌ Configuration mismatch - URLs do not match!');
  } else {
    console.log('✅ Configuration OK - URL matches expected value');
  }
  
  // Test the expected URL
  const newUrlWorks = await checkUrl(EXPECTED_URL);
  
  // Test the old URL (should fail)
  const oldUrlWorks = await checkUrl(OLD_URL);
  
  // Analyze results
  console.log('\n=== VERIFICATION RESULTS ===');
  if (newUrlWorks && !oldUrlWorks) {
    console.log('✅ PASS: New URL works and old URL fails as expected');
  } else if (newUrlWorks && oldUrlWorks) {
    console.warn('⚠️ WARNING: Both URLs work - this is unexpected');
  } else if (!newUrlWorks && oldUrlWorks) {
    console.error('❌ CRITICAL FAILURE: Old URL works but new URL fails!');
  } else {
    console.error('❌ FAILURE: Neither URL works');
  }
}

verifyUrls().catch(console.error);
