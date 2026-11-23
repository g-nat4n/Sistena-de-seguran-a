# Empacota JRE 21 + Python portátil com deps RTSP (cliente não instala nada).
$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$Cache = Join-Path $Root 'windows\dist\cache'
$JreOut = Join-Path $Root 'windows\dist\runtime\jre'
$PyOut = Join-Path $Root 'windows\dist\vision\python'
$Req = Join-Path $Root 'ai\requirements-rtsp.txt'

New-Item -ItemType Directory -Force -Path $Cache | Out-Null

function Expand-ZipTo([string]$Zip, [string]$Dest) {
    if (Test-Path $Dest) { Remove-Item -Recurse -Force $Dest }
    New-Item -ItemType Directory -Force -Path $Dest | Out-Null
    Expand-Archive -Path $Zip -DestinationPath $Dest -Force
}

Write-Host '==> Baixando Eclipse Temurin JRE 21...'
$JreZip = Join-Path $Cache 'temurin-jre21.zip'
$JreUrl = 'https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jre/hotspot/normal/eclipse'
Invoke-WebRequest -Uri $JreUrl -OutFile $JreZip -UseBasicParsing

$JreTmp = Join-Path $Cache 'jre-extract'
if (Test-Path $JreTmp) { Remove-Item -Recurse -Force $JreTmp }
Expand-Archive -Path $JreZip -DestinationPath $JreTmp -Force
$Inner = Get-ChildItem $JreTmp -Directory | Select-Object -First 1
if (-not $Inner) { throw 'JRE zip sem pasta raiz' }
if (Test-Path $JreOut) { Remove-Item -Recurse -Force $JreOut }
New-Item -ItemType Directory -Force -Path (Split-Path $JreOut) | Out-Null
Move-Item $Inner.FullName $JreOut
Write-Host "JRE em $JreOut"

Write-Host '==> Baixando Python embeddable 3.11.9...'
$PyZip = Join-Path $Cache 'python-embed.zip'
$PyUrl = 'https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip'
if (-not (Test-Path $PyZip)) {
    Invoke-WebRequest -Uri $PyUrl -OutFile $PyZip -UseBasicParsing
}
Expand-ZipTo -Zip $PyZip -Dest $PyOut

# Habilita site-packages no embeddable
$Pth = Get-ChildItem $PyOut -Filter 'python*._pth' | Select-Object -First 1
if (-not $Pth) { throw 'python*._pth não encontrado' }
@"
python311.zip
.
Lib\site-packages
import site
"@ | Set-Content -Path $Pth.FullName -Encoding ASCII

Write-Host '==> Instalando pip + deps RTSP no Python embutido...'
$GetPip = Join-Path $Cache 'get-pip.py'
if (-not (Test-Path $GetPip)) {
    Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile $GetPip -UseBasicParsing
}
$PyExe = Join-Path $PyOut 'python.exe'
& $PyExe $GetPip --no-warn-script-location
if ($LASTEXITCODE -ne 0) { throw 'get-pip falhou' }
& $PyExe -m pip install --no-warn-script-location -r $Req
if ($LASTEXITCODE -ne 0) { throw 'pip install requirements-rtsp falhou' }

# Garante que o pacote vision app exista ao lado
$VisionApp = Join-Path $Root 'windows\dist\vision\app'
if (-not (Test-Path (Join-Path $VisionApp 'main.py'))) {
    & (Join-Path $PSScriptRoot 'package-vision.ps1')
}

Write-Host 'Runtimes prontos (JRE + Python RTSP).'
