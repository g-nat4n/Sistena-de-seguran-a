param(
    [Parameter(Mandatory = $true)]
    [string]$SetupPath,
    [string]$TimestampUrl = 'http://timestamp.digicert.com'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $SetupPath)) {
    throw "Arquivo não encontrado: $SetupPath"
}

$certPath = $env:CSC_LINK
$password = $env:CSC_KEY_PASSWORD
if (-not $certPath) {
    throw 'Defina CSC_LINK (caminho do .pfx) e CSC_KEY_PASSWORD antes de assinar.'
}

$signtool = Get-Command signtool.exe -ErrorAction SilentlyContinue
if (-not $signtool) {
    $candidates = @(
        "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\signtool.exe",
        "${env:ProgramFiles}\Windows Kits\10\bin\*\x64\signtool.exe"
    ) | ForEach-Object { Get-Item $_ -ErrorAction SilentlyContinue } | Sort-Object FullName -Descending
    if (-not $candidates) {
        throw 'signtool.exe não encontrado. Instale o Windows SDK.'
    }
    $signtoolPath = $candidates[0].FullName
} else {
    $signtoolPath = $signtool.Source
}

$args = @(
    'sign',
    '/fd', 'SHA256',
    '/tr', $TimestampUrl,
    '/td', 'SHA256',
    '/f', $certPath
)
if ($password) {
    $args += @('/p', $password)
}
$args += $SetupPath

Write-Host "Assinando $SetupPath ..."
& $signtoolPath @args
if ($LASTEXITCODE -ne 0) {
    throw "Falha ao assinar (exit $LASTEXITCODE)"
}
Write-Host 'Assinatura OK.'
Get-AuthenticodeSignature $SetupPath | Format-List Status, SignerCertificate
