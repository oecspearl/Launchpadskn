@echo off
echo ========================================
echo LaunchPad SKN - Quick Backend Start
echo ========================================
echo.
echo This will start all backend services.
echo.
echo IMPORTANT: Make sure you've set your Supabase database password!
echo   Either set environment variable SUPABASE_DB_PASSWORD
echo   OR edit application.yml files with your password
echo.
pause

echo.
echo Checking if services are already running...
curl -s http://localhost:8080/actuator/health >nul 2>&1
if %errorlevel% equ 0 (
    echo WARNING: Services may already be running!
    echo Port 8080 is responding. Close existing services first?
    pause
)

echo.
echo Starting all backend services...
echo This will open 6 separate windows.
echo Please wait 30-60 seconds for services to start.
echo.
pause

call start-all-services.bat

echo.
echo ========================================
echo Services are starting...
echo ========================================
echo.
echo Wait for all services to show "Started" message.
echo Then verify at:
echo   - Gateway: http://localhost:8080/actuator/health
echo   - Eureka: http://localhost:8761
echo.
echo Once services are up, try your login again!
echo.
pause


