# Launch ArogyaSaathi Interactive Web Simulator
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Starting ArogyaSaathi Simulator (Next.js)..." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$projectRoot = Split-Path -Parent $PSScriptRoot
$webDir = Join-Path $projectRoot "apps\web"

Set-Location $webDir
npm run dev

