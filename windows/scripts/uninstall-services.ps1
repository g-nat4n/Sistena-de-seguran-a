#Requires -RunAsAdministrator
$ErrorActionPreference = 'Continue'
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$WinDir = Join-Path $Root 'windows'
foreach ($name in @('SmartGuardVision', 'SmartGuardApi')) {
    $exe = Join-Path $WinDir "$name.exe"
    if (Test-Path $exe) {
        & $exe stop
        & $exe uninstall
        Write-Host "Removido: $name"
    }
}
