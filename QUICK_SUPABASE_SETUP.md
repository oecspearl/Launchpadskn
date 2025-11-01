# Quick Supabase Setup - LaunchPad SKN

## ✅ Your Supabase Project

- **Project Reference:** `zdcniidpqppwjyosooge`
- **Host:** `zdcniidpqppwjyosooge.supabase.co`
- **URL:** https://zdcniidpqppwjyosooge.supabase.co

---

## 🔑 Step 1: Get Database Password

**This is CRITICAL - You need your DATABASE password, NOT the anon key!**

1. Go to: https://supabase.com/dashboard/project/zdcniidpqppwjyosooge/settings/database
2. Scroll to **Connection string** section
3. Under **Connection pooling**, find **Database password**
4. Click **Show** (or **Reset** if you need a new one)
5. **Copy the password** - You'll need it in Step 3

---

## 📊 Step 2: Create Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Open `database/schema-redesign.sql`
3. Copy the entire file
4. Paste into SQL Editor
5. Click **Run** (or Ctrl+Enter)
6. Wait for "Success" message

**Verify:** Run `database/VERIFY_SETUP.sql` to check all tables were created.

---

## ⚙️ Step 3: Update Configuration Files

The configuration files have been updated with your Supabase connection details.

### Update Password in Files

You need to replace `YOUR_DATABASE_PASSWORD_HERE` in these files:

1. **`user-service/src/main/resources/application.yml`**
2. **`institution-service/src/main/resources/application.yml`**
3. **`course-service/src/main/resources/application.yml`**

**Option A: Hardcode Password (Quick)**
Replace `YOUR_DATABASE_PASSWORD_HERE` with your actual password in all three files.

**Option B: Use Environment Variable (Secure - Recommended)**
Set environment variable before starting services:
```powershell
$env:SUPABASE_DB_PASSWORD="your_actual_password_here"
```

Then start services:
```powershell
.\start-all-services.bat
```

---

## 🔍 Current Configuration

All three services are configured with:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://zdcniidpqppwjyosooge.supabase.co:6543/postgres?sslmode=require
    username: postgres.zdcniidpqppwjyosooge
    password: ${SUPABASE_DB_PASSWORD:YOUR_DATABASE_PASSWORD_HERE}
```

**The `:YOUR_DATABASE_PASSWORD_HERE` part is a fallback if the environment variable isn't set.**

---

## ✅ Quick Test

1. Set password:
   ```powershell
   $env:SUPABASE_DB_PASSWORD="your_password"
   ```

2. Start a service:
   ```powershell
   cd user-service
   .\mvnw.cmd spring-boot:run
   ```

3. Check logs for:
   - ✅ "HikariPool-1 - Start completed" = Success!
   - ❌ "Connection refused" or "Authentication failed" = Check password/host

---

## 📝 Summary

**What's Done:**
- ✅ Configuration files updated with your Supabase host
- ✅ SSL mode enabled
- ✅ Connection pooling configured (port 6543)
- ✅ Username configured correctly

**What You Need to Do:**
1. ✅ Get database password from Supabase dashboard
2. ✅ Run `database/schema-redesign.sql` in Supabase SQL Editor
3. ✅ Replace `YOUR_DATABASE_PASSWORD_HERE` in application.yml files OR set `SUPABASE_DB_PASSWORD` environment variable
4. ✅ Start services and test connection

---

## 🆘 Troubleshooting

**"Authentication failed"**
- Double-check password (get it fresh from Supabase dashboard)
- Verify username: `postgres.zdcniidpqppwjyosooge`

**"Connection refused"**
- Verify Supabase project is active
- Check host: `zdcniidpqppwjyosooge.supabase.co`
- Try port 5432 (direct) instead of 6543 (pooling)

**"SSL connection required"**
- Verify `sslmode=require` is in URL (already included)
- Check PostgreSQL driver supports SSL

---

**Ready to connect!** Just add your database password and run the schema script.


