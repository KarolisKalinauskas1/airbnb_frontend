# Supabase URL Update - May 26, 2025

## Issue
The application was experiencing DNS resolution errors when attempting to connect to the Supabase authentication service:

```
POST https://kyxmgifuawpoiocyuexh.supabase.co/auth/v1/token?grant_type=password net::ERR_NAME_NOT_RESOLVED
```

## Root Cause
The Supabase project URL had been updated to `https://qbhrwpgejrhbfesbomuo.supabase.co`, but several configuration files still referenced the old URL `https://kyxmgifuawpoiocyuexh.supabase.co`.

## Changes Made
1. Updated `.env.local` with the correct Supabase URL and authentication keys
2. Updated hardcoded fallback URLs in:
   - `src/utils/networkDiagnostic.js`
   - `src/utils/supabaseUtils.js`
   - `src/supabase-test.js`
3. Updated the Google OAuth redirect URIs in the backend configuration:
   - `airbnb_backend/.env`
   - `airbnb_backend/src/routes/auth/google.js`

## How to Verify
1. Start the frontend application: `npm run dev`
2. Attempt to log in
3. Verify no DNS resolution errors occur in the browser console
4. Confirm successful authentication

## Additional Notes
- The DNS-RESOLUTION-FIX.md documentation still references the old URL for historical context, but this is acceptable since it documents the original issue.
- If developing in environments where the `.env` or `.env.local` file might be missing or incomplete, the hardcoded fallbacks will now provide the correct URL.
