/*! ColReorder 2.0.0-dev
 * © SpryMedia Ltd - datatables.net/license
 */

/**
 * @summary     ColReorder
 * @description Provide the ability to reorder columns in a DataTable
 * @version     2.0.0-dev
 * @author      SpryMedia Ltd
 * @contact     datatables.net
 * @copyright   SpryMedia Ltd.
 *
 * This source file is free software, available under the following license:
 *   MIT license - http://datatables.net/license/mit
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: http://www.datatables.net
 */

import DataTable, { Api, HeaderStructure } from '../../../types/types'; // declare var DataTable: any;

/**
 * Convert the DataTables header structure array into a 2D array where each
 * element has a reference to its TH/TD cell (regardless of spanning).
 *
 * @param structure Header / footer structure object
 * @returns 2D array of header cells
 */
function structureFill(structure: HeaderStructure[][]) {
	let filledIn: Array<Array<HTMLElement>> = [];

	for (let row = 0; row < structure.length; row++) {
		filledIn.push([]);

		for (let col = 0; col < structure[row].length; col++) {
			let cell = structure[row][col];

			if (cell) {
				for (let rowInner = 0; rowInner < cell.rowspan; rowInner++) {
					for (let colInner = 0; colInner < cell.colspan; colInner++) {
						filledIn[row + rowInner][col + colInner] = cell.cell;
					}
				}
			}
		}
	}

	return filledIn;
}

/**
 * Mutate an array, moving a set of elements into a new index position
 *
 * @param arr Array to modify
 * @param from Start move index
 * @param count Number of elements to move
 * @param to Index where the start element will move to
 */
function arrayMove(arr: any[], from: number, count: number, to: number): void {
	let movers: any[] = arr.splice(from, count);

	// Add delete and start to the array, so we can use it for the `apply`
	movers.unshift(0); // splice delete param
	movers.unshift(to < from ? to : to - count + 1); // splice start param

	arr.splice.apply(arr, movers);
}

/**
 * For a given structure check that the move is valid.
 * @param structure
 * @param from
 * @param to
 * @returns
 */
function validateStructureMove(structure: HeaderStructure[][], from: number[], to: number): boolean {
	let header = structureFill(structure);
	let i;

	// Shuffle the header cells around
	for (i = 0; i < header.length; i++) {
		arrayMove(header[i], from[0], from.length, to);
	}

	// Sanity check that the headers are next to each other
	for (i = 0; i < header.length; i++) {
		let seen = [];

		for (let j = 0; j < header[i].length; j++) {
			let cell = header[i][j];

			if (!seen.includes(cell)) {
				// Hasn't been seen before
				seen.push(cell);
			}
			else if (seen[seen.length - 1] !== cell) {
				// Has been seen before and is not the previous cell - validation failed
				return false;
			}
		}
	}

	return true;
}

/**
 * Validate that a requested move is okay. This includes bound checking
 * and that it won't split colspan'ed cells.
 *
 * @param table API instance
 * @param from Column indexes to move
 * @param to Destination index (starting if multiple)
 * @returns Validation result
 */
function validateMove(table: Api<any>, from: number[], to: number) {
	let columns = table.columns().count();

	// Sanity and bound checking
	if (from[0] < to && to < from[from.length]) {
		return false;
	}

	if (from[0] < 0 && from[from.length - 1] > columns) {
		return false;
	}

	if (to < 0 && to > columns) {
		return false;
	}

	if (!validateStructureMove(table.table().header.structure(), from, to)) {
		return false;
	}

	if (!validateStructureMove(table.table().footer.structure(), from, to)) {
		return false;
	}

	return true;
}

/**
 * Switch the key value pairing of an index array to be value key (i.e. the old value is now the
 * key). For example consider [ 2, 0, 1 ] this would be returned as [ 1, 2, 0 ].
 *
 *  @param   array arr Array to switch around
 */
function invertKeyValues(arr: number[]): number[] {
	let result = [];

	for (let i = 0; i < arr.length; i++) {
		result[arr[i]] = i;
	}

	return result;
}

/**
 * Update the indexing for ordering arrays
 *
 * @param map Reverse index map
 * @param order Array to update
 */
function orderingIndexes(map: number[], order: any[]): void {
	for (let i = 0; i < order.length; i++) {
		let el = order[i];

		if (typeof el === 'number') {
			// Just a number
			order[i] = map[el];
		}
		else if ($.isPlainObject(el) && el.idx !== undefined) {
			// New index in an object style
			el.idx = map[el.idx];
		}
		else {
			// The good old fixes length array
			el[0] = map[el[0]];
		}
		// No need to update if in object + .name style
	}
}

/**
 * Manipulate a header / footer array in DataTables settings to reorder
 * the columns.
 */
function headerUpdate(structure: any[], map: number[], from: number[], to: number): void {
	let done: HTMLElement[] = [];

	for (let i = 0; i < structure.length; i++) {
		let headerRow = structure[i];

		arrayMove(headerRow, from[0], from.length, to);

		for (let j = 0; j < headerRow.length; j++) {
			let cell = headerRow[j].cell;

			// Only work on a DOM element once, otherwise we risk remapping a
			// remapped value (etc).
			if (done.includes(cell)) {
				continue;
			}

			let indexes = cell.getAttribute('data-dt-column').split(',');
			let mapped = indexes
				.map(function (idx) {
					return map[idx];
				})
				.join(',');

			// Update data attributes for the new column position
			cell.setAttribute('data-dt-column', mapped);

			done.push(cell);
		}
	}
}

/**
 * Change the ordering of the columns in the DataTable.
 * 
 * This method has a lot of knowledge about how DataTables works internally.
 * If DataTables changes how it handles cells, columns, etc, then this
 * method would need to be updated accordingly.
 * 
 * @param number|number[] Current column index(es) to move. Must be sequential
 *   if given as an array
 * @param number Target column (current index)
 */
DataTable.Api.register('colReorder.move()', function (from, to) {
	if (!Array.isArray(from)) {
		from = [from];
	}

	if (!validateMove(this, from, to)) {
		console.log('INVALID move');
		return this;
	}

	let i, j;
	let settings = this.context[0];
	let columns = settings.aoColumns;
	let newOrder = columns.map(function (col, idx) {
		return idx;
	});

	// A reverse index array so we can look up new indexes from old
	arrayMove(newOrder, from[0], from.length, to);
	let reverseIndexes = invertKeyValues(newOrder);

	// Per row manipulations
	for (i = 0; i < settings.aoData.length; i++) {
		var data = settings.aoData[i];
		var cells = data.anCells;

		if (cells) {
			// Array of cells
			arrayMove(cells, from[0], from.length, to);

			for (j = 0; j < cells.length; j++) {
				// Reinsert into the document in the new order
				if (data.nTr && cells[j] && columns[j].bVisible) {
					data.nTr.appendChild(cells[j]);
				}

				// Update lookup index
				if (cells[j] && cells[j]._DT_CellIndex) {
					cells[j]._DT_CellIndex.column = j;
				}
			}
		}
	}

	// Per column manipulation
	// Main column
	arrayMove(columns, from[0], from.length, to);

	for (i = 0; i < columns.length; i++) {
		let column = columns[i];

		// Data column sorting
		for (j = 0; j < column.aDataSort.length; j++) {
			column.aDataSort[j] = reverseIndexes[column.aDataSort[j]];
		}

		// Update the column indexes
		column.idx = reverseIndexes[column.idx];

		// Reorder the colgroup > col elements for the new order
		if (column.bVisible) {
			settings.colgroup.append(column.colEl);
		}
	}

	// Header and footer
	headerUpdate(settings.aoHeader, reverseIndexes, from, to);
	headerUpdate(settings.aoFooter, reverseIndexes, from, to);

	// Search - columns
	arrayMove(settings.aoPreSearchCols, from[0], from.length, to);

	// Ordering indexes update - note that the sort listener on the
	// header works out the index to apply on each draw, so it doesn't
	// need to be updated here.
	orderingIndexes(reverseIndexes, settings.aaSorting);

	if (Array.isArray(settings.aaSortingFixed)) {
		orderingIndexes(reverseIndexes, settings.aaSortingFixed);
	}
	else if (settings.aaSortingFixed.pre) {
		orderingIndexes(reverseIndexes, settings.aaSortingFixed.pre);
	}
	else if (settings.aaSortingFixed.post) {
		orderingIndexes(reverseIndexes, settings.aaSortingFixed.pre);
	}

	settings.aLastSort.forEach(function (el) {
		el.src = reverseIndexes[el.src];
	});

	// Cache invalidation. Always read from the data object rather
	// than reading back from the DOM since it could have been
	// changed by a renderer
	this.rows().invalidate('data');

	// Redraw the header / footer. Its a little bit of a hack this, as DT
	// doesn't expose the header draw as an API method. It calls state
	// saving, so we don't need to here.
	this.column(0).visible(this.column(0).visible());

	this.columns.adjust();

	// Fire an event so other plug-ins can update
	this.trigger( 'column-reorder.dt', [{
		from: from,
		to: to,
		mapping: reverseIndexes
	}]);

	return this;
});
