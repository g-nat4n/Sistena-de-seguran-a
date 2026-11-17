$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$iniciar = Join-Path $PSScriptRoot 'INICIAR.bat'

$desktopCandidates = @(
    [Environment]::GetFolderPath('Desktop'),
    (Join-Path $env:USERPROFILE 'Desktop'),
    (Join-Path $env:USERPROFILE 'OneDrive\Desktop')
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique

foreach ($desktop in $desktopCandidates) {
    $lnkPath = Join-Path $desktop 'SmartGuard AI.lnk'
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($lnkPath)
    $shortcut.TargetPath = $iniciar
    $shortcut.WorkingDirectory = $root
    $shortcut.WindowStyle = 7
    $shortcut.Description = 'Iniciar SmartGuard AI no PC'
    $shortcut.Save()
    Write-Host "Atalho criado: $lnkPath"
    break
}
