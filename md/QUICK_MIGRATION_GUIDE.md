# Quick Migration Guide - React + Supabase

## ✅ What's Done

1. ✅ Supabase client installed and configured
2. ✅ New Supabase service layer created
3. ✅ New Supabase auth service created
4. ✅ AuthContext updated to use Supabase
5. ✅ Database migration scripts created

## 🚀 Quick Start (3 Steps)

### Step 1: Link Users Table with Supabase Auth

**In Supabase SQL Editor**, run:
```sql
-- Run this first
\i database/migrate-users-to-supabase-auth.sql
```

This will:
- Add UUID column to users table
- Enable Row Level Security (RLS)
- Create RLS policies
- Set up triggers

### Step 2: Create Admin User in Supabase Auth

**Via Supabase Dashboard:**
1. Go to: Authentication → Users → Add User
2. Create user:
   - Email: `admin@launchpadskn.com`
   - Password: `Admin123!`
   - User Metadata:
     ```json
     {
       "name": "Admin User",
       "role": "ADMIN"
     }
     ```
3. Copy the UUID (it's shown after creation)
4. Link with existing users table:
   ```sql
   -- Replace UUID with the one from Supabase
   UPDATE users 
   SET id = 'paste-uuid-from-supabase-here'
   WHERE email = 'admin@launchpadskn.com';
   ```

### Step 3: Update Frontend Imports

**Option A: Backup and Replace (Recommended)**
```bash
# Backup old files
mv frontend/src/contexts/AuthContext.js frontend/src/contexts/AuthContext.old.js
mv frontend/src/services/authService.js frontend/src/services/authService.old.js

# Use new Supabase versions
mv frontend/src/contexts/AuthContextSupabase.js frontend/src/contexts/AuthContext.js
mv frontend/src/services/authServiceSupabase.js frontend/src/services/authService.js
```

**Option B: Update Imports Manually**
- In `App.js`: Already updated to use `AuthContextSupabase`
- The new auth service will be used automatically

### Step 4: Create .env File

Create `frontend/.env`:
```
REACT_APP_SUPABASE_URL=https://zdcniidpqppwjyosooge.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkY25paWRwcXBwd2p5b3Nvb2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODc3NDgsImV4cCI6MjA3NDQ2Mzc0OH0.nz9oqG27mtmGzso3uPAMFoj191Qr3dz03AKUS5anXuo
```

### Step 5: Test!

```bash
cd frontend
npm start
```

1. Go to http://localhost:3000/login
2. Login with: `admin@launchpadskn.com` / `Admin123!`
3. Should work with Supabase Auth! 🎉

---

## 🔧 Troubleshooting

**"User not found" or "Profile missing"**
- Make sure user exists in Supabase Auth
- Make sure UUID is linked: `SELECT * FROM users WHERE id IS NOT NULL;`

**"RLS policy violation"**
- Check RLS policies are created
- Verify user role matches policy

**"Session not found"**
- Check Supabase Auth Dashboard → Authentication → Users
- Verify user email is confirmed (or disable email verification in settings)

**Login works but profile doesn't load**
- Check users table has matching record
- Verify UUID link is correct

---

## 📋 Migration Checklist

- [ ] Run `migrate-users-to-supabase-auth.sql`
- [ ] Create admin user in Supabase Auth Dashboard
- [ ] Link UUID with users table
- [ ] Create frontend `.env` file
- [ ] Update imports (or use new file names)
- [ ] Test login
- [ ] Verify session persists on refresh
- [ ] Test logout
- [ ] Test registration (creates auth user + profile)

---

## 🎯 Next Steps After Authentication Works

1. Replace other service files:
   - `adminService.js` → Use `supabaseService.js`
   - `studentService.js` → Use `supabaseService.js`
   - `instructorService.js` → Use `supabaseService.js`

2. Setup Supabase Storage buckets:
   - `course-content` - For course materials
   - `assignments` - For submissions

3. Remove Java backend references:
   - Update all API calls to use Supabase
   - Remove `http://localhost:8080` references

---

**You're ready to test! Follow the 5 steps above!** 🚀


