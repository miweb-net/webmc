
var book_combo = undefined;

var song = {};

var hymntitle = document.getElementById("hymntitle");

var public_domain = document.getElementById("copycheck");
public_domain.onchange = copyrightToggle;

var field_status = undefined;

var bgcolor = ['red', 'blue', 'yellow', 'green', 'orange',
			   'lightgray', 'tan', 'turquoise', 'brown'];

var language = "foo";

function initializeImporter()
{

	for ( let step of document.getElementsByClassName("step") )
		step.onclick = goToStep;
	document.getElementById("step1").className = "step sel";
	document.getElementById("page1").style.visibility = "visible";

	let date = (new Date()).toLocaleDateString('en');
	let slash = date.lastIndexOf("/");
	let year = date.substr(slash + 1);

	document.getElementById("cpyrightdate").max = year;

	for ( let id of ['hymnnumber', 'cpyrightdate', 'owner'] )
	{
		let input = document.getElementById(id);
		input.onkeyup = validateStep1;
	}
	hymntitle.onkeyup = doSpecialProcessing;
	document.getElementById('lyricist').onkeyup = processSpecialCharacters;
	document.getElementById('composer').onkeyup = processSpecialCharacters;

	document.getElementById("next").onclick = goToStep;
	document.getElementById("back").onclick = goToStep;
	document.getElementById("cancel").onclick = closeImporter;
	document.getElementById("lang").onclick = fillPartNamesList;
	document.getElementById("clear").onclick = clearSequenceList;
	document.getElementById("choosefolder").onclick = requestFolderDialog;

	validateAllSteps();
	public_domain.click();

	after(500, "fillPartNamesList();");
}


function doSpecialProcessing(e)
{
	// First look for special characters
	processSpecialCharacters(e);
	// Then validate as with other fields.
	validateStep1(e);
}


function validateStep1(e)
{

	let field_status = "ok";
	if ( document.getElementById("hymntitle").value.length < 5 )
	{
		document.getElementById("labeltitle").className = "required error";
		field_status = "no";
	}
	else
		document.getElementById("labeltitle").className = "required";

	let curr_number_sz = document.getElementById("hymnnumber").value.length;
	if ( curr_number_sz == 0 || curr_number_sz > 5 )
	{
		document.getElementById("labelnumber").className = "required error";
		field_status = "no";
	}
	else
		document.getElementById("labelnumber").className = "required";

	if ( !public_domain.checked )
	{
		let cpy_date = document.getElementById("cpyrightdate");
		let date = cpy_date.value;
		if ( cpy_date.min > date || cpy_date.max < date )
		{
			field_status = "no";
			document.getElementById("labelcpydate").className = "optional error";
		}
		else
			document.getElementById("labelcpydate").className = "optional";

		if ( document.getElementById("owner").value.length < 7 )
		{
			field_status = "no";
			document.getElementById("labelowner").className = "optional error";
		}
		else
			document.getElementById("labelowner").className = "optional";

		let copyright = "©" + cpy_date.value.toString() + ", ";
		copyright += document.getElementById("owner").value;
		document.getElementById("sample").value = copyright;
	}

	let currclass = document.getElementById("step1").className;
	if ( field_status == "ok" )
	{
		document.getElementById("next").disabled = false;
		if ( currclass.includes("error") )
			currclass = currclass.replace(" error", "");
	}
	else
	{
		document.getElementById("next").disabled = true;
		if ( !currclass.includes("error") )
			currclass += " error";
	}
	document.getElementById("step1").className = currclass;

	return field_status;
}

function validateStep2()
{
	let field_status = "ok";
	let step_class = document.getElementById("step2").className;
	if ( document.getElementById("sequencelist").children.length )
	{
		if ( step_class.includes(" error") )
			step_class = step_class.replace(" error", "");
	}
	else
	{
		if ( !step_class.includes(" error") )
			step_class += " error";
		field_status = "no";
	}

	document.getElementById("step2").className = step_class;
	return field_status;
}

function validateStep3()
{
	let field_status = "ok";
	for ( let path of document.getElementById("pathlist").children )
		if ( path.style.backgroundColor == "" )
			field_status = "no";

	if ( document.getElementById("pathlist").children.length == 0 )
		field_status = "no";

	let class_name = document.getElementById("step3").className;
	if ( field_status == "ok" )
	{
		if ( class_name.includes(" error") )
			class_name = class_name.replace(" error", "");
	}
	else
	{
		if ( !class_name.includes(" error") )
			class_name += " error";
	}
	document.getElementById("step3").className = class_name;
	return field_status;
}

function getActiveStep()
{
	for ( let step of document.getElementsByClassName("step") )
	{
		if ( step.className.includes("sel") )
			return step;
	}

	return null;
}

function validateAllSteps()
{
	let step1 = validateStep1();
	let step2 = validateStep2();
	let step3 = validateStep3();
	let active_step = getActiveStep();

	if ( active_step.id == "step1" )
		if ( step1 == "ok" )
			document.getElementById("next").disabled = false;
		else
			document.getElementById("next").disabled = true;
	if ( active_step.id == "step2" )
		if ( step2 == "ok" )
			document.getElementById("next").disabled = false;
		else
			document.getElementById("next").disabled = true;
	if ( active_step.id == "step3" )
		if ( step3 == "ok" )
			document.getElementById("next").disabled = false;
		else
			document.getElementById("next").disabled = true;
	if ( active_step.id == "step4" )
		if ( step1 == "ok" && step2 == "ok" && step3 == "ok" )
			document.getElementById("next").disabled = false;
		else
			document.getElementById("next").disabled = true;
}


// Callback that provides a data object containing PNG paths from a requested
// folder. The function fills the importer source listbox with these
// file names.
function showFolderContent(data)
{
	// Clear the pathlist & audiolist boxes of all elements.
	// New folder contents arrived.
	for ( let listid of ["pathlist", "audiolist"] )
	{
		let list = document.getElementById(listid);

		for (let i=list.children.length-1; i>=0; i-- )
		{
			let child = list.children[i];
			list.removeChild(child);
		}
	}

	for ( let path of data.image_files )
	{
		let slash = path.lastIndexOf("/");
		let short_path = path.substr(slash+1);
		let row = document.createElement("DIV");
		let fullpath = document.createAttribute('fullpath');
		fullpath.value = path;
		row.setAttributeNode(fullpath);
		row.className = "path";
		row.innerText = short_path;
		row.onmouseenter = pathElementEnter;
		row.onmouseleave = pathElementLeave;
		row.onclick = pairFileWithPartName;
		pathlist.appendChild(row);
	}

	let audiolist = document.getElementById("audiolist");
	let index = 0;
	for ( let audio_file of data.audio_files )
	{
		let row = document.createElement("DIV");
		let fullpath = document.createAttribute('fullpath');
		fullpath.value = audio_file;
		row.setAttributeNode(fullpath);
		if ( index )
			row.className = "row";
		else
			row.className = "row sel";
		let slash = audio_file.lastIndexOf("/");
		let short_path = audio_file.substr(slash+1);
		row.innerText = short_path;
		row.onmouseenter = toggleHover;
		row.onmouseleave = toggleHover;
		audiolist.appendChild(row);
		index++;
	}
}


function requestFolderDialog(e)
{
	let start_path = document.getElementById("importpath").value;
	socket.send(JSON.stringify({action: 'browse', start: start_path}));
}

// Main page controller. Gets called from "Next", "Back" and "Step"
// elements. It determines which element caused this event to be
// triggered, and then makes decisions on what page to display based
// on that information.
function goToStep(e)
{
	let next = document.getElementById("next");
	let back = document.getElementById("back");
	let activate = undefined;
	let leaving = document.getElementsByClassName("step sel")[0];

	if ( e.target == next )
	{
		let i = parseInt(leaving.id.substr(4)) + 1;
		activate = document.getElementById("step" + i.toString());
	}
	else if ( e.target == back )
	{
		let i = parseInt(leaving.id.substr(4)) - 1;
		activate = document.getElementById("step" + i.toString());
	}
	else if (e.target.className.includes("step") )
		activate = e.target;

	if ( activate == undefined )
	{
		// Reached upload time.
		uploadToDatabase();
		return;
	}

	if ( activate.id != "step1" )
		back.disabled = false;


	for ( let i=0; i<document.getElementsByClassName("step").length; i++ )
	{
		let idx = (i + 1).toString();
		let step = document.getElementById("step" + idx);
		if ( step.className.includes(" sel") )
			step.className = step.className.replace(" sel", "");
		let page = document.getElementById("page" + idx);
		page.style.visibility = "hidden";
	}

	activate.className += " sel";
	validateAllSteps();
	let idx = activate.id.substr(activate.id.length-1);
	document.getElementById("page" + idx).style.visibility = "visible";

	if ( activate.id == "step3" )
		fillUniquePartsList();

	if ( activate.id == "step4" )
	{
		document.getElementById("next").innerText = "Upload";
		buildSummaryPage();
	}
	else
		document.getElementById("next").innerText = "Next";

	document.getElementById("importpath").value = preferences.importer.path;
}


function copyrightToggle(e)
{
	let state = "unset";
	if ( public_domain.checked )
		state = "hidden";

	let divs = ['copydatediv', 'copyrightdiv', 'copysamplediv'];
	for ( let div of divs )
		document.getElementById(div).style.visibility = state;
}


function fillPartNamesList()
{
	if ( language == "foo" )
		language = preferences.language.default;
	else if ( language == "English" )
		language = "Spanish";
	else
		language = "English";
	
	let part_names = ["Verse 1","Verse 2","Verse 3","Verse 4","Verse 5",
					  "Verse 6","Refrain","Chorus", "Chorus 2",
					  "Optional Ending", "1st Ending", "2nd Ending"];
	if ( language == "Spanish")
		part_names = ["Verso 1","Verso 2","Verso 3","Verso 4","Verso 5",
					  "Verso 6", "Coro","Final Opcional"];

	let partlist = document.getElementById("partlist");
	let children = partlist.children;
	for ( let i=children.length-1; i>=0; i-- )
	{
		let child = children[i];
		partlist.removeChild(child);
	}

	for ( let pname of part_names )
	{
		let row = document.createElement("DIV");
		row.innerText = pname;
		row.className = "row";
		row.ondblclick = copyToSequenceList;
		row.onmouseenter = toggleHover;
		row.onmouseleave = toggleHover;
		partlist.appendChild(row);
	}

	clearSequenceList();
}


function clearSequenceList(e)
{
	let sequencelist = document.getElementById("sequencelist");
	let children = sequencelist.children;
	for ( let i=children.length-1; i>=0; i-- )
	{
		let child = children[i];
		sequencelist.removeChild(child);
	}
}


function copyToSequenceList(e)
{
	e.stopPropagation();
	e.preventDefault();
	let sequencer = document.getElementById("sequencelist");
	let row = document.createElement("DIV");
	row.className = "row";
	row.innerText = e.target.innerText;
	row.onmouseenter = toggleHover;
	row.onmouseleave = toggleHover;
	row.ondblclick = removeRowFromSequenceList;
	sequencer.appendChild(row);

	document.getElementById("next").disabled = false;
}


function removeRowFromSequenceList(e)
{
	let sequencer = document.getElementById("sequencelist");
	sequencer.removeChild(e.target);
	document.getElementById("next").disabled = true;
}


// Step 3 Part Names must copy the names of the Step 2
// (Arrangement Order) Part Sequence list
function fillUniquePartsList()
{
	let partnamelist = document.getElementById("partlist2");

	for ( let i=partnamelist.children.length-1; i>=0; i-- )
	{
		let child = partnamelist.children[i];
		partnamelist.removeChild(child);
	}

	let arrangement = document.getElementById("sequencelist").children;
	let uniquelist = [];
	let index = 0;
	for ( let part of arrangement )
	{
		let pname = part.textContent;
		if ( !uniquelist.includes(pname) )
		{
			uniquelist.push(pname);
			let newrow = document.createElement("DIV");
			newrow.textContent = pname;
			if ( index )
				newrow.className = "row";
			else
				newrow.className = "row sel";
			newrow.style.backgroundColor = bgcolor[index];
			newrow.onclick = selectPartRow;
			newrow.onmouseenter = toggleHover;
			newrow.onmouseleave = toggleHover;
			partnamelist.appendChild(newrow);
			index++;
		}
	}
}


function selectPartRow(e)
{
	let curr_selected = document.getElementsByClassName("row sel");
	for ( let row of curr_selected )
		row.className = "row";
	let index = parseInt(e.target.id.slice(1));
	e.target.className = "row sel";

	// Create a CSS rule to match the hover color of paths to the 
	// selected Part Name background.
	let rule = ".path.hov {background-color: " + e.target.style.backgroundColor;
	let style = document.createElement('style');
	document.head.appendChild(style);
	style.sheet.insertRule(rule);
}



function pairFileWithPartName(e)
{
	let selected_part = document.getElementsByClassName("row sel")[0];
	if ( e.target.style.backgroundColor == selected_part.style.backgroundColor )
		e.target.style.backgroundColor = "";
	else
		e.target.style.backgroundColor = selected_part.style.backgroundColor;

	// Step 4 manage the next button. If all paired, enable Next
	let disabled = false;
	for ( let path of document.getElementById("pathlist").children )
		if ( path.style.backgroundColor == "" )
			disabled = true;

	document.getElementById("next").disabled = disabled;
}

function getPathPartMap()
{
	let pname_rows = document.getElementById("partlist2").children;
	let path_row = document.getElementById("pathlist").children;

	if ( path_row.length == 0 ) return;

	let row_type = "normal";
	let row = 0;
	// Create a row for each path
	let num_files = 0;
	let prev_color = null;
	let last_name_col = null;
	for ( let i=0; i<path_row.length; i++ )
	{
		let path = path_row[i].getAttribute('fullpath');
		let table_row = document.createElement("TR");
		let col2 = document.createElement("TD");	// Path column
		col2.innerText = path;
		col2.className = "rightcol";

		// Add a part name column element if color changed.
		if ( prev_color == null || prev_color != path_row[i].style.backgroundColor )
		{
			// Look for color change ONLY. If change, then the PREVIOUS name
			// column rowSpan must be configured.
			if ( prev_color != null ) // There was a color CHANGE
			{
				let prev_name_col = document.getElementsByClassName("leftcol")[row-1];
				prev_name_col.rowSpan = num_files;
			}

			prev_color = path_row[i].style.backgroundColor;
			let col1 = document.createElement("TD");	// Part name column
			last_name_col = col1;
			col1.innerHTML = pname_rows[row].textContent;
			col1.className = "leftcol";
			if ( row_type != "normal" )
			{
				col1.className += " even";
				row_type = "normal";
			}
			else
				row_type = "even";

			table_row.appendChild(col1);
			row++;
			num_files = 0;
		}
		num_files++;
		if ( row_type == "normal" )
			col2.className += " even";
		table_row.appendChild(col2);
		document.getElementById("summtable").appendChild(table_row);
	}

	// Rowspan the last name col element.
	last_name_col.rowSpan = num_files;

	// Selected audio file
	let audiolist = document.getElementById("audiolist");
	let selected_audio = audiolist.getElementsByClassName("row sel")[0];

	let audio_row = document.createElement("TR");
	let name_item = document.createElement("TD");
	name_item.className = "leftcol";
	name_item.innerText = "Audio";
	let path_item = document.createElement("TD");
	path_item.className = "rightcol";
	path_item.innerText = selected_audio.getAttribute('fullpath');
	if ( row == "normal" )
	{
		name_item.className += " even";
		path_item.className += " even";
	}
	audio_row.appendChild(name_item);
	audio_row.appendChild(path_item);
	document.getElementById("summtable").appendChild(audio_row);
}

function buildSummaryPage()
{
	// Create a song object to pass to the server.
	song = {};
	let text = document.getElementById("hymntitle").value;
	song['title'] = text;
	document.getElementById("mtitle").innerText = text;
	text = document.getElementById("hymnnumber").value;
	song['number'] = text;
	document.getElementById("mnumber").innerText = text;
	text = document.getElementById("books").value;
	song['book'] = text;
	document.getElementById("mdb").innerText = text;
	text = document.getElementById("lyricist").value;
	if ( text == "" )
		text = "Unknown";
	song['lyricist'] = text;
	let date = document.getElementById("ldate").value;
	if ( date == "" )
		date = "Unknown";
	text += ", " + date;
	song['ldate'] = date;
	document.getElementById("mlyrics").innerText = text;
	text = document.getElementById("composer").value;
	if ( text == "" )
		text = "Unknown";
	song['composer'] = text;
	date = document.getElementById("cdate").value;
	if ( date == "" )
		date = "Unknown";
	text += ", " + date;
	song['mdate'] = date;
	document.getElementById("mcomposer").innerText = text;
	if ( document.getElementById("copycheck").checked )
		text = "Public Domain";
	else
		text = document.getElementById("sample").value;
	document.getElementById("mcopy").innerText = text;
	song['copyright'] = text;

	// Clear all path mapping information, ready to refill.
	for ( let column of ['leftcol', 'rightcol'] )
	{
		let elements = document.getElementsByClassName(column);
		for ( let i=elements.length-1; i>=0; i-- )
		{
			let child = elements[i];
			child.parentNode.removeChild(child);
		}
	}
	getPathPartMap();
	validateAllSteps();
}

function uploadToDatabase()
{
	// The meta data (title, number, lyricist, composer, copyright) were
	// all inserted into the song record in buildSummaryPage(). The last
	// steps before sending a request to the server (with the song object)
	// is to add the verse sequence and pages that go with the verses.

	// Create a unique list of part names. This is used by the server to know
	// what part names comprise this song, and how to extract the paths from
	// the song[<Verse 1>] part dict for example.
	song['verses'] = [];

	// Read the mapped paths from the summary page.
	song['paths'] = [];
	for ( let path_row of document.getElementsByClassName("rightcol") )
		if ( path_row.innerText.includes(".png") )
			song['paths'].push(path_row.innerText);

	// Map the names to the paths on the summary page. This is a list
	// of uniquely named parts (duplicates are removed).
	let row_count = 0;
	for ( let name_row of document.getElementsByClassName("leftcol") )
	{
		// Give the server a list of verses to look for in the resulting
		// dictionary it receives.
		song['verses'].push(name_row.innerText);

		// Array to hold the page indexes.
		song[name_row.innerText] = [];
		// Page indexes already read in previous loop. Should be sequential.
		// Use the rowSpan property to determine how many path indexes to add.
		for ( let row=0; row<parseInt(name_row.rowSpan); row++ )
			song[name_row.innerText].push(row + row_count);
		row_count += parseInt(name_row.rowSpan);
	}

	song['sequence'] = [];
	// Need to create a sequence list that represents the hymn ARRANGEMENT.
	for ( let row of document.getElementById("sequencelist").children )
		song['sequence'].push(row.textContent);

	let selected_audio = audiolist.getElementsByClassName("row sel")[0];
	if ( selected_audio != undefined )
		song['audio'] = selected_audio.getAttribute('fullpath');
	else
		song['audio'] = "";
	socket.send(JSON.stringify({action: 'upload', song: song}));
}


// Changes the background color and opacity of the hovered path
function pathElementEnter(e)
{
	e.target.className = "path hov";
}

// Restores the background color and opacity of the hovered path
function pathElementLeave(e)
{
	e.target.className = "path";
}

function closeImporter(e)
{
	window.close();
}
initializeImporter();