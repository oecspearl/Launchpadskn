# Quick Fix: Add ID Column to Users Table

## ⚠️ Error
```
ERROR: 42703: column "id" does not exist
```

## ✅ Solution: Add the UUID Column

The `id` column (UUID) needs to be added to link with Supabase Auth.

### Step 1: Run This SQL Script

**In Supabase SQL Editor**, run:

```sql
-- Add id column (UUID) to link with auth.users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS id UUID;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(id);
```

### Step 2: Verify Column Added

```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name = 'id';
```

Should show: `id | uuid`

### Step 3: Now Link Your User

After creating the user in Supabase Auth Dashboard:

```sql
-- Replace YOUR-UUID-HERE with UUID from Supabase Auth
UPDATE users 
SET id = 'YOUR-UUID-HERE'
WHERE email = 'admin@launchpadskn.com';

-- Verify
SELECT user_id, email, name, role, id,
       CASE WHEN id IS NULL THEN 'Not Linked' ELSE 'Linked ✅' END as status
FROM users 
WHERE email = 'admin@launchpadskn.com';
```

---

## 📋 Complete Steps (In Order)

1. **Add UUID column** (Run the SQL above) ✅
2. **Create user in Supabase Auth Dashboard** 
   - Authentication → Users → Add User
   - Email: `admin@launchpadskn.com`
   - Password: `Admin123!`
   - Copy the UUID
3. **Link UUID** (Run UPDATE query above)
4. **Try login again** 🎉

---

**The full migration script is in `database/migrate-users-to-supabase-auth.sql` if you want to run everything at once!**


