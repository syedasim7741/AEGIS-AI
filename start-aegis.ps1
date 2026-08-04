param(
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
$BackendPath = Join-Path $ProjectRoot "aegis-ai-backend"
$FrontendPath = Join-Path $ProjectRoot "aegis-ai-frontend"

$BackendActivationScript = Join-Path `
    $BackendPath `
    ".venv\Scripts\Activate.ps1"

$FrontendPackageFile = Join-Path `
    $FrontendPath `
    "package.json"

Write-Host ""
Write-Host "========================================"
Write-Host "Starting AEGIS AI"
Write-Host "========================================"
Write-Host ""

if (-not (Test-Path $BackendActivationScript)) {
    throw "Backend virtual environment was not found at: $BackendActivationScript"
}

if (-not (Test-Path $FrontendPackageFile)) {
    throw "Frontend package.json was not found at: $FrontendPackageFile"
}

$BackendCommand = @"
Set-Location '$BackendPath'
& '.\.venv\Scripts\Activate.ps1'
Write-Host 'Starting AEGIS AI backend...'
uvicorn app.main:app --reload
"@

$FrontendCommand = @"
Set-Location '$FrontendPath'
Write-Host 'Starting AEGIS AI frontend...'
npm run dev
"@

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    $BackendCommand
)

Start-Sleep -Seconds 3

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    $FrontendCommand
)

if (-not $NoBrowser) {
    Start-Sleep -Seconds 5
    Start-Process "http://localhost:5173"
}

Write-Host "Backend terminal started."
Write-Host "Frontend terminal started."

if (-not $NoBrowser) {
    Write-Host "Browser opening at http://localhost:5173"
}

Write-Host ""
Write-Host "Keep both terminal windows open."
Write-Host ""
