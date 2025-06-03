# Authentication Loop Fix

## Overview

This document explains the comprehensive solution implemented to fix the infinite redirect loop issue occurring when non-logged-in users attempt to book a camping spot.

## Problem

When a non-logged-in user tried to book a camping spot, they were caught in an infinite authentication loop where:

1. Supabase auth continuously fired `SIGNED_OUT` events
2. Multiple competing components were handling redirects
3. URL parameters were accumulating with each redirect
4. Direct `window.location.href` navigations interfered with Vue Router's history management

## Solution

We implemented a multi-layered fix that provides defense in depth against authentication redirect loops:

### 1. AuthLoopBreaker Utility

Created an enhanced `authLoopBreaker.js` utility that:
- Tracks redirects in both short (10 second) and long (1 minute) time windows
- Records sources of redirects to help with debugging
- Implements configurable thresholds for breaking loops
- Provides proper cleanup and reset mechanisms

### 2. Consistent Navigation Pattern

Established a single source of truth for authentication redirects:
- Created `routerNavigation.js` utility that centralizes all auth redirections
- Integrated loop detection directly into the navigation flow
- Ensures Vue Router is used consistently for all redirections
- Provides fallback mechanisms in case of router errors

### 3. Storage Improvements for Booking State

Enhanced the booking state persistence with:
- Timestamp validation to prevent stale data
- Proper cleanup of localStorage after successful redirects
- Better error handling for malformed data
- Consistent approach for restoring booking state post-login

### 4. Auth Store Enhancements

Improved the authentication store to:
- Track and limit initialization frequency
- Use proper session management to avoid unnecessary refetching
- Implement anti-loop protection in the token refresh flow
- Provide clear logs for debugging authentication issues

### 5. Removed Direct Location Navigation

- Replaced all instances of `window.location.href` with Vue Router's `router.push()`
- Ensured proper history management for back/forward navigation
- Prevented URL parameter accumulation that caused browser crashes
- Added clean exception handling for navigation errors

## Key Files Changed

- `src/utils/authLoopBreaker.js`: Enhanced with time window monitoring and sources tracking
- `src/utils/routerNavigation.js`: New utility to centralize navigation logic
- `src/views/CampingSpotDetail.vue`: Updated booking flow to use router navigation
- `src/views/LoginView.vue`: Improved redirect handling and booking state restoration
- `src/axios-interceptors.js`: Updated to use consistent redirect approach
- `src/stores/auth.js`: Added anti-loop protection in initialization

## Testing Instructions

### Manual Testing

To verify the fix:

1. **Test Non-Authenticated Booking Flow**:
   - Log out completely
   - Navigate to any camping spot detail page
   - Select dates and attempt to book
   - Verify you're redirected to login page with no loop
   - Login and verify you're redirected back to complete booking

2. **Test Booking State Persistence**:
   - As a non-logged-in user, select specific dates and guest count
   - Click "Book Now" to be redirected to login
   - Log in and verify the dates and guest count are preserved
   - Complete the booking process

3. **Test Session Timeout Flow**:
   - Let your session expire (or manually remove the token)
   - Attempt to book a camping spot
   - Verify you're redirected to login without loops
   - Login and verify booking flow continues

4. **Test Loop Breaking**:
   - Uncomment the loop testing code in `CampingSpotDetail.vue` (see comments)
   - Verify that after 3 quick redirects, the loop breaks and shows error message
   - Check console for "Auth loop detected" message
   
5. **Test Multi-Source Loop Prevention**:
   - Attempt to trigger redirects from different components in quick succession
   - Verify the system identifies the loop regardless of which components trigger it
   - Confirm the source tracking in console logs shows all components involved

6. **Test External Redirects**:
   - Complete a booking flow through to Stripe checkout
   - Verify external redirects still work properly
   - Confirm return from Stripe checkout functions correctly

### Automated Testing

An automated test script is provided at `test/auth-flow-test.js`. You can run this in the browser console to verify the loop detection mechanisms:

1. Open the browser console on any page in the application
2. Run: `import('/test/auth-flow-test.js').then(() => window.authFlowTest.runAllTests())`
3. Observe the test results in the console

The test script verifies:
- Multi-source loop detection
- Rapid redirect detection
- URL parameter cleaning

## Technical Details

- Loop detection uses multiple time windows: 10 seconds for rapid loops, 1 minute for sustained redirect patterns
- Back/forward navigation in browser history should now work properly after authentication
- Authentication tokens are now properly validated before usage to prevent invalid session issues
- Added URL cleaning to prevent parameter accumulation
- Source tracking identifies which components trigger redirects for better debugging
- Centralized router navigation utility ensures consistent navigation approach
- Properly handles external redirects (like Stripe) while avoiding auth loops
- Axios interceptors use the same navigation utility for consistency

## Future Improvements

- Consider implementing a central auth event bus to coordinate auth-related actions
- Add more detailed telemetry for redirect patterns
- Consider moving Supabase event handlers to a dedicated service
