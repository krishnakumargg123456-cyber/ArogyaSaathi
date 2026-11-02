# Launch ArogyaSaathi FastAPI Backend Server
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Starting ArogyaSaathi Backend (FastAPI)..." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $projectRoot "backend"
$env:PYTHONPATH = $backendDir

Set-Location $backendDir
python -m alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    Write-Error "Database migration failed; the API server was not started."
    exit $LASTEXITCODE
}

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
