# Quick Fix: Role Issue

## 🔍 Problem Found

Your stored user shows:
```javascript
role: 'STUDENT'  // ❌ Should be 'ADMIN'
name: 'admin@launchpadskn.com'  // ❌ Should be 'Admin User'
```

## ✅ Quick Fix (2 Options)

### Option 1: Update in Database (Recommended)

**In Supabase SQL Editor**, run:

```sql
-- Update user role to ADMIN
UPDATE users 
SET role = 'ADMIN',
    name = 'Admin User'
WHERE email = 'admin@launchpadskn.com';

-- Verify
SELECT user_id, email, name, role, id 
FROM users 
WHERE email = 'admin@launchpadskn.com';
```

### Option 2: Update in Supabase Auth Dashboard

1. Go to: Authentication → Users
2. Click on `admin@launchpadskn.com`
3. Click **"Edit"** or **"Update"**
4. In **User Metadata**, set:
   - `role`: `ADMIN`
   - `name`: `Admin User`
5. Save

---

## 🔄 After Fix

1. **Clear localStorage** (in browser console):
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Refresh page** and **login again**

3. **Check stored user**:
   ```javascript
   console.log('User:', JSON.parse(localStorage.getItem('user')));
   ```
   Should now show: `role: 'ADMIN'`

4. **Should redirect to** `/admin/dashboard` ✅

---

## 🎯 Why This Happened

When the profile lookup failed (user not linked properly), the code fell back to auth metadata, which either:
- Didn't have role set
- Had role set to 'STUDENT' by default
- Or metadata wasn't set when creating the user

**The fix ensures it defaults to 'ADMIN' for admin@ email addresses.**

---

**Run the SQL fix above and try login again!** 🚀


