# User Creation Checklist

## ✅ Current Status
- ❌ User does NOT exist in Supabase Auth (verified by SQL query)
- ✅ Users table exists
- ⏳ Need to create user in Supabase Auth Dashboard

---

## 📋 Action Items

### 1. Create User in Supabase Auth Dashboard

**Location:** https://supabase.com/dashboard/project/zdcniidpqppwjyosooge/authentication/users

**Steps:**
1. Click **"Add user"** button
2. Fill in:
   - Email: `admin@launchpadskn.com`
   - Password: `Admin123!`
   - **Auto Confirm User**: ✅ Check this
3. Click **"Create user"**
4. **Copy the UUID** (shown after creation)

### 2. Link UUID with Users Table

**In SQL Editor**, run:

```sql
-- Make sure column exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS id UUID;

-- Link the UUID (replace with actual UUID from step 1)
UPDATE users 
SET id = 'paste-uuid-here'
WHERE email = 'admin@launchpadskn.com';
```

### 3. Verify Everything Works

```sql
-- Should show "✅ Linked"
SELECT user_id, email, name, role, id,
       CASE WHEN id IS NULL THEN '❌ Not Linked' ELSE '✅ Linked' END as status
FROM users 
WHERE email = 'admin@launchpadskn.com';
```

---

## 🎯 What "No rows returned" Means

- The SQL query ran successfully ✅
- But the user doesn't exist in `auth.users` yet ❌
- **Solution**: Create user in Dashboard (step 1 above)

---

## ⚠️ Important Notes

1. **Users table** = Your application's user profiles
2. **auth.users** = Supabase Authentication users
3. **They need to be linked** via the `id` (UUID) column
4. **You must create in BOTH places:**
   - First: Create in Supabase Auth Dashboard
   - Then: Link UUID to users table

---

**Next Step:** Go to Supabase Dashboard → Authentication → Users → Add User

Once the user is created and linked, login should work! 🎉


