Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strDir

edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
If Not fso.FileExists(edgePath) Then
    edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
End If
If Not fso.FileExists(edgePath) Then
    edgePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
End If

userDataDir = WshShell.ExpandEnvironmentStrings("%APPDATA%") & "\goks-chart-desktop"

If fso.FileExists(edgePath) Then
    WshShell.Run """" & edgePath & """ --app=http://127.0.0.1:8080/ --window-size=1440,920 --user-data-dir=""" & userDataDir & """", 1, False
Else
    WshShell.Run "node """ & strDir & "\scripts\launch-desktop.mjs""", 0, False
End If

