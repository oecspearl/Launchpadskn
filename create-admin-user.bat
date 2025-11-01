@echo off
echo ========================================
echo Creating Admin User for LaunchPad SKN
echo ========================================
echo.
echo This script will create an admin user via the API.
echo Make sure all backend services are running first!
echo.
pause

echo.
echo Registering admin user...
echo.

powershell -Command "Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/register' -Method Post -Headers @{'Content-Type'='application/json'} -Body '{\"name\": \"Admin User\", \"email\": \"admin@scholarspace.com\", \"password\": \"admin123\", \"role\": \"ADMIN\"}'"

echo.
echo.
echo ========================================
echo Admin User Created!
echo ========================================
echo.
echo Login Credentials:
echo   Email: admin@scholarspace.com
echo   Password: admin123
echo.
echo You can now log in at: http://localhost:3000
echo.
pause

