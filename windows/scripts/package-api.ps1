$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$Backend = Join-Path $Root 'backend'
$Out = Join-Path $Root 'windows\dist\api'
New-Item -ItemType Directory -Force -Path $Out | Out-Null
Push-Location $Backend
try {
    .\mvnw.cmd -q -DskipTests package
    Copy-Item 'target\smartguard-api-0.0.1-SNAPSHOT.jar' (Join-Path $Out 'smartguard-api.jar') -Force
    Write-Host "API empacotada em $Out"
} finally {
    Pop-Location
}
