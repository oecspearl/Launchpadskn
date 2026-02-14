# LaunchPad SKN - Set JAVA_HOME Script
# This script helps you find and set JAVA_HOME

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Java Setup for LaunchPad SKN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Java is already accessible
try {
    $javaVersion = java -version 2>&1
    Write-Host "✓ Java is already accessible!" -ForegroundColor Green
    Write-Host $javaVersion -ForegroundColor White
    Write-Host ""
    Write-Host "JAVA_HOME should be set. Checking..." -ForegroundColor Yellow
    
    if ($env:JAVA_HOME) {
        Write-Host "✓ JAVA_HOME is set: $env:JAVA_HOME" -ForegroundColor Green
        Write-Host ""
        Write-Host "You're good to go! Try starting services:" -ForegroundColor Green
        Write-Host "  .\start-all-services.bat" -ForegroundColor White
        pause
        exit
    } else {
        Write-Host "✗ JAVA_HOME is not set (but Java works)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Java is not found in PATH" -ForegroundColor Red
}

Write-Host ""
Write-Host "Searching for Java installation..." -ForegroundColor Yellow

# Search common Java installation locations
$javaPaths = @(
    "C:\Program Files\Java",
    "C:\Program Files (x86)\Java",
    "$env:LOCALAPPDATA\Programs\Java",
    "$env:ProgramFiles\Java",
    "$env:ProgramFiles(x86)\Java"
)

$foundJava = $null

foreach ($path in $javaPaths) {
    if (Test-Path $path) {
        Write-Host "Checking: $path" -ForegroundColor Gray
        $javaDirs = Get-ChildItem $path -Directory -ErrorAction SilentlyContinue
        foreach ($dir in $javaDirs) {
            $javaExe = Join-Path $dir.FullName "bin\java.exe"
            if (Test-Path $javaExe) {
                Write-Host "  ✓ Found: $($dir.FullName)" -ForegroundColor Green
                $foundJava = $dir.FullName
                break
            }
        }
    }
}

if ($foundJava) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Found Java Installation!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Path: $foundJava" -ForegroundColor White
    Write-Host ""
    Write-Host "Setting JAVA_HOME for this session..." -ForegroundColor Yellow
    
    $env:JAVA_HOME = $foundJava
    $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
    
    Write-Host ""
    Write-Host "✓ JAVA_HOME set to: $env:JAVA_HOME" -ForegroundColor Green
    Write-Host ""
    
    # Verify
    try {
        $version = java -version 2>&1 | Select-Object -First 1
        Write-Host "✓ Java verification:" -ForegroundColor Green
        Write-Host $version -ForegroundColor White
    } catch {
        Write-Host "✗ Java still not working" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "IMPORTANT: This is only for this session!" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To make it permanent:" -ForegroundColor Cyan
    Write-Host "1. Open: System Properties → Environment Variables" -ForegroundColor White
    Write-Host "2. Add JAVA_HOME: $foundJava" -ForegroundColor White
    Write-Host "3. Add to PATH: %JAVA_HOME%\bin" -ForegroundColor White
    Write-Host "4. Restart terminal" -ForegroundColor White
    Write-Host ""
    Write-Host "Or start services in THIS terminal window now!" -ForegroundColor Green
    
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Java Not Found!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "You need to install Java JDK 17 or higher." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Recommended: Download OpenJDK from Adoptium" -ForegroundColor Cyan
    Write-Host "URL: https://adoptium.net/temurin/releases/" -ForegroundColor White
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://adoptium.net/temurin/releases/" -ForegroundColor White
    Write-Host "2. Select: Version 17 or 21, Windows, x64, JDK" -ForegroundColor White
    Write-Host "3. Download and install" -ForegroundColor White
    Write-Host "4. Run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "See SETUP_JAVA.md for detailed instructions." -ForegroundColor Yellow
}

Write-Host ""
pause


