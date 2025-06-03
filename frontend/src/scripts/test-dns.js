// Test DNS resolution for Supabase
import { testSupabaseConnection } from '../utils/supabaseUtils';
import { diagnoseNetworkIssues } from '../utils/networkDiagnostic';

/**
 * Run comprehensive connection tests
 */
async function runTests() {
  console.log('Testing Supabase connection...');
  
  try {
    const supResult = await testSupabaseConnection();
    console.log('Supabase connection test result:', supResult);
    
    console.log('\nRunning network diagnostics...');
    const diagResult = await diagnoseNetworkIssues();
    console.log('Network diagnostics result:', diagResult);
    
    if (!supResult.connected) {
      console.error('\nConnection failed:', supResult.message);
      console.error('Error type:', supResult.errorType);
      if (supResult.error) {
        console.error('Error details:', supResult.error);
      }
    } else {
      console.log('\nConnection successful!');
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the tests
runTests();
