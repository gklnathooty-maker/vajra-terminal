' VAJRA TERMINAL - Zero-Terminal Silent Desktop Launcher
' Starts the background server if not already running and launches your default browser
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Check if local port 8080 is reachable
Function IsServerRunning()
    On Error Resume Next
    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    http.setTimeouts 1000, 1000, 1000, 1000
    http.open "GET", "http://127.0.0.1:8080/", False
    http.send
    If Err.Number = 0 Then
        IsServerRunning = True
    Else
        IsServerRunning = False
    End If
    On Error GoTo 0
End Function

If Not IsServerRunning() Then
    WshShell.Run "cmd /c cd /d """ & scriptDir & """ && npm run dev", 0, False
    WScript.Sleep 2500
End If

WshShell.Run "http://127.0.0.1:8080/", 1, False
