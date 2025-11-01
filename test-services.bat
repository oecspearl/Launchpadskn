@echo off
echo Testing LaunchPad SKN Microservices...
echo.

echo 1. Testing Discovery Service (Eureka)...
curl -s http://localhost:8761/eureka/apps | findstr "UP" >nul
if %errorlevel%==0 (
    echo ✓ Discovery Service is running
) else (
    echo ✗ Discovery Service is not responding
)

echo.
echo 2. Testing Gateway...
curl -s http://localhost:8080/actuator/health | findstr "UP" >nul
if %errorlevel%==0 (
    echo ✓ Gateway is running
) else (
    echo ✗ Gateway is not responding
)

echo.
echo 3. Testing User Service...
curl -s http://localhost:8090/actuator/health | findstr "UP" >nul
if %errorlevel%==0 (
    echo ✓ User Service is running
) else (
    echo ✗ User Service is not responding
)

echo.
echo 4. Testing Institution Service...
curl -s http://localhost:8091/actuator/health | findstr "UP" >nul
if %errorlevel%==0 (
    echo ✓ Institution Service is running
) else (
    echo ✗ Institution Service is not responding
)

echo.
echo 5. Testing Course Service...
curl -s http://localhost:8092/actuator/health | findstr "UP" >nul
if %errorlevel%==0 (
    echo ✓ Course Service is running
) else (
    echo ✗ Course Service is not responding
)

echo.
echo 6. Testing Department API through Gateway...
curl -s -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:8080/api/departments | findstr "departmentId" >nul
if %errorlevel%==0 (
    echo ✓ Departments API is accessible through Gateway
) else (
    echo ✗ Departments API is not accessible (check authentication)
)

echo.
echo Test completed. If any service shows as not responding, please start it before testing instructor assignment.
pause