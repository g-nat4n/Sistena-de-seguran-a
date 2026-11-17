#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path (Join-Path $Root 'windows'))) {
    $Root = Split-Path -Parent $PSScriptRoot
}
$WinDir = Join-Path $Root 'windows'
$Data = Join-Path $env:ProgramData 'SmartGuard\data'
$Logs = Join-Path $env:ProgramData 'SmartGuard\logs'
New-Item -ItemType Directory -Force -Path $Data, $Logs | Out-Null

$winsw = Join-Path $WinDir 'winsw\WinSW.exe'
if (-not (Test-Path $winsw)) {
    Write-Host 'Baixando WinSW...'
    New-Item -ItemType Directory -Force -Path (Split-Path $winsw) | Out-Null
    Invoke-WebRequest -Uri 'https://github.com/winsw/winsw/releases/download/v2.12.0/WinSW-x64.exe' -OutFile $winsw
}

function Install-SgService([string]$Name, [string]$Xml) {
    $exe = Join-Path $WinDir "$Name.exe"
    Copy-Item $winsw $exe -Force
    Copy-Item (Join-Path $WinDir $Xml) (Join-Path $WinDir "$Name.xml") -Force
    & $exe stop 2>$null
    & $exe uninstall 2>$null
    & $exe install
    & $exe start
    Write-Host "Serviço $Name instalado e iniciado."
}

Install-SgService -Name 'SmartGuardApi' -Xml 'SmartGuardApi.xml'
if (Test-Path (Join-Path $Root 'ai\app')) {
    Install-SgService -Name 'SmartGuardVision' -Xml 'SmartGuardVision.xml'
}

Write-Host "Dados em: $Data"
Write-Host 'Pronto.'
