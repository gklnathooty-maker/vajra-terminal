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

# 2. Windows Desktop shortcuts (handles standard and OneDrive Desktop)
$destinations = @(
    [System.Environment]::GetFolderPath('Desktop'),
    "C:\Users\hp\Desktop",
    "C:\Users\hp\OneDrive\Desktop"
) | Select-Object -Unique

foreach ($dest in $destinations) {
    if (Test-Path $dest) {
        $lnkPath = Join-Path $dest "VAJRA TERMINAL.lnk"
        $s = $WshShell.CreateShortcut($lnkPath)
        $s.TargetPath = "wscript.exe"
        $s.Arguments = "`"$vbsPath`""
        $s.WorkingDirectory = $currentDir
        $s.IconLocation = "$icoPath,0"
        $s.Description = "VAJRA TERMINAL - Institutional Quantitative Workstation"
        $s.Save()
        Write-Host "Created shortcut: $lnkPath"
    }
}

Write-Host "Successfully configured VAJRA TERMINAL shortcuts with custom Vajra Icon!"

