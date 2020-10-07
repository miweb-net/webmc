' This script must be run as cscript zenity.vbs [start_path]
' CANNOT USE wscript zenity...

Set objArgs = Wscript.Arguments

Dim objFolder, objShell
Set objShell = CreateObject("Shell.Application")
Set objFolder = objShell.BrowseForFolder(0, "Select Folder", &H023F, objArgs(0))
If Not (objFolder Is Nothing) Then
	Set objStdOut = WScript.StdOut
	WScript.StdOut.Write(objFolder.Self.path)
End If
