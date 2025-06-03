/**
 * Test script to verify the correct Supabase URL is being used
 */

// Get URL and keys from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('=== Supabase Configuration Check ===');
console.log('Current Supabase URL:', supabaseUrl);
console.log('Expected URL: https://qbhrwpgejrhbfesbomuo.supabase.co');

if (supabaseUrl === 'https://qbhrwpgejrhbfesbomuo.supabase.co') {
  console.log('✅ SUCCESS: Supabase URL is correct');
} else {
  console.error('❌ ERROR: Supabase URL is incorrect!');
  console.error('Current:', supabaseUrl);
  console.error('Expected: https://qbhrwpgejrhbfesbomuo.supabase.co');
  
  // Log location where URL might be misconfigured
  console.log('\nCheck these configuration locations:');
  console.log('- .env file');
  console.log('- .env.local file');
  console.log('- .env.production file');
  console.log('- Environment variables');
  console.log('- Hardcoded fallbacks in utility files');
}

console.log('\n=== Anon Key Check ===');
if (!supabaseAnonKey) {
  console.error('❌ ERROR: No Supabase Anonymous Key found!');
} else if (supabaseAnonKey.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
  console.log('✅ SUCCESS: Anon key format looks valid');
} else {
  console.error('❌ ERROR: Supabase Anonymous Key appears to be in an incorrect format');
}

// Export for use if needed
export { supabaseUrl, supabaseAnonKey };
