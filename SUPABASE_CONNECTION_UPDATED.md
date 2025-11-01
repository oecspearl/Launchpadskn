# Supabase Connection - Updated Configuration

## ✅ Configuration Updated

Based on your connection string format:
```
postgresql://postgres:[YOUR_PASSWORD]@db.zdcniidpqppwjyosooge.supabase.co:5432/postgres
```

I've updated all three service configuration files with the correct connection details:

### Updated Settings:
- **Host:** `db.zdcniidpqppwjyosooge.supabase.co` (changed from `zdcniidpqppwjyosooge.supabase.co`)
- **Port:** `5432` (direct connection, changed from 6543 pooling)
- **Username:** `postgres` (changed from `postgres.zdcniidpqppwjyosooge`)
- **Database:** `postgres`
- **SSL Mode:** `require`

---

## 🔑 What You Need to Do

### Step 1: Get Your Password

From the connection string you have:
```
postgresql://postgres:[YOUR_PASSWORD]@db.zdcniidpqppwjyosooge.supabase.co:5432/postgres
```

Replace `[YOUR_PASSWORD]` with your actual database password.

**To find it:**
1. Go to: https://supabase.com/dashboard/project/zdcniidpqppwjyosooge/settings/database
2. Scroll to "Connection string" section
3. Click "Show" next to password
4. Copy the password

---

## ⚙️ Step 2: Set the Password

### Option A: Environment Variable (Recommended)

```powershell
$env:SUPABASE_DB_PASSWORD="your_actual_password_here"
```

Then start services:
```powershell
.\start-all-services.bat
```

### Option B: Edit Files Directly

Replace `YOUR_DATABASE_PASSWORD_HERE` in these files:
- `user-service/src/main/resources/application.yml`
- `institution-service/src/main/resources/application.yml`
- `course-service/src/main/resources/application.yml`

---

## 📋 Updated Connection Details

All three services now use:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://db.zdcniidpqppwjyosooge.supabase.co:5432/postgres?sslmode=require
    username: postgres
    password: ${SUPABASE_DB_PASSWORD:YOUR_DATABASE_PASSWORD_HERE}
```

**Note:** Using direct connection (port 5432) instead of connection pooling (port 6543) as shown in your connection string.

---

## ✅ Next Steps

1. **Get your password** from Supabase dashboard
2. **Set it** (environment variable or edit files)
3. **Start services:** `.\start-all-services.bat`
4. **Verify connection** - check service logs for "HikariPool started"

---

## 🔍 Connection String Breakdown

From: `postgresql://postgres:[YOUR_PASSWORD]@db.zdcniidpqppwjyosooge.supabase.co:5432/postgres`

- **Protocol:** `postgresql://`
- **Username:** `postgres`
- **Password:** `[YOUR_PASSWORD]` ← Replace this!
- **Host:** `db.zdcniidpqppwjyosooge.supabase.co`
- **Port:** `5432`
- **Database:** `postgres`

---

**Once you set the password, you're ready to start the services!**


