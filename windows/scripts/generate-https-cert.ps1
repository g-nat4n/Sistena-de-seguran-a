#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'
$Out = Join-Path $env:ProgramData 'SmartGuard\certs'
New-Item -ItemType Directory -Force -Path $Out | Out-Null
$Keystore = Join-Path $Out 'smartguard-keystore.p12'
$password = 'smartguard-local'
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1 -ExpandProperty IPAddress)
if (-not $ip) { $ip = '127.0.0.1' }

keytool -genkeypair -alias smartguard -keyalg RSA -keysize 2048 -storetype PKCS12 `
  -keystore $Keystore -storepass $password -keypass $password -validity 3650 `
  -dname "CN=SmartGuard Local, OU=Loja, O=SmartGuard, L=Local, ST=SP, C=BR" `
  -ext "SAN=DNS:localhost,IP:127.0.0.1,IP:$ip"

Write-Host "Certificado gerado: $Keystore"
Write-Host "Defina no serviço:"
Write-Host "  SERVER_SSL_ENABLED=true"
Write-Host "  SERVER_SSL_KEYSTORE=$Keystore"
Write-Host "  SERVER_SSL_KEYSTORE_PASSWORD=$password"
Write-Host "Instale a confiança do certificado nos PCs clientes (navegador/OS) ou use HTTP na LAN interna."
