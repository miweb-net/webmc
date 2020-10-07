// This previewer.js script contains callbacks for rendering images

var splash_div = document.getElementById('splash');

function previewPartsRequest(e)
{
	// Song *may* be selected in Parts listbox
	let part_object = document.getElementsByClassName("part_object sel")[0];
	if ( part_object == undefined )	// Look for unselected (should be 1)
		part_object = document.getElementsByClassName("part_object")[0];

	let rows = part_object.getElementsByClassName("part_row");
	let song_index = rows[0].id.split(':')[0];

	let pages = [];
	for ( let row of rows )
		for ( let pg of row.id.split(':')[1].split(',') )
			pages.push(pg);
	
	requestSongPages(song_index, pages, "(Unique Parts)");
}

function previewArrangementRequest(e)
{
	// Get all of the pages in order. We won't track which song
	// (in medleys) that the page belongs to here, but rather in
	// displayArrangement(), below.
	let arranger_table = document.getElementById("arranger_table");
	let song_index = arranger_table.children[0].id.split(':')[0];

	let pages = [];
	for ( let row of arranger_table.children )
		for ( let pg of row.id.split(':')[1].split(',') )
			pages.push(pg);

	requestSongPages(song_index, pages, "(Arrangement)");
}

function requestSongPages(song_index, pages, subtitle_text)
{
	song = songs[song_index];
	emptyPreviewer();

	let title_row = document.getElementById("preview_header");
	title_row.innerText = "(" + song['number'].toString() + ")\t" + song['title'];

	let subtitle = document.getElementById("preview_subtitle");
	subtitle.innerText = subtitle_text;

	let target = "arranger";
	if ( subtitle_text.includes("Unique Parts") )
		target = "parts";

	socket.send(JSON.stringify({action: 'pages', pages: pages, tgt: target}));
}


function displaySongUniquePages(paths)
{
	splash_div.style.visibility = "hidden";

	// Add the new img for each path
	let i = 0;
	for ( let path of paths )
	{
		let pg_num = document.createElement("div");
		pg_num.className = "page_number";
		pg_num.innerText = "Page: " + (i + 1).toString();
		let img = document.createElement("img");
		img.src = path;
		if ( i % 2 )
			img.className = "odd page";
		else
			img.className = "even page";
		i++;
		scroller.appendChild(pg_num);
		scroller.appendChild(img);
	}

	// Switch to the preview tab
	scroller.scrollTo(0, 5);
	preview_button.click();
}


// Supports the Importer window. It shows the pages in the previewer
// that are contained in a folder opened by the Importer action.
function showFolderContent(data)
{
	emptyPreviewer();
	displaySongUniquePages(data.image_files);

	// Use the data.folder attribute to set the title in the
	// Previewer window.
	let preview_hdr = document.getElementById("preview_header");
	let slash = data['folder'].lastIndexOf('/');
	if ( slash == null || slash == undefined )
		slash = data['folder'].lastIndexOf('\\');
	let title = data['folder'].substr(slash + 1);

	preview_hdr.innerText = title;
}


function displayArrangement(paths)
{
	emptyPreviewer();
	splash_div.style.visibility = "hidden";

	// The arrangement can contain the same image(s) multiple times
	// Iterate through the arranger_table rows to manage images sent to previewer.
	let titles = [];
	let numbers = [];
	let i = 0;

	let arranger_table = document.getElementById("arranger_table");
	
	for ( let row of arranger_table.children )
	{
		let song_index = parseInt(row.id.split(':')[0]);
		let title = songs[song_index]['title'];
		let number = songs[song_index]['number'];
		if ( !titles.includes(title) )
		{
			titles.push(title);
			numbers.push(number);
		}

		for ( let pg of row.id.split(':')[1].split(',') )
			for ( let path of paths )
				if ( path.includes(pg) )
				{
					let pg_num = document.createElement("div");
					pg_num.className = "page_number";
					pg_num.innerText = "Page: " + (i + 1).toString();
					let img = document.createElement("img");
					img.src = path;
					if ( i % 2 )
						img.className = "odd page";
					else
						img.className = "even page";
					i++;
					scroller.appendChild(pg_num);
					scroller.appendChild(img);
					break;
				}
	}

	let title_row = document.getElementById("preview_header");
	let title_text = '(' + numbers[0] + ') ' + titles[0];

	if ( titles.length > 1 )
	{
		title_text = "Medley:\t"
		for ( let i=0; i<titles.length; i++ )
		{
			title_text += "(" + numbers[i].toString() + ")\t" + titles[i];
			title_text += "\n\t";
		}
		title_text = title_text.slice(0, title_text.length-2);
	}

	title_row.innerText = title_text;

	scroller.scrollTo(0, 5);
	preview_button.click();
}


// Configures the text for the 2 labels on the splash page
function configureSplash(label1, label2)
{
	let lab1 = document.getElementById("splash-label-1");
	lab1.innerText = label1;
	let lab2 = document.getElementById("splash-label-2");
	lab2.innerText = label2;
}

function emptyPreviewer()
{
	let scroller = document.getElementById('scroller');
	let children = scroller.children;
	// Clean up the list for adding pages.
	for ( let i=children.length-1; i>=0; i-- )
		scroller.removeChild(children[i]);

	// And clear the title element.
	document.getElementById("preview_header").innerText = "";

}