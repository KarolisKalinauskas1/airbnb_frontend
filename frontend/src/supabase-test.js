/**
 * Supabase Connection Test Script
 * This script will test connectivity to Supabase and identify potential issues.
 * Run with: node supabase-test.js
 */

// Import required modules
import { createClient } from '@supabase/supabase-js'
import dns from 'dns'
import fetch from 'node-fetch'

// Utility functions for testing network connectivity
async function checkDns(hostname) {
  return new Promise((resolve) => {
    dns.lookup(hostname, (err, address) => {
      if (err) {
        console.log(`DNS lookup for ${hostname} failed:`, err.code)
        resolve({ success: false, error: err.code })
      } else {
        console.log(`DNS lookup for ${hostname} resolved to:`, address)
        resolve({ success: true, address })
      }
    })
  })
}

async function checkHttps(url) {
  try {
    console.log(`Testing HTTPS connection to ${url}...`)
    const response = await fetch(url, { 
      method: 'GET',
      timeout: 5000 
    })
    console.log(`HTTPS connection to ${url}: Status ${response.status}`)
    return { success: response.ok, status: response.status }
  } catch (error) {
    console.log(`HTTPS connection to ${url} failed:`, error.message)
    return { success: false, error: error.message }
  }
}

async function testAuth(supabase) {
  try {
    console.log('Testing Supabase authentication API...')
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.log('Supabase auth test failed:', error.message)
      return { success: false, error: error.message }
    }
    console.log('Supabase auth test succeeded!')
    return { success: true }
  } catch (err) {
    console.log('Supabase auth test exception:', err.message)
    return { success: false, error: err.message }
  }
}

// Load environment variables from the command line or defaults
const supabaseUrl = process.argv[2] || process.env.VITE_SUPABASE_URL || 'https://qbhrwpgejrhbfesbomuo.supabase.co'
const supabaseKey = process.argv[3] || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// Main test function
async function runTests() {
  console.log('\n=== SUPABASE CONNECTION DIAGNOSTIC TOOL ===\n')
  console.log('Testing with the following configuration:')
  console.log('- Supabase URL:', supabaseUrl)
  console.log('- API Key:', supabaseKey ? `${supabaseKey.substring(0, 10)}...` : 'Not provided')
  
  // Extract hostname from URL
  const url = new URL(supabaseUrl)
  const hostname = url.hostname
  
  console.log('\n=== DNS TEST ===')
  const dnsResult = await checkDns(hostname)
  
  console.log('\n=== HTTPS CONNECTION TEST ===')
  const httpsResult = await checkHttps(supabaseUrl)
  
  // Only test Supabase if DNS and HTTPS are working
  if (dnsResult.success && httpsResult.success) {
    console.log('\n=== SUPABASE AUTH TEST ===')
    const supabase = createClient(supabaseUrl, supabaseKey)
    await testAuth(supabase)
  }
  
  console.log('\n=== SUMMARY ===')
  console.log('DNS Resolution:', dnsResult.success ? '✅ WORKING' : '❌ FAILED')
  console.log('HTTPS Connection:', httpsResult.success ? '✅ WORKING' : '❌ FAILED')
  
  console.log('\n=== RECOMMENDATIONS ===')
  if (!dnsResult.success) {
    console.log('- DNS resolution failed. This might indicate:')
    console.log('  1. Network connectivity issues')
    console.log('  2. DNS server problems')
    console.log('  3. Incorrect Supabase URL')
    console.log('\nTry the following:')
    console.log('- Check your internet connection')
    console.log('- Try using a different DNS server (e.g., 8.8.8.8 or 1.1.1.1)')
    console.log('- Verify that the Supabase URL is correct')
    console.log('- If using a VPN, try disabling it')
  } else if (!httpsResult.success) {
    console.log('- HTTPS connection failed. This might indicate:')
    console.log('  1. Network blocking of Supabase')
    console.log('  2. SSL/TLS issues')
    console.log('  3. Supabase service might be down')
    console.log('\nTry the following:')
    console.log('- Check if your network blocks external API connections')
    console.log('- Update your SSL certificates')
    console.log('- Check Supabase status page')
  }
}

runTests().catch(err => {
  console.error('Test script error:', err)
  process.exit(1)
})
