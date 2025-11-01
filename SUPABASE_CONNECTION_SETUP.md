# LaunchPad SKN - Supabase Connection Setup

## Your Supabase Project Details

**Project Reference:** `zdcniidpqppwjyosooge`  
**Host:** `zdcniidpqppwjyosooge.supabase.co`  
**Database:** `postgres`  
**Port (Connection Pooling):** `6543`  
**Port (Direct):** `5432`  
**Username (Pooling):** `postgres.zdcniidpqppwjyosooge`  
**Username (Direct):** `postgres`

## ⚠️ IMPORTANT: Get Your Database Password

The password you need is **NOT** the anon key. You need your **database password**:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/zdcniidpqppwjyosooge
2. Click **Settings** (gear icon) → **Database**
3. Scroll to **Connection string** section
4. Click **Show** next to "Database password"
5. Copy that password (or reset it if needed)

**This is the password you'll use in the application.yml files below.**

---

## Step 1: Run Database Schema

Before connecting the services, run the schema setup:

1. In Supabase Dashboard → **SQL Editor**
2. Run: `database/schema-redesign.sql`
3. This creates all tables for the Caribbean Secondary School architecture

---

## Step 2: Update Service Configuration Files

The configuration files have been updated below. Replace `[YOUR-DATABASE-PASSWORD]` with your actual database password from Step 1.


