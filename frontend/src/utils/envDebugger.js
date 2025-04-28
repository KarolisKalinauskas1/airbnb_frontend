/**
 * Environment Variables Debugger Tool
 * 
 * This utility helps debug issues with environment variables in the Vue app.
 * Import this file and call logEnvVariables() to see what environment variables
 * are available to the application.
 */

export function logEnvVariables() {
  console.group('Environment Variables Check');
  console.log('Mode:', import.meta.env.MODE);
  
  // Check for Supabase variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'Not set');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set (value hidden)' : 'Not set');
  
  // Check for API URL
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL || 'Not set');
  
  // Check if all required variables are present
  const hasRequiredVars = !!supabaseUrl && !!supabaseKey;
  console.log('All required environment variables present:', hasRequiredVars ? 'Yes ✅' : 'No ❌');
  
  console.groupEnd();
  
  return {
    hasRequiredVars,
    variables: {
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
      apiUrl: !!import.meta.env.VITE_API_URL
    }
  };
}

/**
 * Check a specific environment variable 
 */
export function checkEnvVariable(name) {
  const value = import.meta.env[name];
  console.log(`Environment variable ${name}: ${value ? 'Set ✅' : 'Not set ❌'}`);
  return !!value;
}
