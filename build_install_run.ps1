$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'Install Node.js 22.12 or newer from https://nodejs.org, reopen PowerShell, and try again.' }
$NodeVersion = (& node --version).Trim()
if ($LASTEXITCODE -ne 0 -or ([version]$NodeVersion.TrimStart('v')) -lt [version]'22.12.0') { throw 'Node.js 22.12 or newer is required.' }
Write-Host 'Downloading desktop build tools (first build requires internet)...'
& npm.cmd ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
& npm.cmd run build:win
if ($LASTEXITCODE -ne 0) { throw 'Windows build failed. Check the messages above.' }
$Installer = Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot 'release') -Filter 'MOTE-Stage-Setup-*-x64.exe' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $Installer) { throw 'Installer not found in release/.' }
$InstallDir = Join-Path $env:LOCALAPPDATA 'Programs\MOTE Stage'
$AppExe = Join-Path $InstallDir 'MOTE Stage.exe'
if (Get-Process -Name 'MOTE Stage' -ErrorAction SilentlyContinue) { throw 'Close MOTE Stage, then run this script again. Your installer is in release/.' }
Write-Host 'Installing MOTE Stage for your user account...'
$Install = Start-Process -FilePath $Installer.FullName -ArgumentList "/S /D=$InstallDir" -Wait -PassThru
if ($Install.ExitCode -ne 0) { throw "Installer returned exit code $($Install.ExitCode)." }
if (-not (Test-Path -LiteralPath $AppExe)) { throw "App not found at $AppExe. Run the installer in release/ manually." }
Start-Process -FilePath $AppExe
