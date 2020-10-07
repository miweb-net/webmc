

window.onclick = advancePage;

var page = 0;
var total_pages = 3;

function advancePage(e)
{
	for ( let p of document.getElementsByClassName("page") )
		p.style.visibility = "hidden";

	page++;
	if ( page == (total_pages + 1) )
	{
		blankScreen();
		return;
	}
	else if ( page == (total_pages + 2) )
	{
		window.close();
		return;
	}

	let id = "page" + page.toString();
	let visible = document.getElementById(id);
	visible.style.visibility = "visible";
}

function blankScreen()
{
	for ( let div of document.getElementsByTagName("div") )
		div.style.visibility = "hidden";
}

advancePage();
