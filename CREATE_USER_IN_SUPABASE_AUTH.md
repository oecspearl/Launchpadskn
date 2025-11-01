# Create User in Supabase Auth - Detailed Guide

## 🎯 Where to Create the User

You need to create the user in **Supabase Dashboard → Authentication → Users**.

---

## 📋 Step-by-Step Instructions

### Step 1: Navigate to Authentication

1. **Go to your Supabase Dashboard:**
   - URL: https://supabase.com/dashboard/project/zdcniidpqppwjyosooge

2. **Click "Authentication"** in the left sidebar (it has a key icon 🔑)

3. **Click "Users"** tab (should be at the top)

### Step 2: Add New User

1. **Look for the "Add user" button** - usually in the top right corner
   - It might say "Add user" or have a "+" icon
   - Or click "New user" button

2. **If you see a dropdown:**
   - Click it and select **"Create new user"**
   - (There might also be "Invite user" option - ignore that)

### Step 3: Fill in User Details

You should see a form with these fields:

1. **Email**: `admin@launchpadskn.com`

2. **Password**: `Admin123!`
   - Make sure it's typed correctly (case-sensitive)

3. **Auto Confirm User**: ✅ **CHECK THIS BOX**
   - This is important! It skips email verification
   - Located below the password field

4. **User Metadata** (Optional but recommended):
   - Look for "User metadata" or "Metadata" section
   - Click to expand or "Add user metadata"
   - Click "Add new" or the "+" button
   - Add key-value pairs:
     - Key: `name` → Value: `Admin User`
     - Key: `role` → Value: `ADMIN`

### Step 4: Create the User

1. Click **"Create user"** or **"Add user"** button at the bottom

2. **Wait for confirmation** - You should see a success message

3. **IMPORTANT**: After creation, the user should appear in the list
   - Look for `admin@launchpadskn.com` in the users table
   - **Copy the UUID** - it's shown in the ID column (usually first column)
   - It looks like: `123e4567-e89b-12d3-a456-426614174000`

---

## 🔍 Troubleshooting: Can't Find "Add User" Button?

### Option A: Check Your View

- Make sure you're in the **"Users"** tab, not "Policies" or "Providers"
- Scroll up/down - the button might be at the top or bottom
- Look for icons: ➕ or ➕ Add

### Option B: Try Different Locations

1. **Top Right Corner**: Usually has "+ Add user" or "New user"
2. **Empty State**: If no users exist, there might be a big "Add your first user" button
3. **Menu**: Three dots (⋯) menu might have "Add user" option

### Option C: Check Permissions

- Make sure you're logged in as the project owner/admin
- You need permissions to create users

---

## 🔄 Alternative: Create User via SQL (If Dashboard Doesn't Work)

If you can't create via Dashboard, you can use the Admin API. But first, let's check if the user might already exist:

```sql
-- Check auth.users table (if you have access)
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@launchpadskn.com';
```

**Note**: You might not have direct access to `auth.users` via SQL Editor. The Dashboard is the recommended way.

---

## ✅ After User is Created

1. **Verify user appears in the list:**
   - Should see `admin@launchpadskn.com` in the Users table

2. **Copy the UUID** from the ID column

3. **Link with users table** (Run in SQL Editor):
   ```sql
   -- Make sure id column exists first
   ALTER TABLE users ADD COLUMN IF NOT EXISTS id UUID;
   
   -- Then link (replace UUID with actual value)
   UPDATE users 
   SET id = 'paste-uuid-here'
   WHERE email = 'admin@launchpadskn.com';
   ```

4. **Verify link:**
   ```sql
   SELECT user_id, email, name, role, id 
   FROM users 
   WHERE email = 'admin@launchpadskn.com';
   ```

---

## 🆘 Still Having Issues?

### Issue: "Add user" button not visible

**Solution:**
1. Refresh the page (F5)
2. Check you're in the right project
3. Try a different browser
4. Clear browser cache

### Issue: Can't access Authentication section

**Solution:**
1. Verify you're logged into Supabase
2. Check you have access to the project
3. Contact project owner for permissions

### Issue: User created but can't see it

**Solution:**
1. Refresh the Users list
2. Check filters - make sure "All users" is selected
3. Search for `admin@launchpadskn.com` in the search box

---

## 📸 What to Look For

When you're in **Authentication → Users**, you should see:

- A table/list of users (might be empty)
- A button that says **"Add user"**, **"New user"**, or **"+"**
- Columns like: ID, Email, Created, Last Sign In, etc.

**If the list is empty**, there's usually a message like "No users yet" with a button to create the first one.

---

**Need help?** Take a screenshot of what you see in Authentication → Users, and I can guide you further!


