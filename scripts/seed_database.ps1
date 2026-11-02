# Seed ArogyaSaathi SQLite Database with Synthetic Clinical Data
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Seeding Database with Realistic Personas..." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $projectRoot "backend"
$env:PYTHONPATH = $backendDir

Set-Location $backendDir
python app/db/seed.py

