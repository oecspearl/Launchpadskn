@echo off
echo ========================================
echo LaunchPad SKN - Database Setup
echo ========================================
echo.
echo This script will help you create the required PostgreSQL databases.
echo.
echo Prerequisites:
echo   1. PostgreSQL must be installed and running
echo   2. You need PostgreSQL superuser (postgres) access
echo.
pause

echo.
echo Step 1: Connect to PostgreSQL
echo.
echo You can connect using one of these methods:
echo.
echo Method 1: Using psql command line
echo   psql -U postgres
echo.
echo Method 2: Using pgAdmin (GUI)
echo   1. Open pgAdmin
echo   2. Connect to your PostgreSQL server
echo   3. Right-click "Databases" -^> "Create" -^> "Database"
echo.
echo Method 3: Run SQL script directly
echo   psql -U postgres -f setup-databases.sql
echo.
pause

echo.
echo Step 2: Creating databases...
echo.
echo Once connected to PostgreSQL, run these SQL commands:
echo.
echo CREATE DATABASE scholarspace_users;
echo CREATE DATABASE scholarspace_institutions;
echo CREATE DATABASE scholarspace_courses;
echo.
echo Or use the provided SQL file:
echo   psql -U postgres -f setup-databases.sql
echo.
pause

echo.
echo Step 3: Verify databases were created
echo.
echo In psql, run:
echo   \list
echo.
echo You should see:
echo   - scholarspace_users
echo   - scholarspace_institutions
echo   - scholarspace_courses
echo.
pause

echo.
echo ========================================
echo Important Notes:
echo ========================================
echo.
echo - Default database password: Jayjay_1
echo   (Configured in application.yml files)
echo.
echo - Tables will be created automatically
echo   when services start (JPA ddl-auto: update)
echo.
echo - If you change the password, update it in:
echo   - user-service/src/main/resources/application.yml
echo   - institution-service/src/main/resources/application.yml
echo   - course-service/src/main/resources/application.yml
echo.
pause

