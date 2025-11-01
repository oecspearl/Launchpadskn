# Quick Guide: Get Supabase Database Password

## 🎯 Direct Path

1. **Open:** https://supabase.com/dashboard/project/zdcniidpqppwjyosooge/settings/database

2. **Scroll to:** "Connection string" section

3. **Find:** "Database password" or "Connection parameters"

4. **Click:** "Show" button next to password

5. **Copy:** The password (it's a long random string)

---

## ✅ You Found It When You See:

- A long random password string (usually 20+ characters)
- It's NOT the anon key (which starts with `eyJhbGci...`)
- It's labeled as "Database password" or "Password"

---

## 🚀 Then Use It:

```powershell
# Set environment variable
$env:SUPABASE_DB_PASSWORD="your_password_here"

# Start services
.\start-all-services.bat
```

**OR** replace `YOUR_DATABASE_PASSWORD_HERE` in the three `application.yml` files.

---

## 📸 Screenshot Locations

The password is typically shown in:

**Settings → Database → Connection string → JDBC tab**

Under "Connection parameters" you'll see:
- Host
- Port  
- Database
- User
- **Password** ← Click "Show" here!

---

**That's it! The password is right there in your Supabase dashboard settings.**


