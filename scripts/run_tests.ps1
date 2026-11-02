# Run ArogyaSaathi Complete Automated Test Suite
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Running 10 Automated Verification Tests..." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $projectRoot "backend"
$env:PYTHONPATH = $backendDir

Set-Location $backendDir
python -m pytest app/tests/test_suite.py -v

