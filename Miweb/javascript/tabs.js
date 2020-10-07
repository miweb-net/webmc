// The tabs.js file contains functions for managing the notebook view.


var preview_button = document.getElementById("preview_button");
preview_button.onclick = showTab;

var search_button = document.getElementById("search_button");
search_button.onclick = showTab;

var organize_button = document.getElementById("organize_button");
organize_button.onclick = showTab;

var editor_button = document.getElementById("editor_button");
editor_button.onclick = showTab;

function showTab(e)
{
	let visible_tab = undefined;
	let visible_controls = undefined;

	switch (e.target.id) {
		case 'preview_button':
			visible_tab = 'previewer';
			visible_controls = undefined;
			break;
		case 'search_button':
			visible_tab = 'search';
			visible_controls = 'search_ctrls';
			break;
		case 'organize_button':
			socket.send(JSON.stringify({action: 'read_org_cache'}));
			visible_controls = 'org_ctrls';
			visible_tab = 'organizer';
			break;
		case 'editor_button':
			visible_controls = 'editor_ctrls';
			visible_tab = 'editor';
			break;
		default:
			visible_tab = 'previewer';
	}

	// Set the selected tab color and make the others normal
	for ( let button of document.getElementsByClassName('tab_button') )
	{
		if ( e.target.id == button.id )
			button.className = "tab_button sel";
		else
			button.className = "tab_button";
	}

	visible_tab = document.getElementsByClassName(visible_tab)[0];
	
	for ( let classname of ['previewer', 'organizer', 'search', 'editor'] )
	{
		let tab = document.getElementsByClassName(classname)[0];
		if ( tab == visible_tab )
			tab.style.visibility = "visible";
		else
			tab.style.visibility = "hidden";
	}

	for ( let classname of ['org_ctrls', 'search_ctrls', 'editor_ctrls'] )
	{
		let controls = document.getElementsByClassName(classname)[0];
		if ( classname == visible_controls )
			controls.style.display = "block";
		else
			controls.style.display = "none";
	}
}

console.log("Initialized to show splash tab -- see tabs.js");
preview_button.click();