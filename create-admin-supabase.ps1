# LaunchPad SKN - Create Admin User via Supabase API
# This uses the Supabase REST API to create a user
# Alternative to SQL script - uses Supabase Admin API

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Create Admin User for LaunchPad SKN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Supabase Project Details
$supabaseUrl = "https://zdcniidpqppwjyosooge.supabase.co"
$supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkY25paWRwcXBwd2p5b3Nvb2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODc3NDgsImV4cCI6MjA3NDQ2Mzc0OH0.nz9oqG27mtmGzso3uPAMFoj191Qr3dz03AKUS5anXuo"

Write-Host "NOTE: This script creates a user via Supabase Auth API" -ForegroundColor Yellow
Write-Host "For direct database insertion, use: database/create-admin-user-supabase.sql" -ForegroundColor Yellow
Write-Host ""

Write-Host "Choose method:" -ForegroundColor Cyan
Write-Host "1. Use Supabase REST API (requires service running)" -ForegroundColor White
Write-Host "2. Use SQL script in Supabase Dashboard (Recommended)" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Enter choice (1 or 2)"

if ($choice -eq "2") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SQL Script Method" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Cyan
    Write-Host "1. Go to Supabase Dashboard → SQL Editor" -ForegroundColor White
    Write-Host "2. Open: database/create-admin-user-supabase.sql" -ForegroundColor White
    Write-Host "3. Copy and paste into SQL Editor" -ForegroundColor White
    Write-Host "4. Click Run" -ForegroundColor White
    Write-Host ""
    Write-Host "Credentials will be:" -ForegroundColor Yellow
    Write-Host "  Admin: admin@launchpadskn.com / Admin123!" -ForegroundColor White
    Write-Host "  Instructor: instructor@launchpadskn.com / Instructor123!" -ForegroundColor White
    Write-Host "  Student: student@launchpadskn.com / Student123!" -ForegroundColor White
    Write-Host ""
    pause
    exit
}

Write-Host ""
Write-Host "Creating admin user via API..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Make sure your backend services are running!" -ForegroundColor Yellow
Write-Host ""

try {
    # Check if gateway is running
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Gateway is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Gateway is not running. Please start services first!" -ForegroundColor Red
    Write-Host "  Run: .\start-all-services.bat" -ForegroundColor Yellow
    pause
    exit
}

Write-Host ""
Write-Host "Registering admin user via API..." -ForegroundColor Yellow

try {
    $body = @{
        name = "Admin User"
        email = "admin@launchpadskn.com"
        password = "Admin123!"
        role = "ADMIN"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" `
        -Method Post `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Admin User Created Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Login Credentials:" -ForegroundColor Cyan
    Write-Host "  Email:    admin@launchpadskn.com" -ForegroundColor White
    Write-Host "  Password: Admin123!" -ForegroundColor White
    Write-Host ""
    Write-Host "You can now log in at: http://localhost:3000" -ForegroundColor Yellow
    
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
    Write-Host "Alternative: Use SQL script in Supabase Dashboard:" -ForegroundColor Yellow
    Write-Host "  database/create-admin-user-supabase.sql" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to exit"


