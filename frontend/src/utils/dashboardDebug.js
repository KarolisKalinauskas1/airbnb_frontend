/**
 * Dashboard Debug Utility
 * Helps identify and fix infinite loading issues
 */

let requestCount = 0
let lastRequests = []
const MAX_REQUEST_HISTORY = 10

export function logDashboardRequest(type, details = {}) {
  requestCount++
  const timestamp = new Date().toISOString()
  
  const logEntry = {
    id: requestCount,
    type,
    timestamp,
    ...details
  }
  
  lastRequests.unshift(logEntry)
  if (lastRequests.length > MAX_REQUEST_HISTORY) {
    lastRequests.pop()
  }
  
  console.log(`[DASHBOARD DEBUG ${requestCount}] ${type}:`, logEntry)
  
  // Check for potential infinite loops
  if (requestCount > 5) {
    const recentRequests = lastRequests.slice(0, 5)
    const sameTypeRequests = recentRequests.filter(r => r.type === type)
    
    if (sameTypeRequests.length >= 3) {
      console.warn(`⚠️ Potential infinite loop detected: ${type} called ${sameTypeRequests.length} times recently`)
      console.warn('Recent requests:', recentRequests)
    }
  }
  
  return logEntry
}

export function getDashboardDebugInfo() {
  return {
    totalRequests: requestCount,
    recentRequests: lastRequests,
    timestamp: new Date().toISOString()
  }
}

export function resetDashboardDebug() {
  requestCount = 0
  lastRequests = []
  console.log('Dashboard debug info reset')
}

export function checkForInfiniteLoop() {
  const recentAnalyticsRequests = lastRequests
    .filter(r => r.type === 'analytics_request')
    .slice(0, 5)
  
  if (recentAnalyticsRequests.length >= 4) {
    const timeSpan = new Date(recentAnalyticsRequests[0].timestamp) - 
                    new Date(recentAnalyticsRequests[recentAnalyticsRequests.length - 1].timestamp)
    
    if (timeSpan < 10000) { // Less than 10 seconds
      console.error('🚨 INFINITE LOOP DETECTED: 4+ analytics requests in less than 10 seconds')
      console.error('Recent requests:', recentAnalyticsRequests)
      return true
    }
  }
  
  return false
}
