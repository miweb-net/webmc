
var songs = [];
var song_name = "";

var book_combo = document.getElementById("books");
book_combo.onchange = changeBook;
book_combo.onmouseenter = showHymnCount;

var add_part = document.getElementById("add_part");
add_part.onclick = addSelectedToArranger;

var remove_part = document.getElementById("remove_part");
remove_part.onclick = removeSelectedFromArranger;

var parts = document.getElementById("parts_column");

var arranger = document.getElementById("arranger_table");

var arranger_eraser = document.getElementById("arranger_erase");
arranger_eraser.onclick = clearArranger;

var parts_eraser = document.getElementById("parts_erase");
parts_eraser.onclick = clearParts;

var audition = document.getElementById("parts_sound");
audition.onclick = playAudio;

arr_to_org = document.getElementById('arr_to_org');
arr_to_org.onclick = checkHymnPresentationFileExistence;

var preview_parts_button = document.getElementById("parts_preview");
preview_parts_button.onclick = previewPartsRequest;

var preview_arranger_button = document.getElementById("arranger_preview");
preview_arranger_button.onclick = previewArrangementRequest;

var filter_input = document.getElementById("filter_text");
filter_input.onkeyup = doSpecialProcessing;
filter_input.onfocus = filterOnFocus;
filter_input.onblur  = filterOnBlur;

var ratio_search = document.getElementById("ratio_search");
ratio_search.onchange = onSearchRatioChange;

var filter_focus = false;
var count_element = document.getElementById("hymn_count");

var hymn_path_warning = false;
var hymn_presentation_path = null;


function changeBook(e)
{
	clearArranger();
	clearParts();
	
	let index = e.target.selectedIndex;
	let book = e.target.item(index).value;
	// The server will respond with a message to repopulate the song list.
	socket.send(JSON.stringify({action: 'change_book', book: book}));
	console.log("Changing book to", book);
}


function onSearchRatioChange(e)
{
	preferences.presentation.default = ratio_search.value;
	sessionValueChanged();
	// Change the editor ratio selector to match
	ratio_select.value = ratio_search.value;
}


// The filter does event processing for multiple reasons. This function
// manages the multiple actions that need to take place when keys are
// pressed in the filter.
function doSpecialProcessing(e)
{
	// First check for special characters. If the keypress causes a special
	// character, it is critical to know this before filtering the songs.
	processSpecialCharacters(e);

	// Now filter the songs base on the content of the filter.
	let filter_text = e.target.value;
	socket.send(JSON.stringify({action: 'getAllSongs', filter: filter_text}));
}


// Receives an array of song objects for which it creates
// web elements in the DOM to display numbers and titles in a list.
function showSongs(song_array)
{
	let song_div = document.getElementById("song_div");
	let parent = document.getElementById("hymn_div");
	let meta = document.getElementById("meta_data");
	parent.removeChild(song_div);

	song_div = document.createElement("div");
	song_div.id = "song_div";
	song_div.className = "song_div";
	parent.insertBefore(song_div, meta);

	songs = song_array;
	let index = 0;
	// Song becomes a list of a single song's meta data.
	for ( let song of songs )
	{
		let row = document.createElement("div");
		let text = "";
		for ( let i=0; i<4-song['number'].toString().length; i++)
			text += '\xa0\xa0'; // &nbsp;&nbsp;
		text += song['number'] + '\xa0\xa0' + song['title']; // Number <tab> Title
		row.className = "row";
		row.id = "s" + index.toString();
		row.innerText = text;
		row.onclick = selectSongRow;
		row.ondblclick = requestPartsList;
		row.onmouseenter = toggleHover;
		row.onmouseleave = toggleHover;
		song_div.appendChild(row);
		index++;
	}
	// Display the meta-data of the first song in list;
	let first_row = document.getElementById("s0");
	first_row.click();
}


function selectSongRow(e)
{
	// Limit the search to song_div because we re-use the 'row' class elsewhere.
	let song_div = document.getElementById('song_div');
	let curr_selected = song_div.getElementsByClassName("row sel");
	for ( let row of curr_selected )
		row.className = "row";
	let index = parseInt(e.target.id.slice(1));
	e.target.className = "row sel";
	fillMetaData(index);
}


function fillMetaData(index)
{
	let song = songs[index];
	let num = document.getElementById("num");
	num.innerText = song['number'].toString();
	let title = document.getElementById("title");
	title.innerText = song['title'];
	let lyricist = document.getElementById("lyricist");
	lyricist.innerText = song['lyricist'] + ", " + song['ldate'];
	let composer = document.getElementById("composer");
	composer.innerText = song['composer'] + ", " + song['cdate'];
	let copyright = document.getElementById("copyright");
	copyright.innerText = song['copyright'];
}


// Makes a request for the verse and pages records for the
// song id that was double-clicked.
function requestPartsList(e)
{
	e.preventDefault();
	e.stopPropagation();
	let index = parseInt(e.target.id.slice(1));
	let song = songs[index];
	song_name = song['title'];
	socket.send(JSON.stringify({action: 'stanzas', id: song['id'].toString(), idx: index.toString()}));
}

// Processes the retrieved verses from the server and places
// verse information in the Parts and Arranger listboxes.
function addToPartsList(data)
{
	let index = parseInt(data.idx);
	let stanza = Object.keys(data.values).slice(1);
	let pages = Object.values(data.values).slice(1);

	// Create an object to represent the entire song parts list
	let obj = document.createElement("div");
	// Create a header to show the book, number and title
	let caption = document.createElement("div");
	caption.className = "caption";
	caption.onclick = selectPartsListSong;
	obj.className = "part_object";
	obj.appendChild(caption);
	parts.appendChild(obj);
	let tbook = document.createElement("div");
	tbook.innerText = book_combo.value;
	tbook.className = "capline1";
	let tname = document.createElement("div");
	let title = "(" + songs[index]['number'].toString() + ")\xa0\xa0";
	title += songs[index]['title'];
	tname.innerText = title;
	tname.className = "capline2";
	caption.appendChild(tbook);
	caption.appendChild(tname);

	// Add the parts below the caption
	let stanzas = document.createElement("div");
	stanzas.className = "parts_content";

	for ( let i=0; i<stanza.length; i++ )
	{
		let part = document.createElement("div");
		part.innerText = stanza[i];
		part.id = index.toString() + ":" + pages[i];
		part.className = "part_row";
		part.onclick = toggleSelected;
		stanzas.appendChild(part);
	}
	obj.appendChild(stanzas);

	preview_parts_button.disabled = false;
	audition.disabled = false;
	preview_arranger_button.disabled = false;
	arr_to_org.disabled = false;
	add_part.disabled = false;

	let arranger_table = document.getElementById("arranger_table");
	if ( arranger_table.childElementCount > 0 )
		return; // Don't fill arranger_table unless empty.

	let row_idx = 0;

	let sequence = data.values.sequence;
	for ( let i=0; i<sequence.length; i++ )
	{
		verse = sequence[i];
		let pg_index = stanza.indexOf(verse);
		let row = document.createElement("tr");
		arranger_table.appendChild(row);
		let pname = document.createElement("td");
		pname.innerText = verse;
		pname.className = "arr_part";
		let ptitle = document.createElement("td");
		ptitle.className = "arr_title";
		ptitle.innerText = songs[data.idx]['title'];
		row.className = "row";
		row.id = index.toString() + ":" + pages[pg_index];
		pname.id = index.toString() + ":" + pages[pg_index];
		ptitle.id = index.toString() + ":" + pages[pg_index];
		pname.onmousedown = arrangerDragStart;
		ptitle.onmousedown = arrangerDragStart;
		row.onmousedown = arrangerDragStart; // In drag_drop.js
		row.appendChild(pname);
		row.appendChild(ptitle);
		row_idx++;
	}

	hymn_path_warning = data.exists;
	hymn_presentation_path = data.path;
}

// Add rows to the Arranger listbox. 
function addSelectedToArranger(e)
{
	let selected_parts = document.getElementsByClassName("part_row sel");
	let arranger_table = document.getElementById("arranger_table");

	for ( let part of selected_parts )
	{
		// Only add to arranger_table if this is from a partlist object.
		if ( part.parentNode.className == "parts_content" )
		{
			let row = document.createElement("tr");
			row.className = "row";
			row.draggable = true;
			row.id = part.id;
			let pname = document.createElement("td");
			// Get the id from the part to use as a song reference.
			pname.id = part.id;
			pname.innerText = part.innerText;
			pname.className = "arr_part";
			pname.draggable = true;
			let ptitle = document.createElement("td");
			ptitle.className = "arr_title";
			ptitle.draggable = true;
			ptitle.id = part.id;
			let index = parseInt(part.id.split(":")[0]);
			ptitle.innerText = songs[index]['title'];
			pname.onmousedown = arrangerDragStart;
			ptitle.onmousedown = arrangerDragStart;
			row.onmousedown = arrangerDragStart; // In drag_drop.js
			row.appendChild(pname);
			row.appendChild(ptitle);
			arranger_table.appendChild(row);
		}
	}

}

function removeSelectedFromArranger(e)
{
	let selected_parts = arranger.getElementsByClassName("row sel");
	for ( let i=selected_parts.length-1; i>=0; i-- )
		arranger.removeChild(selected_parts[i]);

	if ( arranger.getElementsByClassName('row sel').length == 0 )
	{
		arr_to_org.disabled = true;
		remove_part.disabled = true;
		preview_arranger_button.disabled = true;
	}
}

function clearArranger(e)
{
	let arranger_table = document.getElementById("arranger_table");
	let rows = arranger_table.getElementsByClassName("row");
	for ( let i=rows.length-1; i>=0; i-- )
		arranger_table.removeChild(rows[i]);

	audition.disabled = true;
	preview_arranger_button.disabled = true;
	remove_part.disabled = true;
	hymn_path_warning = false;
	hymn_presentation_path = null;
}

function clearParts(e)
{
	let song_objects = document.getElementsByClassName("part_object");
	for ( let i=song_objects.length-1; i>=0; i-- )
		parts.removeChild(song_objects[i]);

	audition.disabled = true;
	preview_parts_button.disabled = true;
	add_part.disabled = true;
}

// A callback to switch which song is selected in the Parts list.
function selectPartsListSong(e)
{
	// The grand-children are the target elements. So get the
	// part_object grand-parent.
	let part_object = e.target.parentNode.parentNode;
	// Only one song can be selected at a time in the Parts list.
	// We remove the "sel" part from the className
	for ( let cap of document.getElementsByClassName("part_object") )
		if ( cap != part_object )
			cap.className = "part_object";
		else
			cap.className = "part_object sel";
}

// Callback for arr_to_org button click. Sends a list of song indexes
// currently represented in the arranger to the server to make a song
// presentation file. The server will send back a message to let us
// know when the file is complete so that we can display its icon in
// the organizer.
function checkHymnPresentationFileExistence(e)
{
	let song_index_array = [];
	let medley = false;
	// Get an array of song indexes to determine whether a medley.
	for ( let row of arranger.getElementsByClassName("row") )
	{
		let song_index = row.id.split(":")[0];
		if ( !song_index_array.includes(song_index) && song_index_array.length )
		{
			medley = true; // More than one unique index found.
			break;
		}
		else
			song_index_array.push(song_index);
	}

	if ( hymn_path_warning && !medley )
	{
		let dlg_title = document.getElementById("confirm_title");
		dlg_title.innerText = "Confirm File Overwrite";

		let msg_box = document.getElementById("confirm_body");

		let msg = "The file " + hymn_presentation_path + " will be overwritten. ";
		msg += "Confirm to overwrite the file, or cancel to abort.";

		msg_box.innerText = msg;
		let dialog = document.getElementById("confirm_win");
		dialog.style.visibility = "visible";

		let ok = document.getElementById("ok");
		let cancel = document.getElementById("cancel");
		ok.onclick = confirmHymnOverwrite;
		cancel.onclick = hideConfirmDialog;
	}
	else
	{
		generateHymnRequest();
		hymn_path_warning = true;
	}
}


function confirmHymnOverwrite(e)
{
	generateHymnRequest();
	hideConfirmDialog();
}

function generateHymnRequest()
{
	let song_ids = [];
	let page_ids = []; // Retain redundancy -- important!
	for ( let row of arranger.getElementsByClassName("row") )
	{
		let song_index = parseInt(row.id.split(":")[0]);
		let song_id = songs[song_index]['id']
		for ( let pg_id of row.id.split(":")[1].split(',') )
			page_ids.push(parseInt(pg_id));

		// Only unique song_indexes added here
		if ( !song_ids.includes(song_id) )
			song_ids.push(song_id);
	}

	let ratio = ratio_search.value;
	
	socket.send(JSON.stringify({action: 'generate', type: 'song', ids: song_ids, pages: page_ids, ratio: ratio}));
}


function playAudio(e)
{
	// Get the song id of the selected (primary) or only part
	let part_object = document.getElementsByClassName("part_object sel")[0];
	if ( part_object == undefined )	// Look for unselected (should be 1)
		part_object = document.getElementsByClassName("part_object")[0];

	let first_row = part_object.getElementsByClassName("part_row")[0];
	let song_index = first_row.id.split(':')[0];

	let media_id = songs[song_index]['music'];
	socket.send(JSON.stringify({action: 'audio', media_id: media_id}));
}

// Called only on successful song upload through Importer. This function
// switches view to search page because showSongs (called immediately before
// this function) does not switch to the search page. Then it scrolls the
// new title into view in the search list box.
function showUploadedSong(song)
{
	// Switch view to search.
	search_button.click();

	// Find the song title in the search box
	for ( let child of document.getElementById("song_div").children )
		if ( child.innerHTML.includes(song['title']) )
		{
			child.scrollIntoViewIfNeeded();
			child.className = "row sel";
		}
		else
			child.className = "row";

}


function toggleSelected(e)
{
	let curr_class = e.target.className;
	if ( curr_class.includes("sel") )
		e.target.className = curr_class.slice(0, curr_class.length-4);
	else
		e.target.className = curr_class + " sel";
}


function filterOnFocus(e)
{
	filter_focus = true;
}

function filterOnBlur(e)
{
	filter_focus = false;
}

function showHymnCount(e)
{
	count_element.innerText = songs.length.toString() + " hymns";
	count_element.style.visibility = "visible";
	after(4000, "count_element.style.visibility = 'hidden';");
}

// Delay loading the some scripts. They rely on the
// existence of elements withing the body tag. Since scripts
// are usually loaded prior to body, then script must be delayed.
setTimeout(function() {
    var headID = document.getElementsByTagName("head")[0];         
    var newScript = document.createElement('script');
    newScript.type = 'text/javascript';
    newScript.src = '../javascript/connect.js';
    headID.appendChild(newScript);
}, 100);