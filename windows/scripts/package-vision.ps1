$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$Src = Join-Path $Root 'ai'
$Out = Join-Path $Root 'windows\dist\vision'
$AppOut = Join-Path $Out 'app'

New-Item -ItemType Directory -Force -Path $Out | Out-Null
if (Test-Path $AppOut) {
    Remove-Item -Recurse -Force $AppOut
}
Copy-Item -Recurse (Join-Path $Src 'app') $AppOut
Copy-Item (Join-Path $Src 'requirements-rtsp.txt') (Join-Path $Out 'requirements-rtsp.txt') -Force

Get-ChildItem -Path $AppOut -Recurse -Directory -Filter '__pycache__' -ErrorAction SilentlyContinue |
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

if (-not (Test-Path (Join-Path $Out 'python\python.exe'))) {
    Write-Host 'AVISO: Python embutido ausente. Rode windows\scripts\package-runtimes.ps1'
}

Write-Host "Vision empacotado em $Out"
