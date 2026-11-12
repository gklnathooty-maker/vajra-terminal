' VAJRA TERMINAL - Zero-Terminal Silent Desktop Launcher
' Starts the background server if not already running, waits until ready, then launches the browser
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

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

' If server is down, start it silently in the background
If Not IsServerRunning() Then
    WshShell.Run "cmd /c cd /d """ & scriptDir & """ && npm run dev", 0, False
    
    ' Poll every 600ms until Vite is actually ready (up to 15 seconds)
    ready = False
    For i = 1 To 25
        WScript.Sleep 600
        If IsServerRunning() Then
            ready = True
            Exit For
        End If
    Next
End If

' Open default browser directly to the terminal
WshShell.Run "http://localhost:8080/?key=VAJRA2026", 1, False
