# Create Admin User for LaunchPad SKN
# This script creates admin user via API (requires services running)
# For Supabase direct insertion, use: database/create-admin-user-supabase.sql

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating Admin User for LaunchPad SKN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: If using Supabase, you can also create users via SQL:" -ForegroundColor Yellow
Write-Host "  Run: database/create-admin-user-supabase.sql in Supabase SQL Editor" -ForegroundColor Yellow
Write-Host ""

# Check if services are running
Write-Host "Checking if services are running..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "Services are running!" -ForegroundColor Green
} catch {
    Write-Host "Services are not running. Please start all backend services first!" -ForegroundColor Red
    Write-Host "  Run: .\start-all-services.bat" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "Registering admin user..." -ForegroundColor Yellow
Write-Host ""

try {
    $body = @{
        name = "Admin User"
        email = "admin@scholarspace.com"
        password = "admin123"
        role = "ADMIN"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Headers @{"Content-Type"="application/json"} -Body $body

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Admin User Created Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Login Credentials:" -ForegroundColor Cyan
    Write-Host "  Email:    admin@scholarspace.com" -ForegroundColor White
    Write-Host "  Password: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "You can now log in at: http://localhost:3000" -ForegroundColor Yellow
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Error creating user!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible causes:" -ForegroundColor Yellow
    Write-Host "  1. User may already exist" -ForegroundColor White
    Write-Host "  2. Services may not be fully started yet" -ForegroundColor White
    Write-Host "  3. Database connection issue" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor Cyan
Write-Host "  Admin: admin@scholarspace.com / admin123" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
