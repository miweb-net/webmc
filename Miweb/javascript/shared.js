// This file is sourced in by the application and importer window.
// The application search tab uses fillBooksCombo and processSpecialCharacters
// functions, as does the importer window.

function fillBooksCombo(data)
{
	clearBooksCombo();
	let bklist = document.getElementById("books");
	let index = 0;
	for ( let book of data.books )
	{
		let s = book.lastIndexOf("/");
		let d = book.lastIndexOf(".");
		let name = book.slice(s + 1, d);
		let option = document.createElement("option");
		option.value = name;
		option.innerText = name;
		bklist.appendChild(option);

		if ( book.includes(data.selected) )
		{
			books.selectedIndex = index;
			console.log("Matched book index", index, "which is", name);
		}
		index++;
	}
}


function clearBooksCombo()
{
	let options = document.getElementById("books").children;
	for ( let i=options.length-1; i>=0; i-- )
		document.getElementById("books").removeChild(options[i]);
}


function processSpecialCharacters(e)
{
	if ( e.altKey )
	{
		let add_char = '';
		if ( e.key == "a" )
			add_char = "á";
		else if ( e.key == "e" )
		{
			e.preventDefault();
			e.stopPropagation();
			add_char = "é";
		}
		else if ( e.key == "i" )
		{
			e.preventDefault();
			e.stopPropagation();
			add_char = "í";
		}
		else if ( e.key == "n" )
			add_char = "ñ";
		else if ( e.key == "o" )
			add_char = "ó";
		else if ( e.key == "u" )
			add_char = "ú";
		else if ( e.key == "1" )
			add_char = "¡";
		else if ( e.key == "/" )
			add_char = "¿";

		// Insert the special character at the cursor position (where)
		let where = e.target.selectionStart;
		let new_string = e.target.value.substr(0, where) + add_char;
		new_string += e.target.value.substr(where);
		e.target.value = new_string;
	}
	// Else, just let the browser handle other keyboard events.
}


function toggleHover(e)
{
	let curr_class = e.target.className;
	if ( curr_class.includes("hov") )
		e.target.className = curr_class.slice(0, curr_class.length-4);
	else if ( event.type == "mouseleave" && curr_class.includes("sel") )
		return;
	else
		e.target.className = curr_class + " hov";
}

function setTrayIcon(icon_name)
{
	var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
	link.type = 'image/x-icon';
	link.rel = 'shortcut icon';
	link.href = '../image/' + icon_name + '.png';
	document.getElementsByTagName('head')[0].appendChild(link);
}

function after(ms_delay, dothis)
{
	//console.log("Delayed function:", dothis);
	setTimeout(function() {
    	eval(dothis);
	}, ms_delay);
}