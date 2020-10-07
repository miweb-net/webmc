

var organizer = document.getElementById("organizer");

var trash_button = document.getElementById("org_trash");
trash_button.onclick = areYouSureDialog;

var pending_delete_confirmation = null;

function fillOrganizer(organizer_obj)
{
	// Empty the organizer, then fill it with organizer_obj(s)
	clearOrganizer();
	for ( let obj of organizer_obj )
	{
		let url = obj.path;
		let icon_type = "bible";
		if ( obj.hasOwnProperty('icon_type') )
		{
			icon_type = obj.icon_type;
		}
		else
		{
			if ( obj.type == "hymn" )
				icon_type = "hymnal";
			else if ( obj.type == "other" || obj.type == "presentation" )
				icon_type = "presentation";
		}

		// DOUBLE-CLICK is detected in drag_drop.js::organizerDragStart.
		// This is because that function cancels bubbling of the dbl-click
		// event and we would never see it in a regular event.

		let container = document.createElement("div");
		container.className = "container";

		let slash = obj.path.lastIndexOf("/") + 1;
		let dot = obj.path.lastIndexOf(".");

		let img = document.createElement("img");
		img.className = "icon";
		img.src = "../image/" + icon_type + ".png";
		let url_attribute = document.createAttribute("path");
		url_attribute.value = url;
		img.setAttributeNode(url_attribute);

		let paragraph = document.createElement("p");
		paragraph.innerText = obj.path.slice(slash, dot);
		let path_attribute = document.createAttribute("path");
		path_attribute.value = url;
		paragraph.setAttributeNode(path_attribute);

		container.appendChild(img);
		container.appendChild(paragraph);
		container.onmousedown = organizerDragStart;
		container.onmouseover = showPresentationPath;
		container.onmouseout = hidePresentationPath;

		organizer.appendChild(container);
	}
}

// Remove all icons from the Organizer. This is used when the cache
// refresh is done (and on initialization, but nothing happens then).
function clearOrganizer()
{
	let icons = organizer.getElementsByClassName('container');
	for ( let i=icons.length-1; i>=0; i-- )
		organizer.removeChild(icons[i]);
}

// Called when a new icon is needed in the organizer -- caused by
// an editor (to_organizer) or search (to_organizer) button press.
function addIconToOrganizer(organizer_obj)
{
	// Prevent creating duplicate icons by comparing the paths of
	// existing organizer icon elements to the organizer_obj.
	let exists = false;
	for ( let obj of organizer.getElementsByTagName("P") )
	{
		let slash = organizer_obj.path.lastIndexOf("/");
		let file_name = organizer_obj.path.substr(slash);
		if ( obj.getAttribute("path").includes(file_name) )
			exists = true;
	}

	if ( !exists )
	{
		let icon_type = organizer_obj.icon_type;
		let container = document.createElement("div");
		container.className = "container";

		let slash = organizer_obj.path.lastIndexOf("/") + 1;
		let dot = organizer_obj.path.lastIndexOf(".");

		let img = document.createElement("img");
		img.className = "icon";
		img.src = "../image/" + icon_type + ".png";
		let url_attribute = document.createAttribute("path");
		url_attribute.value = organizer_obj.path;
		img.setAttributeNode(url_attribute);

		let paragraph = document.createElement("p");
		paragraph.innerText = organizer_obj.path.slice(slash, dot);
		let path_attribute = document.createAttribute("path");
		path_attribute.value = organizer_obj.path;
		paragraph.setAttributeNode(path_attribute);

		container.appendChild(img);
		container.appendChild(paragraph);
		container.onmousedown = organizerDragStart;

		organizer.appendChild(container);
	}

	// Switch to organizer view.
	organize_button.click();
}

// Called from drag_drop.js:organizerDragEnd()
function organizerSelectObject(dom_object)
{
	// Iterate through the organizer's children in order and get their
	// file paths. This is used to update the .organizer.txt file in
	// the server program.
	for ( let item of organizer.children )
	{
		if ( item == dom_object )
			dom_object.className = "container sel";
		else
			item.className = "container";

	}

	trash_button.disabled = false;

	// Possible order change occurred. Send server message to update
	// the .organizer.txt sequence file.
	requestOrganizerFileUpdate();
}

function displayPresentationRequest(img)
{
	let url = img.getAttribute("path");
	console.log("Requesting to display", url);
	socket.send(JSON.stringify({action: 'display', path: url}));
}


function areYouSureDialog(e)
{
	let dlg_title = document.getElementById("confirm_title");
	dlg_title.innerText = "Confirm File Delete";

	let msg_box = document.getElementById("confirm_body");

	// Get the selected presentation file name
	let selected = document.getElementsByClassName("container sel")[0];
	let paragraph = selected.getElementsByTagName("P")[0];
	let name = paragraph.innerText;

	let msg = "The file " + name + " will be permanently deleted. ";
	msg += "Confirm to delete the file, or cancel to abort.";

	msg_box.innerText = msg;
	let dialog = document.getElementById("confirm_win");
	dialog.style.visibility = "visible";

	let ok = document.getElementById("ok");
	let cancel = document.getElementById("cancel");
	ok.onclick = sendConfirmMessage;
	cancel.onclick = hideConfirmDialog;
 }


 function sendConfirmMessage(e)
 {
 	let selected = document.getElementsByClassName("container sel")[0];
	let paragraph = selected.getElementsByTagName("P")[0];
	let path = paragraph.getAttribute("path");
	socket.send(JSON.stringify({action: 'delete', path: path}));
 	hideConfirmDialog();

 	// If this is a scripture presentation file, notify editor that
 	// this file no longer exists.
 	if ( path.includes('scripture') )
 	{
 		editor_path_warning = false;
 		editor_presentation_path = null;
 	}
 	else if ( path.includes('hymn') )
 	{
 		// Same for hymn presentation deletion.
 		hymn_path_warning = false;
 		hymn_presentation_path = null;
 	}

 	// Placeholder for the response message so we know what to delete
 	// when confirmation is received.
 	pending_delete_confirmation = selected;
 }

 function finishDelete(status)
 {
 	if ( status == "ok" || status == "does not exist" )
 	{
 		pending_delete_confirmation.parentNode.removeChild(pending_delete_confirmation);
 		requestOrganizerFileUpdate();
  	}

 	pending_delete_confirmation = null;	
 }

 function hideConfirmDialog(e)
 {
 	let dialog = document.getElementById("confirm_win");
	dialog.style.visibility = "hidden";
 }


// Calls the server to write the Organizer's icon sequence to cache.
function requestOrganizerFileUpdate()
{
	let objects = [];
	for ( let container of organizer.children )
	{
		let paragraph = container.getElementsByTagName("P")[0];

		let icon = container.getElementsByTagName("IMG")[0];
		let icon_type = "presentation";
		if ( icon.src.includes("hymnal") )
			icon_type = "hymn";
		else if ( icon.src.includes("bible") )
			icon_type = "scripture";

		let obj = {path: paragraph.getAttribute("path"),
				   type: icon_type};
		objects.push(obj);
	}
	socket.send(JSON.stringify({action: 'org_update', items: objects}));
}


function showPresentationPath(e)
{
	let hover_obj = e.target;

	// Read the path attribute from the paragraph element.
	if ( !e.target.hasAttribute("path") )
		hover_obj = e.target.children[0];

	let path = hover_obj.getAttribute("path");
	document.getElementById("tool_tip_msg").innerText = path;
	let tool_tip = document.getElementById("tool_tip");
	tool_tip.style.left = "330px";
	tool_tip.style.top = "32px";
	tool_tip.style.visibility = "visible";
}


function hidePresentationPath(e)
{
	document.getElementById("tool_tip").style.visibility = "hidden";
}