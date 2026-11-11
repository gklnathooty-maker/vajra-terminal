$WshShell = New-Object -ComObject WScript.Shell
$desktopPaths = @(
    [Environment]::GetFolderPath("Desktop"),
    "C:\Users\hp\OneDrive\Desktop",
    "C:\Users\hp\Desktop"
) | Select-Object -Unique | Where-Object { Test-Path $_ }

$currentDir = Split-Path -Parent $PSScriptRoot
$targetPath = Join-Path $currentDir "GOKS-CHART.vbs"

# Edge executable for pure native desktop window (no terminal, no PowerShell)
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
}

$appUrl = "http://127.0.0.1:8080/"
$userDataDir = Join-Path $env:APPDATA "goks-chart-desktop"

foreach ($desktop in $desktopPaths) {
    # Clean up obsolete .ps1, .bat, and old Gok Chart shortcuts that open a PowerShell/CMD console
    $obsoleteFiles = @(
        (Join-Path $desktop "GOKS_CHART.ps1"),
        (Join-Path $desktop "GOKS_CHART.bat"),
        (Join-Path $desktop "GOKS_CHART.vbs"),
        (Join-Path $desktop "Gok Chart.lnk")
    )
    foreach ($file in $obsoleteFiles) {
        if (Test-Path $file) {
            Remove-Item -Path $file -Force -Recurse -ErrorAction SilentlyContinue
            Write-Host "[desktop] Removed obsolete launcher: $file"
        }
    }

    # Primary desktop shortcut: Launch Edge in Standalone Native App Mode directly
    # This guarantees ZERO console or PowerShell windows appear on screen.
    $shortcutPath = Join-Path $desktop "GOKS CHART.lnk"
    $shortcut = $WshShell.CreateShortcut($shortcutPath)
    if (Test-Path $edgePath) {
        $shortcut.TargetPath = $edgePath
        $shortcut.Arguments = "--app=$appUrl --window-size=1440,920 --user-data-dir=`"$userDataDir`" --disable-features=TranslateUI --app-auto-launched"
        $shortcut.IconLocation = "$edgePath,0"
    } else {
        $shortcut.TargetPath = "wscript.exe"
        $shortcut.Arguments = "`"$targetPath`""
        $shortcut.WindowStyle = 7
    }
    $shortcut.WorkingDirectory = $currentDir
    $shortcut.Description = "GOKS CHART — Institutional Equity Intelligence for NSE and BSE"
    $shortcut.Save()
    Write-Host "[desktop] Native standalone shortcut created at: $shortcutPath"
}

