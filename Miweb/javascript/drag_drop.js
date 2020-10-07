// The jscript file contains drag and drop functions and callbacks
// to perform drag and drop operations. The arranger and organizer
// drags work slightly differently, so they have their respective
// DragStart and DragEnd events. The movement functions the same.

dragObject = Object(); // Common to arranger and organizer drag operations.

// Common functions (move)
function onMouseMove(e) {
	moveTo(e.pageX, e.pageY);
}

// Function to position the element
function moveTo(x, y)
{
	dragObject.source.style.top = y - dragObject.shiftY + 'px';
	dragObject.source.style.left = x - dragObject.shiftX + 'px';
}


// Arranger Specific Functions
function arrangerDragStart(e)
{
	e.preventDefault();
	e.stopPropagation();
	let source = e.target;
	// If the arranger items are clicked, their className will be 'arr_*'
	// Instead, we want the row container to move as a unit.
	if ( source.className.includes("arr_") )
		source = source.parentNode;

	if ( source.className == "row sel" )
	{
		// User is probably intending to remove selection.
		source.className = "row";
		if ( arranger.getElementsByClassName('row sel').length == 0 )
			remove_part.disabled = true;
		return;
	}
	remove_part.disabled = false;
	source.className = "row sel";

	// Create an object that points to the draggable element
	dragObject.source = source;
	dragObject.parent = source.parentNode;
	dragObject.className = source.className;
	dragObject.shiftX = e.clientX - source.getBoundingClientRect().left;
	dragObject.shiftY = e.clientY - source.getBoundingClientRect().top;

	// Detach the element from its parent, making it a BODY element
	document.body.append(source);

	dragObject.source.className += " drag_item";
	dragObject.source.onmouseup = arrangerDragEnd;

	// Move the element
	moveTo(e.pageX, e.pageY);

	// Make the document listen to the mouse movements
	document.addEventListener('mousemove', onMouseMove);
//	dragObject.source.onmousemove = onMouseMove;
}

function arrangerDragEnd(e)
{
	e.preventDefault();
	e.stopPropagation();
	dragObject.source.onmouseup = null;

	// Stop tracking movement.
	document.removeEventListener('mousemove', onMouseMove);
	console.log("Turned off mouse move listener");

	// Calculate the row over which the element was dropped.
	let parent = document.getElementById("arranger_table");
	let row_hgt = parent.firstChild.offsetHeight;
	let y_offset = parent.getBoundingClientRect().y;
	let row_num = parseInt((e.clientY - y_offset) / row_hgt);

	// Reattach the element to the parent above the point it was dropped.
	let element_below = parent.children[row_num];
	parent.insertBefore(dragObject.source, element_below);
	console.log(row_hgt, y_offset, row_num, element_below);
	console.log("Parent:", parent.id);

	// Change the class of the dragged item to its former one.
	dragObject.source.className = "row sel";
}

// Organizer Specific functions
function organizerDragStart(e)
{
	e.stopPropagation();
	e.preventDefault();

	let source = e.target.parentNode;
	if ( e.target.className.includes("container") )
		source = e.target;

	// Detect double-click here. e.detail is the # of clicks within a
	// short period (ie. a double-click event).
	if ( e.detail == 2 )
	{
		// Send the IMG element. It contains a 'path' attribute.
		displayPresentationRequest(source.children[0]);
		return;
	}
	
	dragObject.source = source;

	// Create an object that represents a draggable element
	dragObject.className = source.className;
	dragObject.shiftX = e.clientX - source.getBoundingClientRect().left;
	dragObject.shiftY = e.clientY - source.getBoundingClientRect().top;

	// Detach the element from its parent, making it a BODY element
	document.body.append(source);

	source.className = "container_drag drag_item";
	source.onmouseup = organizerDragEnd;

	// Move the element
	moveTo(e.pageX, e.pageY);

	// Make the document listen to the mouse movements
	document.addEventListener('mousemove', onMouseMove);

}

function organizerDragEnd(e)
{
	e.preventDefault();
	dragObject.source.onmouseup = null;

	// Stop tracking movement.
	document.removeEventListener('mousemove', onMouseMove);

	// Calculate the cell over which the element was dropped.
	let row_hgt = dragObject.source.offsetHeight;
	let col_wid = dragObject.source.offsetWidth;
	let x_offset = organizer.getBoundingClientRect().x;
	let y_offset = organizer.getBoundingClientRect().y;

	let row_num = parseInt((e.clientY - y_offset) / row_hgt);
	let col_num = parseInt((e.clientX - x_offset) / col_wid);

	// Get the number of columns (width capacity) of organizer
	let col_count = parseInt(organizer.getBoundingClientRect().width / col_wid);
	let cell_num = row_num * col_count + col_num;

	dragObject.source.className = dragObject.className;
	
	// Reattach the element to the parent above the point it was dropped.
	let element_below = organizer.children[cell_num];
	organizer.insertBefore(dragObject.source, element_below);
	organizerSelectObject(dragObject.source);
}
