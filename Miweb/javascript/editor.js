	var editor = document.getElementById("e_scroller");
	editor.onkeyup = processSpecialCharacters;

	var reference = document.getElementById("reference");
	reference.onkeyup = waitForEnterKeyRelease;

	var version = document.getElementById("version");
	version.onchange = onVersionChange;

	var paragraph = document.getElementById('add_paragraph');
	paragraph.onclick = insertPageBreak;

	var editor_erase = document.getElementById('editor_erase');
	editor_erase.onclick = clearEditor;

	var editor_to_org = document.getElementById("editor_to_org");
	editor_to_org.onclick = checkEditorPresentationFileExistence;

	var font_sz = document.getElementById("font_sz");
	font_sz.onchange = repaginate;

	var go_to_verse = document.getElementById("editor_bible");
	go_to_verse.onclick = requestBibleVerses;

	var footer_ref = document.getElementById("ref_div");
	var footer_ver = document.getElementById("ver_div");

	var ratio_select = document.getElementById("ratio");
	ratio_select.onchange = onEditorRatioChange;

	var manual_page_breaks = []; // List of cursor positions.

	var editor_path_warning = false;
	var editor_presentation_path = null;

	var max_chars_map = new Map();

function initializeEditor(data)
{
	fillBibleVersionSelector(data.bibles, preferences.bible.version);
	fillRatioSelectors();
	font_sz.value = preferences.bible.font_sz;

	max_chars_map.set('4:3',  {25: 735, 30: 570, 35: 450, 40: 370, 45: 290, 50: 210, 55: 182});
	max_chars_map.set('16:9', {25: 580, 30: 450, 35: 400, 40: 270, 45: 275, 50: 195, 55: 165});
}


// When the reference input receives a keyrelease event...
function waitForEnterKeyRelease(e)
{
	if ( e.code == "Enter" )
		requestBibleVerses();
}


function requestBibleVerses(e)
{
	if ( reference.value.length < 6 ) return;

	let bbl_version = version.options[version.selectedIndex].value;
	socket.send(JSON.stringify({action: 'bible_rqst', version: bbl_version,
	 							ref: reference.value}));
}


function onVersionChange(e)
{
	preferences.bible.version = version.value;
	sessionValueChanged();
	requestBibleVerses();
}

function onEditorRatioChange(e)
{
	repaginate();
	preferences.presentation.default = e.target.value;
	sessionValueChanged();
	// And change the search ratio selector value to match
	ratio_search.value = e.target.value;
}


function checkEditorPresentationFileExistence(e)
{
	if ( editor_path_warning )
	{
		let dlg_title = document.getElementById("confirm_title");
		dlg_title.innerText = "Confirm File Overwrite";

		let msg_box = document.getElementById("confirm_body");

		let msg = "The file " + editor_presentation_path + " will be overwritten. ";
		msg += "Confirm to overwrite the file, or cancel to abort.";

		msg_box.innerText = msg;
		let dialog = document.getElementById("confirm_win");
		dialog.style.visibility = "visible";

		let ok = document.getElementById("ok");
		let cancel = document.getElementById("cancel");
		ok.onclick = editorConfirmOverwrite;
		cancel.onclick = hideConfirmDialog;

	}
	else
	{
		requestPresentation();
		editor_path_warning = true;
	}
}


function editorConfirmOverwrite(e)
{
	requestPresentation();
	hideConfirmDialog();
}


function requestPresentation()
{
	let bbl_version = version.options[version.selectedIndex].value;
	let sel_ratio = ratio_select.options[ratio_select.selectedIndex].value;
	let request = {action: 'bible_pres', version: bbl_version,
					ref: reference.value, text: editor.value,
					font_sz: font_sz.value, ratio: sel_ratio};

	socket.send(JSON.stringify(request));
}


function showScripture(data)
{

	// Create the passage header text (e.g. Romans 10:15-17)
	editor.value = data.passage;
	for ( let verse of data.text )
	{
		let begin = verse.indexOf(":") + 1;
		let end = verse.indexOf(": ");
		editor.value += "\n(" + verse.substr(begin, end-begin) + ") ";
		editor.value += verse.substr(end + 2);
	}

	// Save the path that will eventually be generated if the user
	// presses the to_organizer button. This saves sending a message
	// to find out whether the file exists.
	editor_path_warning = data.exists;
	editor_presentation_path = data.path;

	repaginate();
}


function fillBibleVersionSelector(version_names, selected)
{
	let index = 0;
	for ( let name of version_names )
	{
		//let s = name.lastIndexOf("/");
		//let d = name.lastIndexOf(".");
		//name = name.slice(s + 1, d);
		let option = document.createElement("option");
		option.value = name;
		option.innerText = name;
		version.appendChild(option);

		if ( selected == name )
			version.selectedIndex = index;
		index++;
	}
}

// Fill the ratio selectors in the editor and search tabs
function fillRatioSelectors()
{
	for ( selector of [ratio, ratio_search] )
	{
		let index = 0;
		for ( let ratio_value of preferences.presentation.ratio )
		{
			let option = document.createElement("option");
			option.value = ratio_value;
			option.innerText = ratio_value;
			selector.appendChild(option);

			if ( preferences.presentation.default == ratio_value )
				selector.selectedIndex = index;
			index++;
		}
	}
}


function insertPageBreak(e)
{
	let where = editor.selectionStart;
	let new_string = editor.value.substr(0, where) + "¶";
	new_string += editor.value.substr(where);
	editor.value = new_string;
	manual_page_breaks.push(where);
}


function repaginate()
{
	if ( editor.value.length == 0 )
		return;

	let unpaged = editor.value.split('¶').join('');

	// WEB version adds some [] sometimes. Filter those too.
	unpaged = unpaged.split('[]').join('');

	// Starting at the bottom of the text, begin reinserting MANUAL
	// page breaks only. Later we calculate the automatic ones...
	manual_page_breaks.sort().reverse();
	let ptr = 0;
	let repaged = "";
	for ( let brk of manual_page_breaks )
	{
		repaged += unpaged.substr(ptr, brk - ptr);
		repaged += "¶";
		ptr = brk;
	}
	repaged += unpaged.substr(ptr);
	editor.value = repaged;

	// Resizing starts here with the quadratic equation for max_chars
	// based on the current font size.
	let points = parseInt(font_sz.value);
	let curr_ratio = ratio_select.options[ratio_select.selectedIndex].value;

	// Fewer characters fit on the 16:9 aspect screen vs. 4:3 aspect.
	let max_chars = max_chars_map.get(curr_ratio)[points];

	// And set the style to change the visual text size in the editor
	editor.style.fontSize = (points / 5 - 2.4).toString() + "em";

	let size_page = "";
	let pg_count = 0;
	let i = p = 0;
	while ( true )
	{
	 	// Search for first newline that is < max_chars
	 	let frag = repaged.substr(i, max_chars);
	 	// But if the fragment is < max_chars limit, just copy all.
 		if ( frag.length < max_chars )
 		{
 			size_page += frag;
 			break;
 		}

	 	p = frag.lastIndexOf('\n');
	 	if ( p >= 0 )
	 	{
	 		// EOL found within frag.
 			size_page += frag.substr(0, p);
 			size_page += '¶' + "\n";
 			pg_count++;
		 	p++;
		 	i += p;
	 	}
	 	
	 	else	// No more EOLs
	 	{
	 		// No EOL. Possibly a long verse with large font combination.
	 		// Break text on space instead.
	 		p = frag.lastIndexOf(' ');
	 		if ( p >= 0 )	// Space found
	 		{
	 			size_page += frag.substr(0, p);
	 			size_page += '¶' + "\n";
	 			pg_count++;
	 		}
	 		else 	// No space?
	 		{
	 			break;
	 		}
	 		p++;
	 		i += p;

	 	}

	}

	editor.value = size_page;
	editor_to_org.disabled = false;
}

function clearEditor(e)
{
	editor.value = '';
	manual_page_breaks = [];
}