# webmc
Worship Media Center with hymn databases

This is the README.md file for the Mountain Island Media Center 
The Media Center was created to enable displaying of Spanish (and English) language hymns,
bible texts and arbitrary presentation files, such as sermons, on large screen televisions
and through projectors.

The hymn databases on which the Media Center relies can be downloaded separately. However,
2 databases are included (Cantos Espirituales Publica, and English Public Domain Hymns) in
each release.

Hymns are being added to the databases as they become available. Database may be updated
independently from the code.

The code is comprised of 3 primary technologies: The database (sqlite3), the server (python3)
and the user interface (html, javascript and CSS). These terms are used in the change history
to distinguish what was changed in the code over time. Database updates are not recorded here.

Code Change History

1.2.5
Adjusted toolbar and Editor down so that the toolbar is fully displayed and clickable.

Reverted the replacement of spaces in hymn titles with underscore symbols. The solution to
launching presentation software with hymn file names containing spaces is handled in configuration.

Client.py deleteFile moved logging into the 'try' clause to effectively make delete work and
log properly.

1.2.4
No code changes. This is the first zipped version.

1.2.3
Logging added to webmc.py to show version and date of application, and the browser command so
we know what browser is being used.

Preferences logging improved to detect erroneous classes/keys in webmc.cfg. Also made the log
file size a configured parameter.

Moved the log file size management to the webmc.py file to roll log file earlier if rolling is
necessary.

1.2.2
Bug fix to Organizer when deleting hymn files, the icons didn't get removed, but the files were
deleted. Problem was with variable null checking.

Bug fix to Windows paths. Windows does not enjoy using file names that contain spaces and
sometimes '?'. Paths are now renamed in the client.py (server side) prior to being written. Spaces
are now replaced with '_' and '?' are replaced with ''.

Bug fix to search.js. When user selected a song and displayed parts in previewer, then switched 
databases and (without clearing the parts or arranger listboxes) pressed the to_previewer button
(either above the arranger or parts list), the previewer still showed the previous hymn images,
but the hymn title and number were from the current datbase (if the hymn index existed).
Fix: When the database is switched, the arranger and parts lists are cleared using existing
functions that also manage their respective button controls above them (disabling to_previewer 
for both lists).

1.2.1
Added rollover log files (1-5) to the miweb.log schema. At 50KB (hard coded now but may be 
configurable in a later release), the file roles over a new file, and miweb5.log is deleted. Fixed 
bug with previewer: Previewer was displaying a hymn title that did not match the hymn images. Images
were correct; title was incorrect.

1.1.1
Enabled the use of Spanish language-specific characters in the scripture editor. Fixed a bug with
the Importer such that when images were displayed in the previewer, the title of the song was not
being displayed. Changed the menu and shortcut key for starting the Importer (was Alt-i, now Ctrl-i).
CSS changes to editor select element down arrow placements (version and ratio selectors).

1.1.0
Added tooltip to Organizer page to display the file path for the selected icon (on hover). Added a
refresh feature to the Organizer when its button (tab) is clicked. Updated the editor's max_characters
array, for both the 4:3 and 16:9 screen ratios (performed insito on MI equipment).

1.0.1
Improved CSS (styling) configuration for better Look and Feel of web controls. Effected web client
search (hymn selection) and editor (scripture selection) page layouts.

1.0.0
A fully functioning program set including the python server and the web client, written in html,
javascript and CSS for deployment and testing on the Mountain Island Spanish congregation sound room,
which is a Microsoft Windows 10 operating system. After installation of all required components, the 
miweb.cfg file was adjusted to reference external programs such as the browser (MS Edge configured), 
diatheke (for fetching scriptures) and VLC (for playing midi file samples).
