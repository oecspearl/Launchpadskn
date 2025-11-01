# Supabase Migration - Step by Step Guide

## ✅ Phase 1: Setup Complete

### Completed:
- ✅ Installed `@supabase/supabase-js` package
- ✅ Created `frontend/src/config/supabase.js` - Supabase client configuration
- ✅ Created `frontend/src/services/supabaseService.js` - Main service layer
- ✅ Created `frontend/src/services/authServiceSupabase.js` - New auth service

### Your Supabase Credentials:
- **URL**: `https://zdcniidpqppwjyosooge.supabase.co`
- **Anon Key**: Already configured in `supabase.js`

---

## 🔄 Next Steps

### Step 1: Update Environment Variables

Add to `frontend/.env` (create if doesn't exist):
```
REACT_APP_SUPABASE_URL=https://zdcniidpqppwjyosooge.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkY25paWRwcXBwd2p5b3Nvb2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODc3NDgsImV4cCI6MjA3NDQ2Mzc0OH0.nz9oqG27mtmGzso3uPAMFoj191Qr3dz03AKUS5anXuo
```

### Step 2: Replace Auth Service

**Backup old service first:**
```bash
mv frontend/src/services/authService.js frontend/src/services/authService.old.js
```

**Use new Supabase auth service:**
```bash
mv frontend/src/services/authServiceSupabase.js frontend/src/services/authService.js
```

**Or update imports:**
- In `AuthContext.js`, change:
  ```javascript
  import authService from '../services/authServiceSupabase';
  ```

### Step 3: Update AuthContext

Update `frontend/src/contexts/AuthContext.js` to:
- Use Supabase session management
- Listen for auth state changes
- Handle Supabase auth events

### Step 4: Database Setup

**Important:** Your users table needs to be linked with Supabase Auth:

1. In Supabase Dashboard → SQL Editor, run:
```sql
-- Link users table with auth.users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
```

2. **Or** update your users table to use `auth.users` directly:
```sql
-- Option: Use Supabase Auth metadata instead of separate users table
-- Supabase Auth already has email, so we just need to extend with profile data
```

### Step 5: Enable Row Level Security (RLS)

In Supabase Dashboard → SQL Editor, create RLS policies:

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Policy: Admins can view all users
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Similar policies for other tables...
```

### Step 6: Setup Supabase Storage Buckets

In Supabase Dashboard → Storage:

1. Create buckets:
   - `course-content` - For course materials
   - `assignments` - For student submissions
   - `profile-pictures` - For user avatars

2. Set bucket policies (who can upload/download)

### Step 7: Test Authentication

1. Start frontend: `cd frontend && npm start`
2. Try login with existing admin user
3. Check Supabase Dashboard → Authentication → Users

---

## 📝 Migration Checklist

- [x] Install Supabase client
- [x] Create Supabase config
- [x] Create Supabase service layer
- [x] Create new auth service
- [ ] Update AuthContext
- [ ] Update database schema (link with auth.users)
- [ ] Setup RLS policies
- [ ] Setup Storage buckets
- [ ] Replace all API calls with Supabase
- [ ] Test all features
- [ ] Remove old backend references

---

## 🔍 Testing Guide

### Test Authentication:
1. Register new user
2. Login
3. Check session persists
4. Logout
5. Password reset flow

### Test Database Operations:
1. Create institution
2. Create department
3. Create form
4. Create class
5. Create subject
6. View all data

### Test File Uploads:
1. Upload course content
2. Download course content
3. Upload assignment submission

---

## 🚨 Important Notes

1. **User IDs**: Supabase Auth uses UUIDs, not auto-increment integers
   - Update your database schema accordingly
   - Or create mapping between auth.users.id and users.user_id

2. **Email Verification**: Supabase requires email verification by default
   - Can disable in Dashboard → Authentication → Settings
   - Or handle in your registration flow

3. **Password Requirements**: Supabase has default password requirements
   - Can customize in Authentication settings

4. **Session Management**: Supabase handles sessions automatically
   - Tokens refresh automatically
   - Sessions persist in localStorage

---

## 📚 Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

---

**Next:** Update AuthContext to use Supabase session management!


