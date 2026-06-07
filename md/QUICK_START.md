# LaunchPad SKN - Quick Start Guide

## ⚠️ IMPORTANT: Setup Order Matters!

Follow these steps **in order**:

### Step 1: Database Setup (REQUIRED FIRST)

**Without databases, nothing will work!**

1. **Ensure PostgreSQL is running**
   - Check Windows Services or Task Manager
   - Default port: 5432

2. **Create the three databases:**

   **Option A: Using psql (Command Line)**
   ```powershell
   psql -U postgres
   ```
   Then run:
   ```sql
   CREATE DATABASE scholarspace_users;
   CREATE DATABASE scholarspace_institutions;
   CREATE DATABASE scholarspace_courses;
   ```

   **Option B: Using the SQL script**
   ```powershell
   psql -U postgres -f setup-databases.sql
   ```

   **Option C: Using pgAdmin (GUI)**
   - Open pgAdmin
   - Right-click "Databases" → "Create" → "Database"
   - Create each database: `scholarspace_users`, `scholarspace_institutions`, `scholarspace_courses`

3. **Verify databases exist:**
   ```sql
   \list
   ```
   You should see all three databases.

---

### Step 2: Start Backend Services

```powershell
.\start-all-services.bat
```

**Wait 30-60 seconds** for all services to start.

**What happens:**
- Services connect to their databases
- JPA/Hibernate automatically creates tables
- Services register with Eureka

---

### Step 3: Verify Services Are Running

1. **Check Eureka Dashboard:** http://localhost:8761
   - All services should show as "UP"

2. **Or run verification script:**
   ```powershell
   .\verify-services.bat
   ```

---

### Step 4: Create Admin User

**After databases and services are running:**

```powershell
.\create-admin-user.ps1
```

**Default Credentials:**
- Email: `admin@scholarspace.com`
- Password: `admin123`

---

### Step 5: Start Frontend

```powershell
cd frontend
npm start
```

---

### Step 6: Login

1. Go to: http://localhost:3000
2. Login with: `admin@scholarspace.com` / `admin123`

---

## ❌ Common Mistakes

### ❌ Starting services before databases exist
- **Result:** Services crash or fail to connect
- **Fix:** Create databases first (Step 1)

### ❌ Creating user before services start
- **Result:** API calls fail
- **Fix:** Start services first, then create user

### ❌ Wrong database password
- **Result:** Services can't connect to database
- **Fix:** Check `application.yml` files match your PostgreSQL password

---

## ✅ Checklist

Before trying to login, verify:

- [ ] PostgreSQL is running
- [ ] Three databases are created (`scholarspace_users`, `scholarspace_institutions`, `scholarspace_courses`)
- [ ] All backend services are running (check Eureka: http://localhost:8761)
- [ ] Admin user is created (run `create-admin-user.ps1`)
- [ ] Frontend is running (http://localhost:3000)

---

## 🆘 If Login Doesn't Work

1. **Check services are running:**
   - Visit http://localhost:8761 (Eureka)
   - All services should be "UP"

2. **Check databases exist:**
   ```sql
   psql -U postgres
   \list
   ```

3. **Check user exists:**
   ```sql
   psql -U postgres -d scholarspace_users
   SELECT * FROM users WHERE email = 'admin@scholarspace.com';
   ```

4. **Check service logs:**
   - Look at the service terminal windows for errors
   - Check for database connection errors

---

**Remember: Databases MUST be created BEFORE starting services!**

