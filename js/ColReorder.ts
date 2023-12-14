
import DataTable, { Api, HeaderStructure } from '../../../types/types'; // declare var DataTable: any;
import {init, getOrder, setOrder} from './functions';

export default class ColReorder {
	constructor (dt: Api, opts: typeof ColReorder.defaults) {
		init(dt);
	
		dt.on('stateSaveParams', function (e, s, d) {
			d.colReorder = getOrder(dt);
		});
	
		dt.on('destroy', function () {
			(dt as any).colReorder.reset();
		});
	
		let loaded = dt.state.loaded() as any;
		let order = opts.order;
	
		if (loaded && loaded.colReorder) {
			order = loaded.colReorder;
		}
	
		if (order) {
			dt.ready(function () {
				setOrder(dt, order, true);
			});
		}
	}

	static defaults = {
		order: null
	};

	static version = '2.0.0-dev';
};