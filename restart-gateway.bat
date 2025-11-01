@echo off
echo Restarting Gateway Service to apply new routing configuration...
echo.
echo Please:
echo 1. Stop the gateway service (Ctrl+C in its terminal)
echo 2. Restart it with: mvn spring-boot:run
echo 3. Wait for it to register with Eureka
echo.
echo The new route for /api/instructors/** has been added to route to course-service
echo.
pause