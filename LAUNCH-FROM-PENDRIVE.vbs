' ==============================================================================
' VAJRA TERMINAL - Silent Portable Pendrive Launcher
' Double-click this to launch the desktop workstation without any black terminal box
' ==============================================================================
Option Explicit
Dim WshShell, fso, scriptDir, appUrl, browserExe, path, candidates
Dim i, isRunning, launchCmd, nodeExe, startEngineCmd

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
appUrl = "http://localhost:8080/?key=VAJRA2026"

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

' Start portable engine if not already running
If Not IsServerResponsive() Then
    WshShell.CurrentDirectory = scriptDir
    If fso.FileExists(scriptDir & "\runtime\node.exe") Then
        nodeExe = """" & scriptDir & "\runtime\node.exe"""
    Else
        nodeExe = "node"
    End If
    startEngineCmd = "cmd.exe /c " & nodeExe & " """ & scriptDir & "\scripts\with-app-env.mjs"" vite dev --host 0.0.0.0 --port 8080"
    WshShell.Run startEngineCmd, 0, False
    
    ' Wait for server to become responsive
    isRunning = False
    For i = 1 To 70
        WScript.Sleep 500
        If IsServerResponsive() Then
            isRunning = True
            Exit For
        End If
    Next
    If isRunning Then
        WScript.Sleep 500
    End If
End If

' Detect browser (Edge or Chrome in native application window mode)
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

If browserExe <> "" Then
    launchCmd = """" & browserExe & """ --app=""" & appUrl & """ --window-size=1440,920 --disable-features=TranslateUI --disable-extensions --app-auto-launched"
    WshShell.Run launchCmd, 1, False
Else
    WshShell.Run appUrl, 1, False
End If
