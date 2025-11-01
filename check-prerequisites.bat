@echo off
echo ========================================
echo LaunchPad SKN - Prerequisites Check
echo ========================================
echo.

echo Checking Java...
java -version >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Java is installed
    java -version
) else (
    echo [ERROR] Java is NOT installed or not in PATH
    echo Please install JDK 17 or higher
)
echo.

echo Checking Node.js...
node -v >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Node.js is installed
    node -v
) else (
    echo [ERROR] Node.js is NOT installed or not in PATH
    echo Please install Node.js 14 or higher
)
echo.

echo Checking npm...
npm -v >nul 2>&1
if %errorlevel%==0 (
    echo [OK] npm is installed
    npm -v
) else (
    echo [ERROR] npm is NOT installed or not in PATH
)
echo.

echo Checking Maven (optional)...
mvn -v >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Maven is installed (optional)
) else (
    echo [INFO] Maven not found - will use Maven Wrapper (mvnw)
)
echo.

echo Checking PostgreSQL connection...
psql --version >nul 2>&1
if %errorlevel%==0 (
    echo [OK] PostgreSQL client is available
    echo [INFO] Please verify PostgreSQL server is running
    echo [INFO] Databases needed: scholarspace_users, scholarspace_institutions, scholarspace_courses
) else (
    echo [WARNING] PostgreSQL client not found in PATH
    echo [INFO] Please verify PostgreSQL server is running manually
)
echo.

echo ========================================
echo Checking Port Availability
echo ========================================
echo.

echo Checking port 8080 (Gateway)...
netstat -ano | findstr :8080 >nul
if %errorlevel%==0 (
    echo [WARNING] Port 8080 is in use
) else (
    echo [OK] Port 8080 is available
)

echo Checking port 8090 (User Service)...
netstat -ano | findstr :8090 >nul
if %errorlevel%==0 (
    echo [WARNING] Port 8090 is in use
) else (
    echo [OK] Port 8090 is available
)

echo Checking port 8091 (Institution Service)...
netstat -ano | findstr :8091 >nul
if %errorlevel%==0 (
    echo [WARNING] Port 8091 is in use
) else (
    echo [OK] Port 8091 is available
)

echo Checking port 8092 (Course Service)...
netstat -ano | findstr :8092 >nul
if %errorlevel%==0 (
    echo [WARNING] Port 8092 is in use
) else (
    echo [OK] Port 8092 is available
)

echo Checking port 8761 (Discovery)...
netstat -ano | findstr :8761 >nul
if %errorlevel%==0 (
    echo [WARNING] Port 8761 is in use
) else (
    echo [OK] Port 8761 is available
)

echo Checking port 8888 (Config Server)...
netstat -ano | findstr :8888 >nul
if %errorlevel%==0 (
    echo [WARNING] Port 8888 is in use
) else (
    echo [OK] Port 8888 is available
)

echo Checking port 3000 (Frontend)...
netstat -ano | findstr :3000 >nul
if %errorlevel%==0 (
    echo [WARNING] Port 3000 is in use
) else (
    echo [OK] Port 3000 is available
)

echo.
echo ========================================
echo Prerequisites check complete!
echo ========================================
echo.
pause

