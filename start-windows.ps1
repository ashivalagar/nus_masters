# Start Masters Mind on Windows (PowerShell).
#   Right-click > Run with PowerShell, or:  powershell -ExecutionPolicy Bypass -File .\start-windows.ps1
# Optional:  -Tunnel   also starts ngrok (needs ngrok installed and NGROK_DOMAIN set in .env)
#            -Local    no password, this PC only (127.0.0.1)
param([switch]$Tunnel, [switch]$Local)
$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

function Fail($msg) { Write-Host "`n$msg" -ForegroundColor Red; Read-Host 'Press Enter to close'; exit 1 }

# 1. Node 22+
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { Fail 'Node.js is not installed. Install the LTS version (22 or newer) from https://nodejs.org and run this again.' }
$ver = (node -p "process.versions.node")
if ([int]($ver.Split('.')[0]) -lt 22) { Fail "Node $ver is too old. Install Node 22 LTS or newer from https://nodejs.org." }
Write-Host "Node $ver found."

# 2. .env (password etc.)
if (-not (Test-Path '.env')) {
  Copy-Item '.env.example' '.env'
  Fail "Created .env from .env.example. Open .env in Notepad, set MASTERS_PASSWORD, save, and run this again.`n  notepad .env"
}
Get-Content '.env' | ForEach-Object {
  if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$' -and -not $_.TrimStart().StartsWith('#')) {
    $v = $Matches[2].Trim().Trim('"').Trim("'")
    if (-not [Environment]::GetEnvironmentVariable($Matches[1])) { [Environment]::SetEnvironmentVariable($Matches[1], $v) }
  }
}

# 3. dependencies (first run only)
if (-not (Test-Path 'node_modules')) {
  Write-Host 'Installing dependencies (first run)...'
  npm install --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { Fail 'npm install failed. Check your internet connection and try again.' }
}

# 4. optional ngrok tunnel in its own window
if ($Tunnel) {
  $ng = Get-Command ngrok -ErrorAction SilentlyContinue
  if (-not $ng) { Write-Host 'ngrok not found on PATH; starting without a tunnel.' -ForegroundColor Yellow }
  else {
    $port = if ($env:PORT) { $env:PORT } else { '8080' }
    $args = @('http', $port)
    if ($env:NGROK_DOMAIN) { $args += "--url=$($env:NGROK_DOMAIN)" }
    Start-Process -FilePath 'ngrok' -ArgumentList $args
    Write-Host "ngrok started in a new window ($($args -join ' '))."
  }
}

# 5. build if needed, then serve
$extra = @()
if ($Local) { $extra += '--insecure-local' }
node scripts/start.mjs @extra
