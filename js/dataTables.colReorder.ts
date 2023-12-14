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

import DataTable from '../../../types/types'; // declare var DataTable: any;

import ColReorder from './ColReorder';
import {
	finalise,
	init,
	invertKeyValues,
	getOrder,
	move,
	orderingIndexes,
	setOrder,
	transpose,
	validateMove
} from './functions';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * UI interaction class
 */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables API integration
 */

/**
 * Change the ordering of the columns in the DataTable.
 */
DataTable.Api.register('colReorder.move()', function (from, to) {
	init(this);

	if (!Array.isArray(from)) {
		from = [from];
	}

	if (!validateMove(this, from, to)) {
		this.error('ColReorder - invalid move');
		return this;
	}

	return this.tables().every(function () {
		move(this, from, to);
		finalise(this);
	});
});

DataTable.Api.register('colReorder.order()', function (set?: number[], original?) {
	init(this);

	if (!set) {
		return this.context.length ? getOrder(this) : null;
	}

	return this.tables().every(function () {
		setOrder(this, set, original);
	});
});

DataTable.Api.register('colReorder.reset()', function () {
	init(this);

	return this.tables().every(function () {
		var order = this.columns()
			.every(function (i) {
				return i;
			})
			.flatten()
			.toArray();

		setOrder(this, order, true);
	});
});

DataTable.Api.register('colReorder.transpose()', function (idx: any, dir) {
	init(this);

	if (!dir) {
		dir = 'toCurrent';
	}

	return transpose(this, idx, dir);
});

(DataTable as any).ColReorder = ColReorder;

// Called when DataTables is going to load a state. That might be
// before the table is ready (state saving) or after (state restoring).
// Also note that it happens _before_ preInit (below).
$(document).on('stateLoadInit.dt', function (e, settings, state) {
	if (e.namespace !== 'dt') {
		return;
	}

	let dt = new DataTable.Api(settings);

	if (state.colReorder) {
		if (dt.ready()) {
			// Table is fully loaded - do the column reordering here
			// so that the stored indexes are in the correct place
			// e.g. column visibility
			setOrder(dt, state.colReorder, true);
		}
		else {
			// If the table is not ready, column reordering is done
			// after it becomes fully ready. That means that saved
			// column indexes need to be updated for where those columns
			// currently are.
			let map = invertKeyValues(state.colReorder);

			// State's ordering indexes
			orderingIndexes(map, state.order);

			// State's columns array - sort by restore index
			for (let i = 0; i < state.columns.length; i++) {
				state.columns[i]._cr_sort = state.colReorder[i];
			}

			state.columns.sort(function (a, b) {
				return a._cr_sort - b._cr_sort;
			});
		}
	}
});

$(document).on('preInit.dt', function (e, settings) {
	if (e.namespace !== 'dt') {
		return;
	}

	var init = settings.oInit.colReorder;
	var defaults = (DataTable.defaults as any).colReorder;

	if (init || defaults) {
		var opts = $.extend({}, defaults, init);

		if (init !== false) {
			let dt = new DataTable.Api(settings);

			new ColReorder(dt, opts);
		}
	}
});
