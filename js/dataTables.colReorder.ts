import DataTable, { Context } from 'datatables.net';
import ColReorder from './ColReorder';
import {
	finalise,
	getOrder,
	init,
	move,
	orderingIndexes,
	setOrder,
	transpose,
	validateMove
} from './functions';
import { IDefaults } from './interface';

const Api = DataTable.Api;
const dom = DataTable.dom;
const util = DataTable.util;

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * UI interaction class
 */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables API integration
 */

/** Enable mouse column reordering */
Api.register('colReorder.enable()', function (flag) {
	return this.iterator('table', function (ctx) {
		if (ctx._colReorder) {
			ctx._colReorder.enable(flag);
		}
	});
});

/** Disable mouse column reordering */
Api.register('colReorder.disable()', function () {
	return this.iterator('table', function (ctx) {
		if (ctx._colReorder) {
			ctx._colReorder.disable();
		}
	});
});

/**
 * Change the ordering of the columns in the DataTable.
 */
Api.register('colReorder.move()', function (from, to) {
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

Api.register('colReorder.order()', function (set?: number[], original?) {
	init(this);

	if (!set) {
		return this.context.length ? getOrder(this) : null;
	}

	return this.tables().every(function () {
		setOrder(this, set, original);
	});
});

Api.register('colReorder.reset()', function () {
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

Api.register('colReorder.transpose()', function (idx: any, dir) {
	init(this);

	if (!dir) {
		dir = 'toCurrent';
	}

	return transpose(this, idx, dir);
});

DataTable.ColReorder = ColReorder;

// Called when DataTables is going to load a state. That might be
// before the table is ready (state saving) or after (state restoring).
// Also note that it happens _before_ preInit (below).
dom.s(document).on('stateLoadInit.dt', function (e, settings: Context, state) {
	if (e.namespace !== 'dt') {
		return;
	}

	let dt = new Api(settings);

	if (state.colReorder && dt.columns().count() === state.colReorder.length) {
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
			// currently are. Any properties which refer to column indexes
			// would need to be updated here.

			// State's ordering indexes
			orderingIndexes(state.colReorder, state.order);

			// State's columns array - sort by restore index
			if (state.columns) {
				for (let i = 0; i < state.columns.length; i++) {
					state.columns[i]._cr_sort = state.colReorder[i];
				}
	
				state.columns.sort(function (a, b) {
					return a._cr_sort - b._cr_sort;
				});
			}
		}
	}
});

dom.s(document).on('preInit.dt', function (e, settings) {
	if (e.namespace !== 'dt') {
		return;
	}

	var init = settings.oInit.colReorder;
	var defaults = (DataTable.defaults as any).colReorder;

	if (init || defaults) {
		let opts: Partial<IDefaults> = {};

		if (util.is.plainObject(defaults)) {
			util.object.assign(opts, defaults);
		}

		if (util.is.plainObject(init)) {
			util.object.assign(opts, init);
		}

		if (init !== false) {
			let dt = new DataTable.Api(settings);

			new ColReorder(dt, opts);
		}
	}
});
