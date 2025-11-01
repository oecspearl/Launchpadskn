# Debug Login Issue

## Problem
Login succeeds (SIGNED_IN event fires) but page doesn't redirect.

## Likely Causes

1. **Profile lookup failing** - User exists in Supabase Auth but not linked in users table
2. **Role format mismatch** - Role might be uppercase "ADMIN" vs lowercase "admin"
3. **User data not being returned properly**

## Fix Applied

1. ✅ Added fallback to use auth metadata if profile not found
2. ✅ Added console logs to track the flow
3. ✅ Improved error handling in getUserProfile
4. ✅ Fixed role case-insensitive matching

## Check Browser Console

After the fix, you should see:
- `Login successful, userData: {...}`
- `User role: admin` (or instructor/student)
- `Navigating to admin dashboard`

If you see errors, they'll tell us what's wrong.

## Quick Fix: Check User Data

Open browser console and check:
```javascript
// Check what's stored
console.log('User:', JSON.parse(localStorage.getItem('user')));
console.log('Role:', JSON.parse(localStorage.getItem('user'))?.role);
```

## If Profile Not Found

The code now falls back to using Supabase Auth metadata. Make sure when you created the user, you set:
- User Metadata → `role`: `ADMIN` (uppercase is fine, code converts to lowercase)

## Manual Redirect (Temporary)

If still not working, you can manually navigate:
```javascript
// In browser console
window.location.href = '/admin/dashboard';
```

This will help us see if it's a routing issue or a login issue.

---

**Refresh the page and try login again. Check the console logs!**


