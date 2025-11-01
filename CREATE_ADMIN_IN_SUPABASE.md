# Create Admin User in Supabase Auth - Step by Step

## 🎯 The Problem
You're getting "Invalid login credentials" because the admin user doesn't exist in Supabase Auth yet.

## ✅ Solution: Create User in Supabase Dashboard

### Method 1: Via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/zdcniidpqppwjyosooge

2. **Navigate to Authentication**
   - Click **"Authentication"** in the left sidebar
   - Click **"Users"** tab

3. **Add New User**
   - Click **"Add user"** button (top right)
   - Click **"Create new user"**

4. **Fill in User Details**
   - **Email**: `admin@launchpadskn.com`
   - **Password**: `Admin123!`
   - **Auto Confirm User**: ✅ Check this (skips email verification)
   - **User Metadata** (click "Add user metadata"): 
     ```json
     {
       "name": "Admin User",
       "role": "ADMIN"
     }
     ```

5. **Save the User**
   - Click **"Create user"**
   - **IMPORTANT**: Copy the **UUID** shown (you'll need it to link with your users table)

6. **Link with Users Table**
   - Go to **SQL Editor** in Supabase Dashboard
   - Run this SQL (replace UUID with the one you copied):
     ```sql
     UPDATE users 
     SET id = 'paste-uuid-here'
     WHERE email = 'admin@launchpadskn.com';
     ```

7. **Verify**
   ```sql
   SELECT user_id, email, name, role, id 
   FROM users 
   WHERE email = 'admin@launchpadskn.com';
   ```
   - Should show the UUID in the `id` column

---

### Method 2: Via SQL (If User Already Exists in Users Table)

If you already have the user in your `users` table but not in Supabase Auth:

1. **Create in Supabase Auth Dashboard** (follow Method 1, steps 1-5)
2. **Link them** (follow Method 1, step 6)

---

### Method 3: Disable Email Verification (Temporary)

If you want to test without email verification:

1. Go to: **Authentication** → **Settings**
2. Scroll to **"Email Auth"** section
3. **Disable**: "Confirm email" toggle
4. Save changes

This allows users to login without email confirmation.

---

## ✅ After Creating User

1. **Try Login Again**
   - Email: `admin@launchpadskn.com`
   - Password: `Admin123!`

2. **If Still Failing:**
   - Verify user exists: Supabase Dashboard → Authentication → Users
   - Check UUID is linked: Run SQL query above
   - Check email verification: Disable it if needed
   - Verify password matches

---

## 🔍 Troubleshooting

**"Invalid login credentials" still showing?**
- ✅ Verify user exists in Supabase Auth Dashboard
- ✅ Check password is correct (case-sensitive)
- ✅ Verify UUID is linked in users table
- ✅ Try resetting password in Supabase Dashboard

**"Email not confirmed" error?**
- Disable email confirmation in Authentication → Settings
- Or click "Confirm email" button in Dashboard

**User exists but can't find profile?**
- Run: `SELECT * FROM users WHERE email = 'admin@launchpadskn.com';`
- Check if `id` column has the UUID
- If NULL, run the UPDATE query from Method 1, step 6

---

**Once the user is created in Supabase Auth, login should work!** 🎉


