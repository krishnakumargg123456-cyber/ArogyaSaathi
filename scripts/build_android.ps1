# Build ArogyaSaathi Android Application
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Assembling ArogyaSaathi Android App..." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$projectRoot = Split-Path -Parent $PSScriptRoot
$mobileDir = Join-Path $projectRoot "apps\mobile"

Set-Location $mobileDir
if (Test-Path "android\gradlew.bat") {
    Set-Location (Join-Path $mobileDir "android")
    .\gradlew assembleDebug
} else {
    Write-Host "Capacitor sync required. Run 'npx cap sync android' inside apps/mobile." -ForegroundColor Yellow
}

