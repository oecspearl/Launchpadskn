# 🚀 Quick: Create Admin User NOW

## Fastest Method (2 Minutes)

### Step 1: Open This Link

👉 **https://supabase.com/dashboard/project/zdcniidpqppwjyosooge/authentication/users**

### Step 2: Click "Add user" Button

Look for it in the top right corner of the page.

### Step 3: Fill Form

- **Email:** `admin@launchpadskn.com`
- **Password:** `Admin123!`
- **Auto Confirm User:** ✅ CHECK THIS

Click **"Create user"**

### Step 4: Copy UUID

After creation, you'll see the user in the list. Copy the **UUID** (the long ID in the first column).

### Step 5: Link UUID

Go to **SQL Editor** in Supabase Dashboard, paste this (replace UUID):

```sql
-- Add column if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS id UUID;

-- Link UUID
UPDATE users 
SET id = 'paste-uuid-from-step-4-here'
WHERE email = 'admin@launchpadskn.com';

-- Verify
SELECT email, name, role, id FROM users WHERE email = 'admin@launchpadskn.com';
```

---

## ✅ Done!

Now try logging in:
- Email: `admin@launchpadskn.com`
- Password: `Admin123!`

---

**That's it! Takes 2 minutes!** 🎉


