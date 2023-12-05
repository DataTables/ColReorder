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
					for (
						let colInner = 0;
						colInner < cell.colspan;
						colInner++
					) {
						filledIn[row + rowInner][col + colInner] = cell.cell;
					}
				}
			}
		}
	}

	return filledIn;
}

/**
 * For a given structure check that the move is valid.
 * @param structure
 * @param from
 * @param to
 * @returns
 */
function validateStructureMove(
	structure: HeaderStructure[][],
	from: number[],
	to: number
): boolean {
	let header = structureFill(structure);
	let i;

	// Shuffle the header cells around
	for (i = 0; i < header.length; i++) {
		let movers: any[] = header[i].splice(from[0], from.length);

		// Add delete and start to the array, so we can use it for the `apply`
		movers.unshift(0); // splice delete param
		movers.unshift(to < from[0] ? to : to - from.length + 1); // splice start param

		header[i].splice.apply(header[i], movers);
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

DataTable.Api.register('colReorder.move()', function (from, to) {
	if (!Array.isArray(from)) {
		from = [from];
	}

	if (!validateMove(this, from, to)) {
		console.log('INVALID move');
		return this;
	}

	console.log('valid move');
});
