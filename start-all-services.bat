@echo off
echo ========================================
echo LaunchPad SKN - Starting All Services
echo ========================================
echo.
echo This script will start all backend services in separate windows.
echo Please ensure PostgreSQL is running and databases are created.
echo.
pause

echo.
echo [1/6] Starting Config Server (Port 8888)...
start "Config Server" cmd /k "cd config-server && mvnw.cmd spring-boot:run"
timeout /t 10 /nobreak >nul
echo Config Server started (waiting for initialization)...

echo.
echo [2/6] Starting Discovery Server (Port 8761)...
start "Discovery Server" cmd /k "cd discovery && mvnw.cmd spring-boot:run"
timeout /t 10 /nobreak >nul
echo Discovery Server started...

echo.
echo [3/6] Starting API Gateway (Port 8080)...
start "API Gateway" cmd /k "cd gateway && mvnw.cmd spring-boot:run"
timeout /t 10 /nobreak >nul
echo API Gateway started...

echo.
echo [4/6] Starting User Service (Port 8090)...
start "User Service" cmd /k "cd user-service && mvnw.cmd spring-boot:run"
timeout /t 10 /nobreak >nul
echo User Service started...

echo.
echo [5/6] Starting Institution Service (Port 8091)...
start "Institution Service" cmd /k "cd institution-service && mvnw.cmd spring-boot:run"
timeout /t 10 /nobreak >nul
echo Institution Service started...

echo.
echo [6/6] Starting Course Service (Port 8092)...
start "Course Service" cmd /k "cd course-service && mvnw.cmd spring-boot:run"
timeout /t 10 /nobreak >nul
echo Course Service started...

echo.
echo ========================================
echo All backend services are starting...
echo ========================================
echo.
echo Services started in separate windows.
echo Please wait 30-60 seconds for services to fully initialize.
echo.
echo To verify services are running:
echo 1. Check Eureka Dashboard: http://localhost:8761
echo 2. Check Gateway Health: http://localhost:8080/actuator/health
echo.
echo Next: Start the frontend with:
echo   cd frontend
echo   npm install (first time only)
echo   npm start
echo.
pause

