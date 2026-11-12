$WshShell = New-Object -ComObject WScript.Shell
$currentDir = (Get-Location).Path
$icoPath = Join-Path $currentDir "public\favicon.ico"
$vbsPath = Join-Path $currentDir "VAJRA-TERMINAL.vbs"

# 1. Project folder shortcut
$s1 = $WshShell.CreateShortcut((Join-Path $currentDir "VAJRA TERMINAL.lnk"))
$s1.TargetPath = "wscript.exe"
$s1.Arguments = "`"$vbsPath`""
$s1.WorkingDirectory = $currentDir
$s1.IconLocation = "$icoPath,0"
$s1.Description = "VAJRA TERMINAL - Institutional Quantitative Workstation"
$s1.Save()

# 2. Windows Desktop shortcut
$desktop = [System.Environment]::GetFolderPath('Desktop')
$s2 = $WshShell.CreateShortcut((Join-Path $desktop "VAJRA TERMINAL.lnk"))
$s2.TargetPath = "wscript.exe"
$s2.Arguments = "`"$vbsPath`""
$s2.WorkingDirectory = $currentDir
$s2.IconLocation = "$icoPath,0"
$s2.Description = "VAJRA TERMINAL - Institutional Quantitative Workstation"
$s2.Save()

Write-Host "Created VAJRA TERMINAL shortcut on Desktop and in folder with custom Vajra Icon!"

