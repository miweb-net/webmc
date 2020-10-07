
var file_menu_button = document.getElementById('file_menu_button');
file_menu_button.onclick = toggleMenuVisibility;

var edit_menu_button = document.getElementById('edit_menu_button');
edit_menu_button.onclick = toggleMenuVisibility;

var help_menu_button = document.getElementById('help_menu_button');
help_menu_button.onclick = toggleMenuVisibility;

var import_item = document.getElementById("imports");
import_item.onclick = openImportWindow;

//var prefs_item = document.getElementById("prefs_item");
//prefs_item.onclick = openPreferencesWindow; // See preferences.js

var quit_item = document.getElementById("quit_item");
quit_item.onclick = closeImporterWindow;

var user_guide = document.getElementById("guide");
user_guide.onclick = showUserGuide;

var delete_item = document.getElementById("delete");
delete_item.onclick = showDeleteDialog;

var about_item = document.getElementById('about');
about_item.onclick = showAboutDialog;

document.addEventListener('keydown', menuSpecialChars);

var importer = null;

function openImportWindow(e)
{
	if ( importer == null || importer.closed )
	{
		// Create new Importer window
		let options = "width=754,height=600"
		importer = window.open("../html/importer.html", "_blank", options);
	}
	else
	{
		// Importer window is obscurred. Raise it.
		importer.focus();
	}
	document.getElementById('file_menu').style.visibility = "hidden";
}


function closeImporterWindow(e)
{
	socket.send(JSON.stringify({action: 'quit'}));
	window.close();
}

function menuSpecialChars(e)
{
	if ( e.altKey )
	{
		if ( filter_focus )
			return; // Allow special characters to go to filter.
		if ( e.key == 'f' )
			file_menu_button.click();
		else if ( e.key == 'e' )
			edit_menu_button.click();
		else if ( e.key == 'h' )
			help_menu_button.click();
		else if ( e.key == 'p' )
			prefs_item.click();
		else if ( e.key == 'g' )
			user_guide.click();
		else if ( e.key == 'q' )
			quit_item.click();
		e.stopPropagation();
		e.preventDefault();
	}
	else if ( !e.ctrlKey )
	{
		if ( e.key == "F1" )
		{
			user_guide.click();
			e.stopPropagation();
			e.preventDefault();
		}
		else if ( e.key == "F5" )
		{
			e.stopPropagation();
			e.preventDefault();
		}
	}
	else if ( e.ctrlKey )
	{
		if ( e.key == 'i' )
			import_item.click();

	}
	//console.log(e.key);
	// Else, just let the browser handle other keyboard events.
}

// Controls the visibility style of all menus (File, Edit, Help)
// irrespective of which menu button was clicked.
function toggleMenuVisibility(e)
{
	if ( e.target.id.includes("button") )
	{
		button_obj = e.target;
		menu_id = e.target.id.substr(0, e.target.id.length-7);
	}
	else
	{
		button_obj = document.getElementById(e.target.id + "_button");
		menu_id = e.target.id;
	}
	let menu = document.getElementById(menu_id);
	let curr_visibility = menu.style.visibility;
	if ( curr_visibility == "" )
		curr_visibility = "hidden";

	let next_visibility = "hidden";
	if ( curr_visibility == "hidden" )
		next_visibility = "visible";

	// One or Zero menus will be visible. If the menu clicked is
	// hidden, it will be displayed, and vice versa. All other
	// menus will be hidden because only One or Zero can be displayed.
	for ( let menu of document.getElementsByClassName("menu") )
	{
		menu.onmouseleave = null;
		menu.style.visibility = "hidden";
	}

	// Same for their respective buttons. Only one or zero is selected.
	for ( let button of document.getElementsByTagName("nav")[0].children )
	{
		button.onmouseleave = null;
		button.className = "flat_button";
	}

	// Set the visibility of the menu
	menu.style.visibility = next_visibility;

	// And the menu button color by it's className.
	button_obj.className += " sel";

	// Bind onmouseleave events on the menu and its button.
	button_obj.onmouseleave = hideMenu;
	menu.onmouseleave = hideMenu;
}

function hideMenu(e)
{
	if ( e.target.id.includes("button") )
	{
		// Mouse exited button. Did it leave and enter its menu?
		button = e.target;
		coords = button.getClientRects()[0];
		if ( e.clientX < coords.right && e.clientX > coords.left )
			return; // User moved mouse onto the menu out of the button.
		menu = document.getElementById(e.target.id.substr(0,9));
	}
	else
	{
		// Mouse exited menu.
		menu = e.target;
		button = document.getElementById(e.target.id + "_button");
	}
	button.className = "flat_button";
	menu.style.visibility = "hidden";

}

// Dialog for deleting a selected hymn from the current database.
function showDeleteDialog(e)
{
	document.getElementById('edit_menu').style.visibility = "hidden";
	document.getElementById('edit_menu_button').className = "flat_button";
	let curr_selected = document.getElementsByClassName("row sel");
	// If no row is selected in search, ignore because we use that selection!
	if ( curr_selected.length == 0 )
		return;

	curr_selected = curr_selected[0];

	let dialog = document.getElementById('delete_win');
	dialog.style.visibility = "visible";
	document.getElementById('del_cancel').onclick = closeDeleteDialog;
	document.getElementById('del_ok').onclick = requestHymnDelete;

	let dlg_title = document.getElementById("hymn_delete_title");
	dlg_title.innerText = "Confirm Hymn Delete";

	// We'll assume the song is selected in the search dialog. Get the
	// book, title and number for the hymn.
	let index = parseInt(curr_selected.id.slice(1));
	console.log(index, songs.length);
	song = songs[index];

	document.getElementById('delbook').innerText = book_combo.value;
	document.getElementById('delnum').innerText = song['number'];
	document.getElementById('deltitle').innerText = song['title'];
}

// Callback from Delete Hymn Dialog 'ok' button. Sends request to server
// to delete the hymn selected in the search page from the database.
function requestHymnDelete(e)
{
	// The song object was already filled in by showDeleteDialog(). Just
	// send the object with the delete_hymn message type. Then hide dialog.
	socket.send(JSON.stringify({action: 'delete_hymn', id: song['id'].toString()}));
	closeDeleteDialog();
}

function closeDeleteDialog(e)
{
	document.getElementById('delete_win').style.visibility = "hidden";
}

function showUserGuide(e)
{
	document.getElementById('help_menu_button').className = "flat_button";
	document.getElementById('help_menu').style.visibility = "hidden";
	window.open("../doc/html/index.html", "_blank");
}

function showAboutDialog(e)
{
	document.getElementById('help_menu_button').className = "flat_button";
	document.getElementById('help_menu').style.visibility = "hidden";
	document.getElementById('about_dialog').style.visibility = "visible";
	document.getElementById('about_dialog').style.backgroundImage = "none";
	document.getElementById('about_dialog').style.textAlign = "center";
	document.getElementById('about_ok').onclick = closeAboutDialog;
}

function closeAboutDialog(e)
{
	document.getElementById('about_dialog').style.visibility = "hidden";
}