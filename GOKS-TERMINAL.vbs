' Forward to VAJRA TERMINAL launcher
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "wscript.exe """ & strDir & "\VAJRA-TERMINAL.vbs""", 0, False
