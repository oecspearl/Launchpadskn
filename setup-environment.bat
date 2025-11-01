@echo off
echo ========================================
echo LaunchPad SKN - Environment Setup
echo ========================================
echo.

echo [1/3] Creating upload directories...
if not exist "C:\LaunchPadSKN\uploads" (
    mkdir "C:\LaunchPadSKN\uploads"
    echo Created: C:\LaunchPadSKN\uploads
) else (
    echo Directory already exists: C:\LaunchPadSKN\uploads
)

echo.
echo [2/3] Checking frontend node_modules...
if not exist "frontend\node_modules" (
    echo Node modules not found. Run 'npm install' in frontend directory.
    echo.
    echo Would you like to install now? (Y/N)
    set /p install="> "
    if /i "%install%"=="Y" (
        cd frontend
        echo Installing dependencies...
        call npm install
        cd ..
        echo.
        echo Dependencies installed!
    )
) else (
    echo Frontend dependencies found.
)

echo.
echo [3/3] Database setup reminder...
echo.
echo Please ensure PostgreSQL is running and create these databases:
echo   - scholarspace_users
echo   - scholarspace_institutions
echo   - scholarspace_courses
echo.
echo You can run: psql -U postgres -f setup-databases.sql
echo.

echo ========================================
echo Environment setup complete!
echo ========================================
echo.
echo Next steps:
echo 1. Ensure PostgreSQL databases are created
echo 2. Run: .\start-all-services.bat
echo 3. Run: cd frontend ^&^& npm start
echo.
pause

