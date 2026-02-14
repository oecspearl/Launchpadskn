# LaunchPad SKN - Supabase Database Setup Guide

This guide will walk you through setting up Supabase as your database for LaunchPad SKN.

## 📋 Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Your Supabase project created and running
- Access to your Supabase project settings

---

## Step 1: Create Your Supabase Project

### 1.1 Sign Up / Log In to Supabase
1. Go to https://supabase.com
2. Sign up or log in to your account
3. Click **"New Project"**

### 1.2 Create New Project
1. **Organization**: Select or create an organization
2. **Project Name**: Enter a name (e.g., "LaunchPad SKN")
3. **Database Password**: Create a strong password (save this - you'll need it!)
4. **Region**: Choose the closest region to your users
5. **Pricing Plan**: Select your plan (Free tier works for development)
6. Click **"Create new project"**

### 1.3 Wait for Project Setup
- Wait 2-3 minutes for your project to be ready
- You'll see a success message when it's complete

---

## Step 2: Get Your Supabase Connection Details

### 2.1 Navigate to Project Settings
1. In your Supabase dashboard, click on your project
2. Click **Settings** (gear icon in the left sidebar)
3. Click **Database** in the settings menu

### 2.2 Find Connection String
You'll find connection details under **"Connection string"** or **"Connection pooling"**

You need:
- **Host**: `[your-project-ref].supabase.co`
- **Port**: `5432` (for direct connection) or `6543` (for connection pooling - recommended)
- **Database**: `postgres`
- **User**: `postgres.[your-project-ref]` or just `postgres`
- **Password**: The password you set during project creation
- **SSL**: Required (always use SSL with Supabase)

### 2.3 Connection String Format
**Direct Connection:**
```
Host: [your-project-ref].supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [your-database-password]
SSL Mode: require
```

**Connection Pooling (Recommended):**
```
Host: [your-project-ref].supabase.co
Port: 6543
Database: postgres
User: postgres.[your-project-ref]
Password: [your-database-password]
SSL Mode: require
```

---

## Step 3: Create Three Databases in Supabase

**Important**: Supabase uses **schemas** instead of separate databases. We'll create three schemas within the same Supabase database.

### 3.1 Open SQL Editor
1. In your Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**

### 3.2 Create Schemas
Run this SQL to create three schemas:

```sql
-- Create schemas for LaunchPad SKN
CREATE SCHEMA IF NOT EXISTS scholarspace_users;
CREATE SCHEMA IF NOT EXISTS scholarspace_institutions;
CREATE SCHEMA IF NOT EXISTS scholarspace_courses;

-- Grant permissions
GRANT ALL ON SCHEMA scholarspace_users TO postgres;
GRANT ALL ON SCHEMA scholarspace_institutions TO postgres;
GRANT ALL ON SCHEMA scholarspace_courses TO postgres;
```

### 3.3 Alternative: Use Separate Supabase Projects (Optional)
If you prefer separate databases, create three separate Supabase projects:
- Project 1: For `scholarspace_users`
- Project 2: For `scholarspace_institutions`
- Project 3: For `scholarspace_courses`

Each will have its own connection string.

---

## Step 4: Update Application Configuration Files

You need to update the database connection in three service configuration files.

### 4.1 User Service Configuration

**File:** `user-service/src/main/resources/application.yml`

Update the datasource section:

```yaml
spring:
  datasource:
    driver-class-name: org.postgresql.Driver
    url: jdbc:postgresql://[YOUR-PROJECT-REF].supabase.co:6543/postgres?user=postgres.[YOUR-PROJECT-REF]&password=[YOUR-PASSWORD]&sslmode=require&currentSchema=scholarspace_users
    username: postgres.[YOUR-PROJECT-REF]
    password: [YOUR-PASSWORD]
  jpa:
    properties:
      hibernate:
        default_schema: scholarspace_users
```

**Example (replace with your values):**
```yaml
spring:
  datasource:
    driver-class-name: org.postgresql.Driver
    url: jdbc:postgresql://abcdefghijklmnop.supabase.co:6543/postgres?sslmode=require&currentSchema=scholarspace_users
    username: postgres.abcdefghijklmnop
    password: YourSuperSecretPassword123!
  jpa:
    properties:
      hibernate:
        default_schema: scholarspace_users
```

### 4.2 Institution Service Configuration

**File:** `institution-service/src/main/resources/application.yml`

```yaml
spring:
  datasource:
    driver-class-name: org.postgresql.Driver
    url: jdbc:postgresql://[YOUR-PROJECT-REF].supabase.co:6543/postgres?sslmode=require&currentSchema=scholarspace_institutions
    username: postgres.[YOUR-PROJECT-REF]
    password: [YOUR-PASSWORD]
  jpa:
    properties:
      hibernate:
        default_schema: scholarspace_institutions
```

### 4.3 Course Service Configuration

**File:** `course-service/src/main/resources/application.yml`

```yaml
spring:
  datasource:
    driver-class-name: org.postgresql.Driver
    url: jdbc:postgresql://[YOUR-PROJECT-REF].supabase.co:6543/postgres?sslmode=require&currentSchema=scholarspace_courses
    username: postgres.[YOUR-PROJECT-REF]
    password: [YOUR-PASSWORD]
  jpa:
    properties:
      hibernate:
        default_schema: scholarspace_courses
```

---

## Step 5: Configure SSL Connection (Important!)

Supabase requires SSL connections. Make sure your JDBC URL includes `sslmode=require`.

### 5.1 Update Connection Strings
Each connection string should include:
- `sslmode=require` parameter
- `currentSchema=[schema-name]` parameter

**Format:**
```
jdbc:postgresql://[HOST]:[PORT]/postgres?sslmode=require&currentSchema=[SCHEMA_NAME]
```

---

## Step 6: Using Environment Variables (Recommended for Security)

Instead of hardcoding passwords, use environment variables.

### 6.1 Create `.env` Files (Optional)
Create `.env` files in each service directory or use Spring Boot's environment variable support.

### 6.2 Update application.yml to Use Environment Variables

**Example for user-service:**

```yaml
spring:
  datasource:
    driver-class-name: org.postgresql.Driver
    url: jdbc:postgresql://${SUPABASE_HOST}:6543/postgres?sslmode=require&currentSchema=scholarspace_users
    username: ${SUPABASE_USER}
    password: ${SUPABASE_PASSWORD}
```

### 6.3 Set Environment Variables

**Windows PowerShell:**
```powershell
$env:SUPABASE_HOST="your-project-ref.supabase.co"
$env:SUPABASE_USER="postgres.your-project-ref"
$env:SUPABASE_PASSWORD="your-password"
```

**Windows CMD:**
```cmd
set SUPABASE_HOST=your-project-ref.supabase.co
set SUPABASE_USER=postgres.your-project-ref
set SUPABASE_PASSWORD=your-password
```

---

## Step 7: Test Your Connection

### 7.1 Start Your Services
```powershell
.\start-all-services.bat
```

### 7.2 Check Service Logs
Look for connection errors in each service's console output:
- ✅ Success: "HikariPool-1 - Starting..." followed by "HikariPool-1 - Start completed"
- ❌ Error: Look for "Connection refused" or "SSL" errors

### 7.3 Verify in Supabase Dashboard
1. Go to Supabase Dashboard
2. Click **Database** → **Tables**
3. After services start, you should see tables being created automatically (JPA will create them)

---

## Step 8: Troubleshooting

### Issue: Connection Refused
**Solution:**
- Check your Supabase project is running (dashboard shows "Active")
- Verify the host URL is correct
- Check firewall/network settings

### Issue: SSL Connection Error
**Solution:**
- Ensure `sslmode=require` is in your JDBC URL
- Check that your PostgreSQL driver version supports SSL
- Verify Supabase project allows SSL connections

### Issue: Authentication Failed
**Solution:**
- Double-check username format: `postgres.[project-ref]` for pooling, or `postgres` for direct
- Verify password is correct
- Check if your IP needs to be whitelisted (Settings → Database → Connection Pooling)

### Issue: Schema Not Found
**Solution:**
- Verify schemas were created in Step 3
- Check `currentSchema` parameter in JDBC URL
- Ensure username has permissions on schemas

### Issue: Tables Not Creating
**Solution:**
- Check `ddl-auto: update` is set in `application.yml`
- Verify schema permissions (GRANT statements)
- Check service logs for Hibernate errors

---

## Step 9: Connection Pooling vs Direct Connection

### Connection Pooling (Port 6543) - **Recommended**
- **Pros**: Better performance, handles connection spikes
- **Cons**: Slightly different username format
- **URL Format**: `postgres.[project-ref]:6543`

### Direct Connection (Port 5432)
- **Pros**: Simpler username format
- **Cons**: Limited concurrent connections (recommended for development only)
- **URL Format**: `postgres:5432`

**For Production**: Always use connection pooling (port 6543)

---

## Step 10: Security Best Practices

### 10.1 Never Commit Passwords
- ✅ Use environment variables
- ✅ Use `.env` files (add to `.gitignore`)
- ❌ Never commit passwords to Git

### 10.2 Use Supabase Connection Pooling
- Better security (connection limits)
- Better performance
- Required for production

### 10.3 Enable Row Level Security (Optional)
In Supabase, you can enable Row Level Security policies for additional data protection.

---

## Quick Reference: Connection String Template

Replace these placeholders:
- `[PROJECT-REF]`: Your Supabase project reference (found in connection string)
- `[PASSWORD]`: Your database password
- `[SCHEMA]`: `scholarspace_users`, `scholarspace_institutions`, or `scholarspace_courses`

**Template:**
```
jdbc:postgresql://[PROJECT-REF].supabase.co:6543/postgres?sslmode=require&currentSchema=[SCHEMA]
```

**Username:**
```
postgres.[PROJECT-REF]
```

**Password:**
```
[YOUR-DATABASE-PASSWORD]
```

---

## ✅ Verification Checklist

Before starting your services, verify:
- [ ] Supabase project is created and active
- [ ] Three schemas are created (or three separate projects)
- [ ] Connection strings updated in all three `application.yml` files
- [ ] SSL mode is enabled (`sslmode=require`)
- [ ] Schema names are correct in JDBC URLs
- [ ] Username and password are correct
- [ ] Environment variables set (if using)

---

## 🎉 Next Steps

After completing this setup:
1. Start your backend services: `.\start-all-services.bat`
2. Check logs for successful database connections
3. Verify tables are created in Supabase dashboard
4. Create admin user: `.\create-admin-user.ps1`
5. Start frontend and test login

---

## 📞 Need Help?

- Supabase Documentation: https://supabase.com/docs
- Supabase Support: Check your dashboard's support section
- Connection Issues: Check Supabase status page
- SSL Troubleshooting: Verify JDBC driver supports SSL

---

**Note**: Remember to keep your database password secure and never commit it to version control!


