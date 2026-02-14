# How to Find Your Supabase Database Password

## 📍 Step-by-Step Guide

### Step 1: Go to Your Supabase Dashboard

1. **Open your Supabase project:**
   - Go to: https://supabase.com/dashboard/project/zdcniidpqppwjyosooge
   - Or navigate to: https://supabase.com/dashboard → Select your project

### Step 2: Navigate to Database Settings

1. **Click on Settings** (gear icon) in the left sidebar
2. **Click on "Database"** from the settings menu

### Step 3: Find Connection String Section

1. **Scroll down** to find the **"Connection string"** section
2. You'll see two tabs:
   - **URI** - Full connection string
   - **JDBC** - Java/Spring Boot format

### Step 4: Get Your Database Password

**Option A: View Existing Password**

1. Under **"Connection pooling"** or **"Connection parameters"**
2. Find the field labeled **"Database password"** or **"Password"**
3. Click the **"Show"** button (or eye icon) to reveal the password
4. **Copy the password** - this is what you need!

**Option B: Reset Password (if you don't see it or forgot it)**

1. Click **"Reset database password"** button
2. Supabase will generate a new password
3. **Copy it immediately** - you won't be able to see it again!
4. Save it somewhere secure

---

## 📋 What You're Looking For

You need the **DATABASE PASSWORD**, NOT the anon key!

**✅ What you need:**
- Database password: `xxxxxxxxxxxxxxxxxxxxx` (long random string)
- This is for backend Spring Boot services

**❌ What you DON'T need (for backend):**
- Anon key (this is for frontend Supabase client)
- Service role key (different purpose)

---

## 🔗 Direct Link

For your specific project:
**https://supabase.com/dashboard/project/zdcniidpqppwjyosooge/settings/database**

Then scroll to **"Connection string"** section.

---

## 📝 After Getting the Password

### Option 1: Set Environment Variable (Recommended)

```powershell
$env:SUPABASE_DB_PASSWORD="paste_your_password_here"
```

Then start services:
```powershell
.\start-all-services.bat
```

### Option 2: Edit Configuration Files

Replace `YOUR_DATABASE_PASSWORD_HERE` in:
- `user-service/src/main/resources/application.yml`
- `institution-service/src/main/resources/application.yml`
- `course-service/src/main/resources/application.yml`

---

## 🔒 Security Note

⚠️ **Important:**
- This password is different from your Supabase account password
- This is the database password for PostgreSQL connections
- Keep it secure - don't commit it to GitHub!
- You can reset it anytime if needed

---

## 💡 Visual Guide

In Supabase Dashboard, you'll see something like:

```
Settings → Database

Connection string
├── URI tab
└── JDBC tab
    └── Connection parameters:
        Host: zdcniidpqppwjyosooge.supabase.co
        Port: 6543
        Database: postgres
        User: postgres.zdcniidpqppwjyosooge
        Password: [Show] ← Click here!
```

---

## 🆘 If You Can't Find It

If you can't see the password option:

1. **Try the URI tab** - sometimes the password is visible there
2. **Look for "Reset database password"** button
3. **Check if you have the right permissions** (project owner/admin)
4. **Reset the password** to generate a new one you can see

---

**Once you have the password, use it in the configuration files or environment variable!**


