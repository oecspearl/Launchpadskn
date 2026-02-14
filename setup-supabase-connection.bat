@echo off
echo ========================================
echo LaunchPad SKN - Supabase Connection Setup
echo ========================================
echo.
echo This script will help you configure Supabase connection.
echo.
echo Project Reference: zdcniidpqppwjyosooge
echo Host: zdcniidpqppwjyosooge.supabase.co
echo.
echo IMPORTANT: You need your DATABASE PASSWORD (not the anon key)
echo.
echo To get your password:
echo   1. Go to Supabase Dashboard
echo   2. Settings ^> Database
echo   3. Find "Connection string" section
echo   4. Click "Show" next to Database password
echo.
pause

echo.
echo Enter your Supabase database password:
set /p DB_PASSWORD="Password: "

echo.
echo Setting environment variable...
set SUPABASE_DB_PASSWORD=%DB_PASSWORD%

echo.
echo ========================================
echo Connection Configuration
echo ========================================
echo.
echo Host: zdcniidpqppwjyosooge.supabase.co
echo Port: 6543 (Connection Pooling)
echo Database: postgres
echo Username: postgres.zdcniidpqppwjyosooge
echo Password: [Set as environment variable]
echo.
echo Environment variable SUPABASE_DB_PASSWORD is set for this session.
echo.
echo The application.yml files are configured to use this variable.
echo You can also hardcode it in application.yml if preferred.
echo.
pause


