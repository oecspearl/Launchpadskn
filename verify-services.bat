@echo off
echo ========================================
echo LaunchPad SKN - Service Verification
echo ========================================
echo.

echo Testing service endpoints...
echo.

echo [1/6] Testing Config Server (Port 8888)...
curl -s http://localhost:8888/actuator/health >nul 2>&1
if %errorlevel%==0 (
    curl -s http://localhost:8888/actuator/health | findstr "UP" >nul
    if %errorlevel%==0 (
        echo [OK] Config Server is running
    ) else (
        echo [WARNING] Config Server responded but may not be healthy
    )
) else (
    echo [ERROR] Config Server is not responding
)

echo.
echo [2/6] Testing Discovery Server (Port 8761)...
curl -s http://localhost:8761 >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Discovery Server (Eureka) is running
    echo Visit http://localhost:8761 to see registered services
) else (
    echo [ERROR] Discovery Server is not responding
)

echo.
echo [3/6] Testing API Gateway (Port 8080)...
curl -s http://localhost:8080/actuator/health >nul 2>&1
if %errorlevel%==0 (
    curl -s http://localhost:8080/actuator/health | findstr "UP" >nul
    if %errorlevel%==0 (
        echo [OK] API Gateway is running
    ) else (
        echo [WARNING] API Gateway responded but may not be healthy
    )
) else (
    echo [ERROR] API Gateway is not responding
)

echo.
echo [4/6] Testing User Service (Port 8090)...
curl -s http://localhost:8090/actuator/health >nul 2>&1
if %errorlevel%==0 (
    curl -s http://localhost:8090/actuator/health | findstr "UP" >nul
    if %errorlevel%==0 (
        echo [OK] User Service is running
    ) else (
        echo [WARNING] User Service responded but may not be healthy
    )
) else (
    echo [ERROR] User Service is not responding
)

echo.
echo [5/6] Testing Institution Service (Port 8091)...
curl -s http://localhost:8091/actuator/health >nul 2>&1
if %errorlevel%==0 (
    curl -s http://localhost:8091/actuator/health | findstr "UP" >nul
    if %errorlevel%==0 (
        echo [OK] Institution Service is running
    ) else (
        echo [WARNING] Institution Service responded but may not be healthy
    )
) else (
    echo [ERROR] Institution Service is not responding
)

echo.
echo [6/6] Testing Course Service (Port 8092)...
curl -s http://localhost:8092/actuator/health >nul 2>&1
if %errorlevel%==0 (
    curl -s http://localhost:8092/actuator/health | findstr "UP" >nul
    if %errorlevel%==0 (
        echo [OK] Course Service is running
    ) else (
        echo [WARNING] Course Service responded but may not be healthy
    )
) else (
    echo [ERROR] Course Service is not responding
)

echo.
echo ========================================
echo Verification complete!
echo ========================================
echo.
echo Next steps:
echo 1. Check Eureka Dashboard: http://localhost:8761
echo 2. Start frontend: cd frontend ^&^& npm start
echo 3. Access application: http://localhost:3000
echo.
pause

