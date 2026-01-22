Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host "Docker CLI not found. Install Docker Desktop for Windows and enable Docker Compose v2."
  exit 1
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

& docker compose --profile dev up --build @args

