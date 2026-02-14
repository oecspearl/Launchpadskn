# Fix Login Errors - Create Users in Supabase Auth

## 🔴 Problem

You're getting "Invalid login credentials" because users exist in the `users` table but **NOT** in Supabase Auth (`auth.users`).

## ✅ Solution: Create Users in Supabase Auth

### Step 1: Create Users in Supabase Dashboard

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/zdcniidpqppwjyosooge
   - Or navigate to your project

2. **Navigate to Authentication**
   - Click **"Authentication"** in the left sidebar (🔑 icon)
   - Click **"Users"** tab at the top

3. **Create Each Test User**

   For each user (Admin, Instructor, Student), click **"Add user"** → **"Create new user"**:

   #### Admin User
   - **Email**: `admin@launchpadskn.com`
   - **Password**: `Admin123!`
   - ✅ **Auto Confirm User** (check this box - skips email verification)
   - **User Metadata** (click "Add user metadata"):
     ```json
     {
       "name": "Admin User",
       "role": "ADMIN"
     }
     ```
   - Click **"Create user"**
   - **IMPORTANT**: Copy the UUID shown (you'll need it)

   #### Instructor User
   - **Email**: `instructor@launchpadskn.com`
   - **Password**: `Instructor123!`
   - ✅ **Auto Confirm User**
   - **User Metadata**:
     ```json
     {
       "name": "Test Instructor",
       "role": "INSTRUCTOR"
     }
     ```
   - Click **"Create user"**
   - Copy the UUID

   #### Student User
   - **Email**: `student@launchpadskn.com`
   - **Password**: `Student123!`
   - ✅ **Auto Confirm User**
   - **User Metadata**:
     ```json
     {
       "name": "Test Student",
       "role": "STUDENT"
     }
     ```
   - Click **"Create user"**
   - Copy the UUID

### Step 2: Link Users with Database Table

After creating users in Supabase Auth, link them with your `users` table:

1. **Go to SQL Editor** in Supabase Dashboard
2. **Run this SQL** (replace UUIDs with the ones you copied):

```sql
-- Link Admin User
UPDATE users 
SET id = 'paste-admin-uuid-here'
WHERE email = 'admin@launchpadskn.com';

-- Link Instructor User
UPDATE users 
SET id = 'paste-instructor-uuid-here'
WHERE email = 'instructor@launchpadskn.com';

-- Link Student User
UPDATE users 
SET id = 'paste-student-uuid-here'
WHERE email = 'student@launchpadskn.com';
```

### Step 3: Verify

Run this query to verify everything is linked:

```sql
SELECT 
    user_id,
    id as auth_uuid,
    name,
    email,
    role,
    is_active
FROM users
WHERE email IN (
    'admin@launchpadskn.com',
    'instructor@launchpadskn.com',
    'student@launchpadskn.com'
);
```

You should see:
- ✅ `id` column has UUIDs (not NULL)
- ✅ All users have correct roles
- ✅ All users are active

### Step 4: Test Login

1. Go to your app: `http://localhost:3000/login`
2. Try logging in with:
   - **Admin**: `admin@launchpadskn.com` / `Admin123!`
   - **Instructor**: `instructor@launchpadskn.com` / `Instructor123!`
   - **Student**: `student@launchpadskn.com` / `Student123!`

---

## 🔧 Alternative: Disable Email Verification (For Testing)

If you want to skip email verification for all users:

1. Go to: **Authentication** → **Settings**
2. Scroll to **"Email Auth"** section
3. **Disable**: "Confirm email" toggle
4. Save changes

This allows users to login immediately without email confirmation.

---

## 📝 Quick Reference: All Test Accounts

| Role | Email | Password | UUID Location |
|------|-------|----------|---------------|
| Admin | `admin@launchpadskn.com` | `Admin123!` | Copy from Auth Users |
| Instructor | `instructor@launchpadskn.com` | `Instructor123!` | Copy from Auth Users |
| Student | `student@launchpadskn.com` | `Student123!` | Copy from Auth Users |

---

## 🚨 Common Issues

### Issue 1: "Email address is invalid"
- **Cause**: Email format validation in Supabase
- **Fix**: Make sure email is properly formatted (e.g., `user@domain.com`)

### Issue 2: "User already exists"
- **Cause**: User already exists in Supabase Auth
- **Fix**: 
  - Find the existing user in Authentication → Users
  - Copy their UUID
  - Link it using the UPDATE SQL above

### Issue 3: "Invalid login credentials" after creating user
- **Cause**: User not linked to database, or password mismatch
- **Fix**: 
  1. Verify user exists in `auth.users` (Authentication → Users)
  2. Verify UUID is linked in `users` table (run verification query)
  3. Double-check password is correct

### Issue 4: Registration fails with 403 error
- **Cause**: Insufficient permissions or email validation
- **Fix**: 
  - Make sure "Auto Confirm User" is checked when creating
  - Check Authentication settings for email restrictions

---

## ✅ Success Checklist

- [ ] All 3 users created in Supabase Auth (Authentication → Users)
- [ ] All users have UUIDs copied
- [ ] UUIDs linked to `users` table via SQL UPDATE
- [ ] Verification query shows UUIDs in `id` column
- [ ] Can login with admin account
- [ ] Can login with instructor account
- [ ] Can login with student account

---

## 🎯 Next Steps After Fixing

Once login works:
1. Test student can access dashboard
2. Test teacher can create lessons
3. Test admin can manage classes
4. Test assignment submission
5. Test content viewing

---

**Remember**: Supabase Auth (`auth.users`) and your database (`users` table) are separate. Users must exist in BOTH places, and the `id` column in your `users` table must match the UUID from `auth.users`.

