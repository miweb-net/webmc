var socket = undefined;

var preferences = undefined;

function connect(url)
{
	socket = new WebSocket(url);

	socket.onopen = function()
	{
		console.log("Opened web socket");
	}

	socket.onmessage = function(event)
	{
	    data = JSON.parse(event.data);
    	console.log("Received", data.type);
	    switch (data.type) {
	    	case 'identify':
	    		let name = 'app';
	    		if ( document.getElementById("editor") == undefined )
	    			name = 'importer';
				socket.send(JSON.stringify({action: 'identify', name: name}));
				setTrayIcon(name);
				break;
			case 'splash':
				configureSplash(data.label1, data.label2);
				break;
	        case 'songs':
	        	showSongs(data.songs);	// search.js
	            break;
	        case 'books':
	        	fillBooksCombo(data);	// search.js
	            break;
	        case 'stanzas':
	        	addToPartsList(data);	// search.js
	            break;
	        case 'pages':
	        	if ( data.tgt == 'parts' )
	        		displaySongUniquePages(data.paths);
	        	else
	        		displayArrangement(data.paths);
	        	break;
	        case 'organizer':
	        	// Called on startup to initialize the organizer with icons.
	        	fillOrganizer(data.organizer);
	        	break;
	        case 'icon': 	// New organizer item to add (song/bible types)
	        	data.type = data.icon_type;
	        	addIconToOrganizer(data);
	        	break;
	        case 'editor':
	        	initializeEditor(data);
	        	break;
	        case 'scripture':
	        	// Data has significant structure. Pass all of it.
	        	showScripture(data);
	        	break;
	        case 'delete': 	// Organizer delete file status from server
	        	finishDelete(data.status)
	        	break;
	        case 'config':
	        	// Initialization. The preferences object is passed in.
	        	preferences = data.preferences;
	        	break;
	        case 'folder':  // Importer chooses a folder to get PNG files.
	        	// Application also previews the image files in the folder.
	        	// Importer and Application have same named functions that
	        	// do different things. But they're each listening on a
	        	// different socket, and that's why this works.
	        	showFolderContent(data);
	        	break;
	        case 'upload': 	// App browser receives this message.
	        	if ( data.status == "error" )
	        		console.log("Upload", data.status, data.message); // Both
	        	else
        			showUploadedSong(data.song);  // App.search does this.
	        	break;
	        case 'delete_hymn':
	        	if ( data.status == "ok" )
	        	{
	        		let filter = filter_input.value;
	        		socket.send(JSON.stringify({action: 'getAllSongs', filter: filter}));
	        	}
	        	else
	        		alert("Hymn was not deleted from the database.");
	        	break;
	        case 'session_close': // Importer receives this at end of upload.
	        	if ( data.status != "error" )
	       			closeImporter();
	        	break;
	        default:
	        	console.error("Unsupported event", data.type);
	    }
	}
	socket.onclose = function()
	{
		console.log("Web socket closed");
		socket = undefined;
	}
}

function connectWS(e)
{
	if ( socket == undefined )
	{
		connect('ws:/127.0.0.1:8099');
		return;
	}
}

function autoConnect()
{
	let html = document.getElementsByTagName("html")[0];
	if ( html.clientHeight == 776 )
		connectWS();
}

connectWS();
