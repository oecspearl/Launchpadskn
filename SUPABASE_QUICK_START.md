# Supabase Quick Start - LaunchPad SKN

## 🚀 Fast Setup (5 Minutes)

### Step 1: Get Supabase Connection Info (2 minutes)

1. **Go to Supabase**: https://supabase.com
2. **Create/Open Project**: Create new project or open existing
3. **Get Connection Details**:
   - Go to **Settings** → **Database**
   - Find **Connection string** → **URI** or **JDBC**
   - Copy:
     - Host: `[something].supabase.co`
     - Port: `6543` (pooling) or `5432` (direct)
     - Database: `postgres`
     - User: `postgres.[project-ref]` or `postgres`
     - Password: (your database password)

### Step 2: Create Schemas (1 minute)

1. **Open SQL Editor** in Supabase dashboard
2. **Run this SQL**:

```sql
CREATE SCHEMA IF NOT EXISTS scholarspace_users;
CREATE SCHEMA IF NOT EXISTS scholarspace_institutions;
CREATE SCHEMA IF NOT EXISTS scholarspace_courses;

GRANT ALL ON SCHEMA scholarspace_users TO postgres;
GRANT ALL ON SCHEMA scholarspace_institutions TO postgres;
GRANT ALL ON SCHEMA scholarspace_courses TO postgres;
```

### Step 3: Update Config Files (2 minutes)

Update these three files with your Supabase connection details:

**File 1:** `user-service/src/main/resources/application.yml`
```yaml
spring:
  datasource:
    url: jdbc:postgresql://[YOUR-PROJECT].supabase.co:6543/postgres?sslmode=require&currentSchema=scholarspace_users
    username: postgres.[YOUR-PROJECT]
    password: [YOUR-PASSWORD]
  jpa:
    properties:
      hibernate:
        default_schema: scholarspace_users
```

**File 2:** `institution-service/src/main/resources/application.yml`
```yaml
spring:
  datasource:
    url: jdbc:postgresql://[YOUR-PROJECT].supabase.co:6543/postgres?sslmode=require&currentSchema=scholarspace_institutions
    username: postgres.[YOUR-PROJECT]
    password: [YOUR-PASSWORD]
  jpa:
    properties:
      hibernate:
        default_schema: scholarspace_institutions
```

**File 3:** `course-service/src/main/resources/application.yml`
```yaml
spring:
  datasource:
    url: jdbc:postgresql://[YOUR-PROJECT].supabase.co:6543/postgres?sslmode=require&currentSchema=scholarspace_courses
    username: postgres.[YOUR-PROJECT]
    password: [YOUR-PASSWORD]
  jpa:
    properties:
      hibernate:
        default_schema: scholarspace_courses
```

**Replace:**
- `[YOUR-PROJECT]` with your Supabase project reference
- `[YOUR-PASSWORD]` with your database password

### Step 4: Test Connection

```powershell
.\start-all-services.bat
```

Check service logs - should see "HikariPool-1 - Start completed" (not errors!)

### ✅ Done!

Your application is now connected to Supabase!

---

## 🔍 Finding Your Project Reference

Your project reference is in the connection string:
- Example: `abcdefghijklmnop.supabase.co`
- The `abcdefghijklmnop` part is your project reference
- It's also in your Supabase dashboard URL

---

## 📝 Example Connection String

**Before (Local PostgreSQL):**
```
jdbc:postgresql://localhost:5432/scholarspace_users
```

**After (Supabase):**
```
jdbc:postgresql://abcdefghijklmnop.supabase.co:6543/postgres?sslmode=require&currentSchema=scholarspace_users
```

**Username:** `postgres.abcdefghijklmnop`  
**Password:** `YourSupabasePassword`

---

## ⚠️ Common Issues

**Connection refused?**
- Check Supabase project is active
- Verify host URL is correct

**SSL error?**
- Make sure `sslmode=require` is in URL

**Schema not found?**
- Run the schema creation SQL again
- Check `currentSchema` parameter in URL

---

For detailed setup, see [SUPABASE_SETUP.md](SUPABASE_SETUP.md)


