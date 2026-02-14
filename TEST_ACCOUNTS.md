# LaunchPad SKN - Test Account Credentials

## 🎯 Quick Login Credentials

After running `database/create-admin-user-supabase.sql` in Supabase SQL Editor, use these credentials:

### Admin Account
- **Email:** `admin@launchpadskn.com`
- **Password:** `Admin123!`
- **Role:** ADMIN
- **Access:** Full system access

### Instructor Account
- **Email:** `instructor@launchpadskn.com`
- **Password:** `Instructor123!`
- **Role:** INSTRUCTOR
- **Access:** Class management, lesson planning, grading

### Student Account
- **Email:** `student@launchpadskn.com`
- **Password:** `Student123!`
- **Role:** STUDENT
- **Access:** View subjects, attend lessons, submit assignments

---

## 📝 How to Create These Accounts

### Option 1: SQL Script (Recommended for Supabase)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/zdcniidpqppwjyosooge

2. **Open SQL Editor**
   - Click **SQL Editor** in left sidebar
   - Click **New Query**

3. **Run the Script**
   - Open `database/create-admin-user-supabase.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click **Run** (or Ctrl+Enter)

4. **Verify Users Created**
   ```sql
   SELECT email, role, name FROM users 
   WHERE email LIKE '%@launchpadskn.com';
   ```

### Option 2: Via API (Requires Services Running)

```powershell
.\create-admin-user.ps1
```

Or use the updated script:
```powershell
.\create-admin-supabase.ps1
```

---

## 🔐 Password Details

All passwords use BCrypt hashing for security. The plaintext passwords are:
- Admin: `Admin123!`
- Instructor: `Instructor123!`
- Student: `Student123!`

**For Production:** Change these passwords immediately!

---

## ✅ Verification

After creating users, verify in Supabase:

```sql
SELECT 
    user_id,
    name,
    email,
    role,
    is_active,
    created_at
FROM users
WHERE email IN (
    'admin@launchpadskn.com',
    'instructor@launchpadskn.com',
    'student@launchpadskn.com'
);
```

---

## 🚀 Testing the Application

1. **Start Backend Services:**
   ```powershell
   .\start-all-services.bat
   ```

2. **Start Frontend:**
   ```powershell
   cd frontend
   npm start
   ```

3. **Login:**
   - Go to: http://localhost:3000
   - Use: `admin@launchpadskn.com` / `Admin123!`

4. **Test Features:**
   - Admin: Create forms, classes, assign students
   - Instructor: Create lessons, mark attendance, enter grades
   - Student: View timetable, access subjects, submit work

---

## 🔄 Reset Passwords (If Needed)

To reset a password, run in Supabase SQL Editor:

```sql
-- Reset admin password to "NewPassword123!"
UPDATE users 
SET password = crypt('NewPassword123!', gen_salt('bf'))
WHERE email = 'admin@launchpadskn.com';
```

Or use the create script again - it uses `ON CONFLICT DO UPDATE` to refresh passwords.

---

**Remember:** These are test accounts with simple passwords. Change them for production use!


