// This file manage the HTML elements that make up the Preferences dialog.
// When the dialog is closed, the server is notified of changes.
// The preferences global variable is equivalent to the python server's
// client.session object. The server is instructed to update its preferences
// object to the session object, when the user accepts the changes they made,
// thereby syncronizing the web and python objects.


// Bound to the Preferences... menu item click. This function opens the
// Preferences window and populates all section names like language, bible,
// etc. It does NOT fill in the table of values.
function openPreferencesWindow(e)
{
	document.getElementById('file_menu').style.visibility = "hidden";
	document.getElementById('file_menu_button').className = "flat_button";
	let section_div = document.getElementById('prefs_sections');
	for ( let section of Object.keys(preferences) )
	{
		let div = document.createElement("row");
		div.className = "row";
		let caps_text = section.substr(0,1).toUpperCase() + section.substr(1);
		div.innerText = caps_text;
		div.id = section;
		div.onmouseenter = toggleHover; // toggleHover define in shared.js
		div.onmouseleave = toggleHover;
		div.onclick = switchPreferenceSection;
		section_div.appendChild(div);
	}
	document.getElementById('preferences_win').style.visibility = "visible";
	document.getElementById('prefs_cancel').onclick = hidePreferencesWindow;
	document.getElementById('prefs_ok').onclick = updatePreferences;

	// Select the first section (language)
	document.getElementById('language').click();
}


function hidePreferencesWindow(e)
{
	document.getElementById('preferences_win').style.visibility = "hidden";
}

// When a section is clicked/selected, this callback is called. It changes
// the section class to being "selected" and unselects all other sections.
// Then it clears the table and inserts the section's elements such as
// name or path and their corresponding current and preferred values.
function switchPreferenceSection(e)
{
	// Manage the "selected" row styles (unselect rows first)
	for ( let child of document.getElementById('prefs_sections').children )
		child.className = "row";

	let section = preferences[e.target.id];
	e.target.className += " sel";	// This "selects" the clicked preference name

	// Empty the table of all children
	let children = document.getElementById('prefs_table').children;
	for ( let i=children.length-1; i>=0; i--  )
	{
		child = children[i];
		document.getElementById('prefs_table').removeChild(child);
	}

	console.log("Section:", section);
	// Fill with the new section data
	for ( let key of Object.keys(section) )
	{
		let tr = document.createElement("TR");
		let tdkey = document.createElement("TD");
		tdkey.innerText = key;
		tdkey.className = "c1";
		let tdvalue = document.createElement("TD");
		tdvalue.className = "c2";
		if ( typeof(section[key]) == "object" ) // An array of values
			addPreferenceListItems(tdvalue, e.target.id, section, key);
		else
		{
			let input = document.createElement("INPUT");
			input.type = "text";
			input.className = "pinput";
			input.id = key;
			input.value = section[key];
			tdvalue.appendChild(input);
		}
		tr.appendChild(tdkey);
		tr.appendChild(tdvalue);
		document.getElementById('prefs_table').appendChild(tr);
	}
}

// Used for creating sublists withing the preferences dialog for those
// preferences that have duplicate named values like 'name' in language.
function addPreferenceListItems(td, section_name, section_obj, key)
{
	for ( let value of section_obj[key] )
	{
		let row_item = document.createElement("div");
		row_item.className = "row";
		row_item.onmouseenter = toggleHover;
		row_item.onmouseleave = toggleHover;
		row_item.onclick = setPreferenceSelected;
		row_item.id = section_name + "^" + key;
		row_item.innerText = value;
		td.appendChild(row_item);
	}

	// Create a button box below the list.
	let button_box = document.createElement("DIV");
	button_box.className = "button_box";
	td.appendChild(button_box);
	let del = document.createElement('BUTTON');
	del.className = "flat_button";
	del.type = "button";
	del.id = "del" + key;
	del.innerHTML = "&ndash;";
	button_box.appendChild(del);
	let add = document.createElement('BUTTON');
	add.className = "flat_button";
	add.type = "button";
	add.id = "add" + key;
	add.innerText = '+';
	button_box.appendChild(add);
		
	
}

// A callback to tell the server to (1) update the client.session object, and
// (2) copy the client.session object to the preferences object, and (3) Write
// the preferences object to the disk.
function updatePreferences(e)
{
	hidePreferencesWindow();
	// The preferences object is actually synched with the client.session
	// object in the server. This just lets the server know the user made
	// a change to the session value(s).
	socket.send(JSON.stringify({action: 'save_prefs', preferences: preferences}));
}


// A callback to sychronize the preferences object (here) with the
// client.session object in the server. The preferences should NOT be
// touched on the server. That is why this is a different callback from
// updatePreferences() above.
function sessionValueChanged(e)
{
	socket.send(JSON.stringify({action: 'sync_session', session: preferences}));
}

// Change the class of a clicked element to make it appear selected.
// It returns all its siblings to unselected -- only single selection supported.
function setPreferenceSelected(e)
{
	let parent = e.target.parentNode;
	for ( let child of parent.children )
		child.className = "row";

	e.target.className = "row sel";
}
