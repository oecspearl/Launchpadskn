# Quick: Create Admin User

## Option 1: Get Service Role Key and Run Script

### Step 1: Get Your Service Role Key

1. Go to: https://supabase.com/dashboard/project/zdcniidpqppwjyosooge/settings/api
2. Scroll to **"Project API keys"**
3. Find **"service_role"** key (it's long, starts with `eyJ...`)
4. **⚠️ WARNING:** This key has full admin access - keep it secret!

### Step 2: Run the Script

```powershell
# Set the service role key
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Run the script
node create-admin-user-script.js
```

---

## Option 2: Manual Creation (Easier)

### Go to Dashboard and Create User

1. **Open:** https://supabase.com/dashboard/project/zdcniidpqppwjyosooge/authentication/users

2. **Click "Add user"** or **"New user"** button

3. **Fill in:**
   - Email: `admin@launchpadskn.com`
   - Password: `Admin123!`
   - **Auto Confirm User**: ✅ Check this

4. **Click "Create user"**

5. **Copy the UUID** shown after creation

6. **Link it** (Run in SQL Editor):
   ```sql
   ALTER TABLE users ADD COLUMN IF NOT EXISTS id UUID;
   
   UPDATE users 
   SET id = 'paste-uuid-here'
   WHERE email = 'admin@launchpadskn.com';
   ```

---

## Option 3: Use Supabase CLI (If Installed)

```bash
supabase auth admin create-user \
  --email admin@launchpadskn.com \
  --password Admin123! \
  --email-confirm true \
  --user-metadata '{"name":"Admin User","role":"ADMIN"}'
```

---

**Easiest: Option 2 (Dashboard)** - Just click "Add user" and follow the steps! 🎯


