var WshShell = new ActiveXObject("WScript.Shell");
var fso = new ActiveXObject("Scripting.FileSystemObject");


function ReplaceAll(strVar, old_sub, new_sub)
{
	var new_str = "";
	for ( var i=0; i<strVar.length; i++ )
	{
		var c =  strVar.substr(i, 1);
		if ( c == old_sub )
			new_str += new_sub;
		else
			new_str += c;
	}
	return new_str;
}

function Unzip(source, target)
{
	WScript.Echo("    Unzipping file " + source + " to " + target);
	var appshell = new ActiveXObject("Shell.Application");
	var zipfiles = appshell.NameSpace(source).items();
	appshell.Namespace(target).CopyHere(zipfiles);
}

var root_url = "http://weebly.simulation.com/Downloads";
var back_home = WshShell.ExpandEnvironmentStrings("%USERPROFILE%");
var home = ReplaceAll(back_home, '\\', '/');
var python_license_file = home + '/AppData/Local/Programs/Python/Python38/LICENSE.txt';

var python = 	{name: "python3.8",
				 description: "Backend engine",
				 install_check: "fso.FolderExists('C:/Program Files/Python38')",
				 url: "https://www.python.org/ftp/python/3.8.5/python-3.8.5-amd64.exe",
				 installer: "python3_installer.exe",
				 install_command: "WshShell.run('python3_installer.exe /passive InstallAllUsers=1 PrependPath=1', 2, 1)"
				};
var pylibs =    { name: "Python packages",
				 description: "websockets, python-pptx, winapi",
				 install_check: "fso.FileExists('AllwaysDoThis.txt')",
				 url: root_url + "/pylibs_installer.js",
				 installer: "pylibs_installer.js",
				 install_command: "var exCmd = WshShell.Exec('cscript.exe //E:jscript pylibs_installer.js')"
				};
var chrome = 	{name: "Google Chrome 64-bit",
				 description: "User interface and browser",
				 install_check: "fso.FileExists('C:/Users/Public/Desktop/Google Chrome.lnk')",
				 url: root_url + "/google_chrome_installer.js",
				 installer: "google_chrome_installer.js",
				 install_command: "var exCmd = WshShell.Exec('cscript.exe //E:jscript google_chrome_installer.js')"
				};
var miweb_zip =  {name: "Mountain Island Media Center",
				 description: "Creates and organizes presentations of hymns, scriptures and manually created files.",
				 install_check: "fso.FileExists('" + home + "/Miweb/webmc.cfg')",
				 url: root_url + "/miweb.zip",
				 installer: "miweb.zip",
				 install_command: "InstallMiweb();"
				};
var database =  {name: "Hymns Databases",
				 description: "Over 200 Spanish and 150 hymns of worship in the public domain.",
				 install_check: "fso.FileExists('" + home + "/Miweb/database/English Public Domain Hymns.db3')",
				 url: root_url + "/EnglishPublicDomainHymns.db3",
				 installer: "EnglishPublicDomainHymns.db3",
				 install_command: "InstallDatabases();"
				};
var presenter = {name: "Presentation Software",
				 description: "Displays hymns, scriptures and other presentations to digital displays",
				 install_check: "PresentationSoftwareCheck()",
				 url: root_url + "/LibreOffice_7.0.1_Win_x64.msi",
				 installer: "LibreOffice_7.0.1_Win_x64.msi",
				 install_command: "InstallLibreOffice();"
				};
			 
var requirements = [python,pylibs,chrome,miweb_zip,database,presenter];

function Unzip(source, target)
{
	WScript.Echo("    Unzipping file " + source + " to " + target);
	var appshell = new ActiveXObject("Shell.Application");
	var zipfiles = appshell.NameSpace(source).items();
	appshell.Namespace(target).CopyHere(zipfiles);
}

function DoDownload()
{
	WScript.Echo("    Downloading " + required.url);
	try
	{
		var install = "curl.exe -o " + required.installer + " " + required.url;
        var exCmd = WshShell.Exec(install);
        WScript.StdOut.Write("    ");
		while ( exCmd.Status == 0 )
		{
            WScript.StdOut.Write(".");
			WScript.Sleep(700);
		}

        WScript.Echo(); // Print line feed to the screen.
		return 1;	// Successful download.
	}
	catch (err)
	{
		WScript.Echo("    " + command + " failed: " + err.message);
		return 0;	// Failure to download case.
	}
}


function InstallMiweb()
{
    Unzip(WshShell.CurrentDirectory + "\\miweb.zip", back_home);
    
    // Create a desktop icon for miweb.bat
    var desktop = WshShell.SpecialFolders("Desktop");
    var shortcut = WshShell.CreateShortcut(desktop + "\\Media Center.lnk");
    shortcut.WindowStyle = 7; // Minimized (0 = Maximized, 4 = Normal)
    shortcut.IconLocation = back_home + "\\Miweb\\image\\miweb.ico";
    shortcut.TargetPath = back_home + "\\Miweb\\miweb.bat";
    shortcut.WorkingDirectory = back_home + "\\Miweb\\python";
    shortcut.Save();

    // Set the SWORD_PATH environment variable
    WshShell.run('setx.exe SWORD_PATH ' + back_home + '\\Miweb\\util\\diatheke-4.0', 2, 1);
}

function InstallDatabases()
{
    // The English Public Domain.db3 database is downloaded during the (failed) check.
    // But the Cantos Espirituales Publica.db3 database is not. Download it now.
    try
    {
        var cantos_db_url = root_url + "/CantosEspiritualesPublica.db3";
        WScript.Echo("    Downloading " + cantos_db_url);
        var process = WshShell.Exec('curl.exe -o CantosEspiritualesPublica.db3 ' + cantos_db_url);
        WScript.StdOut.Write("    ");
	    while ( process.Status == 0 )
	    {
            WScript.StdOut.Write(".");
		    WScript.Sleep(700);
	    }

        WScript.Echo(); // Print line feed to the screen.
    }
    catch(e)
    {
        WScript.Echo("    " + e.message);
    }

    // Move the database files to the Miweb/database folder.
    fso.MoveFile('EnglishPublicDomainHymns.db3', home +  '/Miweb/database/English Public Domain Hymns.db3');
    fso.MoveFile('CantosEspiritualesPublica.db3', home + '/Miweb/database/Cantos Espirituales Publica.db3');
}

function PresentationSoftwareCheck()
{
    WScript.Echo("    Looking for installed presentation software");
    var librekey = "HKLM\\Software\\The Document Foundation\\LibreOffice\\";
    var msofficekey = "HKLM\\SOFTWARE\\Microsoft\\Office\\";
    var key = 0;
    try
    {
        key = WshShell.RegRead(msofficekey);
        // Configure webmc.cfg presentation string for MSoffice.
        var changes = ReplaceConfigString("pptx=", "C:\\Program Files\\Microsoft\\Office\\powerpnt.exe,--show,<file>");
        if ( changes > 0 )
        {
            WScript.Echo("    Updated configuration key 'pptx' to 'C:\\Program Files\\Microsoft\\Office\\powerpnt.exe,--show,<file>'");
            return 1;
        }
        else
            WScript.Echo("    Did not find the key 'pptx=' in webmc.cfg file");
    }
    catch (e)
	{
        if ( e.message == 'File not found' )
        {
            WScript.Echo("    MS Office is installed on this machine.");
            var changes = ReplaceConfigString("pptx=", "C:\\Program Files\\Microsoft\\Office\\powerpnt.exe,--show,<file>");
            if ( changes > 0 )
                WScript.Echo("    Configuration key pptx=C:\\Program Files\\Microsoft\\Office\\powerpnt.exe,--show,<file>");
            return 1;
        }
        else
            WScript.Echo("    " + msofficekey + " key not found in registry");
    }
    try
    {
        key = WshShell.RegRead(librekey);
        WScript.Echo("    Libre Office is installed on this machine.");
        // Note: The default webmc.cfg value for pptx is Libre Office, so no change is necessary in this case.
        return 1;
    }
    catch (e)
	{
        WScript.Echo("    Libre Office key not found in registry");
 		return 0;
    }
}
/* The ReplaceConfigString function edits the webmc.cfg file. It looks for the provided key,
   which is a string on the left side of an '=' sign (for example, "pptx", or include the '=',
   'pptx=') and the value provided will replace any pre-existing text on that line (following
   the '=' sign.
*/
function ReplaceConfigString( key, value )
{
    var changes = 0;
    WScript.Echo("    Updating configuration file for key " + key);

    // If the provided key does not include the '=', nor does the value...
    if ( key.indexOf('=') == -1 )
        if ( value.indexOf('=') != 0 )
            value = '=' + value; // Prepend '=' to the value

    try
    {
        var readcfg = fso.OpenTextFile(home + '/Miweb/webmc.cfg', 1); // Read only mode
        var writecfg = fso.OpenTextFile("tmp.cfg", 2, 1); // Temporary file opened in write mode
        WScript.Echo("    Opened " + home + '/Miweb/webmc.cfg for reading');
        WScript.Echo("    Opened tmp.cfg for writing");
        while ( !readcfg.AtEndOfStream )
        {
           var line = readcfg.ReadLine();
            if ( line.indexOf(key) == 0 )
            {
                writecfg.WriteLine(key + value);
                changes++;
            }
            else
                writecfg.WriteLine(line);
        }
        readcfg.close();
        writecfg.close();
        fso.DeleteFile(home + '/Miweb/webmc.cfg');
        fso.MoveFile('tmp.cfg', home + '/Miweb/webmc.cfg');
     }
    catch(e)
    {
        WScript.Echo("    Error while updating configuration: " + e.message);
    }

   return changes;
}

function InstallLibreOffice()
{
    WScript.Echo("    Installing LibreOffice");
    WScript.Echo("    Please follow the installer prompts to complete presentation software installation");
    WshShell.run("LibreOffice_7.0.1_Win_x64.msi", 2, 1);
}


for ( var i=0; i<requirements.length; i++ )
{
	var required = requirements[i];
	WScript.Echo("Checking for " + required.name + " installation (" + required.description + ")");
	try
	{
		if ( eval(required.install_check) )
		{
			WScript.Echo("    " + required.name + " already installed");
			continue;
		}
		else
		{
			WScript.Echo("    " + required.install_check + " was unsuccessful");
			WScript.Echo("    " + required.name + " not installed");
			DoDownload();
		}
	}
	catch (e)
	{
		WScript.Echo(e.message);
		DoDownload();
	}
	if ( !fso.FileExists(required.installer) )
	{
		WScript.Echo("    Download failed");
		continue;
	}

	WScript.Echo("    Download complete");
	// Run the installer command for this part of the package.
	WScript.Echo("    Executing command: " + required.install_command);
	try
	{
		eval(required.install_command);
		if ( required.install_command.indexOf("var exCmd") > -1 )
		{
			var copyright = "";
			WScript.Sleep(100);
			// Read stdout of the script until it reaches the end of the MS copyright.
			while ( !exCmd.StdOut.AtEndOfStream )
			{
				copyright += exCmd.StdOut.Read(1);
				if ( copyright.indexOf('All rights reserved.') > -1 )
				{
					exCmd.StdOut.Read(1); // Read newline char that follows copyright.
					break;
				}
			}
			// Continue to read and echo stdout from spawned script until it finishes.
			var line = "";
			var onechar = "";
			while ( exCmd.Status == 0 )
			{
				while ( !exCmd.StdOut.AtEndOfStream )
				{
					// Read characters 1 at a time from the stdout stream.
					onechar = exCmd.StdOut.Read(1);
					if ( onechar == '\n' )
					{
						WScript.Echo(line);
						line = "";
					}
					else
						line += onechar;
				}
				WScript.Sleep(100);
			}
			WScript.Echo("    Ok " + exCmd.Status);
		}
	}
	catch (i_err)
	{
		WScript.Echo("    Error running " + required.install_command);
		WScript.Echo(i_err.message);
	}
		
	// Finally, re-test the install_check command to verify installation was successful.
	try
	{
		WScript.Echo("    Testing installation: " + required.install_check);
		if ( eval(required.install_check) )
			WScript.Echo("    " + required.name + " installed successfully");
		else
			WScript.Echo("    " + required.name + " installation failed.");
	}
	catch (e)
	{
		WScript.Echo("    " + required.name + " " + e.message);
	}
}
WScript.Echo("End of install.js");

