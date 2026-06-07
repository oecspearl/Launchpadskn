# Start Backend Services - LaunchPad SKN

## ⚠️ Connection Refused Error Fix

If you see `ERR_CONNECTION_REFUSED` on `localhost:8080`, it means the backend services aren't running.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Set Database Password (Supabase)

If you haven't set your Supabase database password, do this first:

**Option A: Environment Variable (Recommended)**
```powershell
$env:SUPABASE_DB_PASSWORD="your_database_password_here"
```

**Option B: Edit Files Directly**
- Replace `YOUR_DATABASE_PASSWORD_HERE` in:
  - `user-service/src/main/resources/application.yml`
  - `institution-service/src/main/resources/application.yml`
  - `course-service/src/main/resources/application.yml`

### Step 2: Start All Services

```powershell
.\start-all-services.bat
```

This will open 6 separate windows, one for each service:
1. Config Server (Port 8888)
2. Discovery Server (Port 8761)
3. API Gateway (Port 8080) ← **This is the one you need!**
4. User Service (Port 8090)
5. Institution Service (Port 8091)
6. Course Service (Port 8092)

**Wait 30-60 seconds** for all services to start up.

### Step 3: Verify Services Are Running

**Check Gateway:**
- Open browser: http://localhost:8080/actuator/health
- Should show: `{"status":"UP"}`

**Check Eureka Dashboard:**
- Open browser: http://localhost:8761
- Should see all services listed and UP

**If services show errors**, check the error messages in the service windows.

---

## 🔍 Troubleshooting

### Service Won't Start

**Error: "Connection refused" or "Cannot connect to database"**
- ✅ Check database password is correct
- ✅ Verify Supabase project is active
- ✅ Check connection string in application.yml

**Error: "Port already in use"**
- Another instance is running
- Close other terminal windows
- Or change port in application.yml

**Error: "No suitable driver found"**
- PostgreSQL driver missing
- Run: `cd user-service && mvnw.cmd clean install`

### Services Start But Don't Connect

**Check Database:**
- Run `database/fix-users-table.sql` if you had column errors
- Verify admin user exists: `database/create-admin-user-supabase.sql`

**Check Logs:**
- Look at service window outputs
- Common issues:
  - Database connection errors
  - Missing dependencies
  - Port conflicts

---

## ✅ Success Checklist

Before trying to login, verify:

- [ ] All 6 service windows are open
- [ ] No red error messages in service windows
- [ ] Gateway health check works: http://localhost:8080/actuator/health
- [ ] Eureka shows all services: http://localhost:8761
- [ ] Admin user created in database
- [ ] Frontend can connect (try refresh)

---

## 🎯 Next Steps After Services Start

1. **Wait for all services to show "Started"**
2. **Create admin user** (if not done):
   - Run `database/create-admin-user-supabase.sql` in Supabase
3. **Refresh frontend** or restart if needed
4. **Try login again**

---

**Need help?** Check the service window error messages - they usually tell you what's wrong!


