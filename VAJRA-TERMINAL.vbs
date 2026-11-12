' ==============================================================================
' VAJRA TERMINAL - Native Desktop Workstation Launcher
' Opens as a true standalone desktop application window (Online & Offline)
' ==============================================================================
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' 1. Helper to probe local server responsiveness
Function IsServerRunning()
    On Error Resume Next
    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    http.setTimeouts 800, 800, 800, 800
    http.open "GET", "http://127.0.0.1:8080/", False
    http.send
    If Err.Number = 0 And (http.status >= 200 And http.status < 400) Then
        IsServerRunning = True
    Else
        IsServerRunning = False
    End If
    On Error GoTo 0
End Function

' 2. Start background workstation engine if not running
If Not IsServerRunning() Then
    WshShell.Run "cmd /c cd /d """ & scriptDir & """ && npm run dev", 0, False
    
    ' Wait until local workstation engine is responsive (up to 15s)
    For i = 1 To 25
        WScript.Sleep 600
        If IsServerRunning() Then Exit For
    Next
End If

' 3. Detect standalone desktop browser runtime (Edge or Chrome in Native App mode)
Dim appUrl, browserExe, dataDir
appUrl = "http://localhost:8080/?key=VAJRA2026"
appData = WshShell.ExpandEnvironmentStrings("%APPDATA%")
dataDir = appData & "\vajra-terminal-desktop"

browserExe = ""
candidates = Array( _
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe", _
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe", _
    "C:\Program Files\Google\Chrome\Application\chrome.exe", _
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" _
)

For Each path In candidates
    If fso.FileExists(path) Then
        browserExe = path
        Exit For
    End If
Next

' 4. Launch in Native Desktop Window Mode (No browser bars, no tabs, native window)
If browserExe <> "" Then
    Dim launchCmd
    launchCmd = """" & browserExe & """ --app=""" & appUrl & """ --window-size=1440,920 --user-data-dir=""" & dataDir & """ --disable-features=TranslateUI --disable-extensions --app-auto-launched"
    WshShell.Run launchCmd, 1, False
Else
    ' Fallback to default browser
    WshShell.Run appUrl, 1, False
End If
