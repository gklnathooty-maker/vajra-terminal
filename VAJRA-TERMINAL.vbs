' ==============================================================================
' VAJRA TERMINAL - Native Desktop Workstation Launcher
' Works 100% Online & Offline
' ==============================================================================
Option Explicit
Dim WshShell, fso, scriptDir, appUrl, browserExe, path, candidates
Dim i, isRunning, launchCmd

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

appUrl = "http://localhost:8080/?key=VAJRA2026"

' 1. Fast & reliable offline/online loopback probe using native Windows curl.exe
Function IsServerResponsive()
    Dim cmd, code
    On Error Resume Next
    cmd = "cmd.exe /c curl.exe -s -o NUL -f --max-time 1 http://127.0.0.1:8080/"
    code = WshShell.Run(cmd, 0, True)
    If Err.Number = 0 And code = 0 Then
        IsServerResponsive = True
    Else
        IsServerResponsive = False
    End If
    On Error GoTo 0
End Function

' 2. Start workstation server if not responsive
If Not IsServerResponsive() Then
    WshShell.CurrentDirectory = scriptDir
    WshShell.Run "cmd.exe /c npm.cmd run dev", 0, False
    
    ' Poll until server is ready (wait up to 35 seconds for cold start/bundling)
    isRunning = False
    For i = 1 To 70
        WScript.Sleep 500
        If IsServerResponsive() Then
            isRunning = True
            Exit For
        End If
    Next
    
    ' Extra safety margin to allow routes to bind
    If isRunning Then
        WScript.Sleep 400
    End If
End If

' 3. Detect standalone desktop browser runtime (Edge or Chrome in Native App mode)
candidates = Array( _
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe", _
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe", _
    "C:\Program Files\Google\Chrome\Application\chrome.exe", _
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe", _
    WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Microsoft\Edge\Application\msedge.exe", _
    WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Google\Chrome\Application\chrome.exe" _
)

browserExe = ""
For Each path In candidates
    If fso.FileExists(path) Then
        browserExe = path
        Exit For
    End If
Next

' 4. Launch in Native Desktop Window Mode (No browser chrome, native desktop workstation frame)
If browserExe <> "" Then
    launchCmd = """" & browserExe & """ --app=""" & appUrl & """ --window-size=1440,920 --disable-features=TranslateUI --disable-extensions --app-auto-launched"
    WshShell.Run launchCmd, 1, False
Else
    WshShell.Run appUrl, 1, False
End If
