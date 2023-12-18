import DataTable, { Api, HeaderStructure } from '../../../types/types'; // declare var DataTable: any;
import { init, getOrder, setOrder, validateMove } from './functions';

interface IDropZone {
	colIdx: number;
	left: number;
	self: boolean;
	width: number;
}

interface ISettings {
	dropZones: IDropZone[];
	enable: boolean;
	mouse: {
		fromIndex: number;
		offset: {
			x: number;
			y: number;
		};
		start: {
			x: number;
			y: number;
		};
		tableOffset: number;
		target: JQuery;
		targets: number[];
		targetIndex: number;
	};
}

export default class ColReorder {
	private dom = {
		drag: null
	};

	private dt: Api;

	private s: ISettings = {
		dropZones: [],

		enable: true,

		mouse: {
			fromIndex: -1,
			offset: {
				x: -1,
				y: -1
			},
			start: {
				x: -1,
				y: -1
			},
			tableOffset: -1,
			target: null,
			targets: [],
			targetIndex: -1
		}
	};

	constructor(dt: Api, opts: typeof ColReorder.defaults) {
		let that = this;

		init(dt);

		this.dt = dt;

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

		dt.on('mousedown.colReorder touchstart.colReorder', 'thead th, thead td', function (e: any) {
			// Ignore middle and right click
			if (e.type === 'mousedown' && e.which !== 1) {
				return;
			}

			// Ignore if disabled
			if (!that.s.enable) {
				return;
			}

			that._mouseDown(e, this);
		});
	}

	private _createDragNode() {
		let origCell = this.s.mouse.target;
		let origTr = origCell.parent();
		let origThead = origTr.parent();
		let origTable = origThead.parent();
		let cloneCell = origCell.clone();

		// This is a slightly odd combination of jQuery and DOM, but it is the
		// fastest and least resource intensive way I could think of cloning
		// the table with just a single header cell in it.
		this.dom.drag = $(origTable[0].cloneNode(false))
			.addClass('dtcr-cloned')
			.append(
				$(origThead[0].cloneNode(false)).append(
					$(origTr[0].cloneNode(false)).append(cloneCell[0]) as any
				) as any // Not sure why  it doesn't want to append a jQuery node
			)
			.css({
				position: 'absolute',
				top: 0,
				left: 0,
				width: $(origCell).outerWidth(),
				height: $(origCell).outerHeight()
			})
			.appendTo('body');
	}

	/**
	 * Get cursor position regardless of mouse or touch input
	 *
	 * @param e Event
	 * @param prop Property name to get
	 * @returns Value - assuming a number here
	 */
	private _cursorPosition(e: JQuery.TriggeredEvent, prop: string): number {
		return e.type.indexOf('touch') !== -1 ? (e.originalEvent as any).touches[0][prop] : e[prop];
	}

	/**
	 * Cache values at start
	 *
	 * @param e Triggering event
	 * @param cell Cell that the action started on
	 * @returns
	 */
	private _mouseDown(e: JQuery.TriggeredEvent, cell: HTMLElement) {
		let that = this;
		var target = $(e.target).closest('th, td');
		var offset = target.offset();
		var moveColumnIndexes = $(cell)
			.attr('data-dt-column')
			.split(',')
			.map(function (val) {
				return parseInt(val, 10);
			});

		this.s.mouse.start.x = this._cursorPosition(e, 'pageX');
		this.s.mouse.start.y = this._cursorPosition(e, 'pageY');
		this.s.mouse.offset.x = this._cursorPosition(e, 'pageX') - offset.left;
		this.s.mouse.offset.y = this._cursorPosition(e, 'pageY') - offset.top;
		this.s.mouse.target = target;
		this.s.mouse.targets = moveColumnIndexes;
		this.s.mouse.targetIndex = moveColumnIndexes[0];
		this.s.mouse.fromIndex = moveColumnIndexes[0];
		this.s.mouse.tableOffset = $(this.dt.table().node()).offset().left;

		// Classes to highlight the columns being moved
		for (let i=0 ; i<moveColumnIndexes.length ; i++) {
			let cells = this.dt.cells(null, moveColumnIndexes[i] as any, {page: 'current'}).nodes().to$();
			let klass = 'dtcr-moving';

			if (i === 0) {
				klass += ' dtcr-moving-first';
			}

			if (i === moveColumnIndexes.length - 1) {
				klass += ' dtcr-moving-last';
			}

			cells.addClass(klass);
		}

		this._regions(moveColumnIndexes);

		/* Add event handlers to the document */
		$(document)
			.on('mousemove.colReorder touchmove.colReorder', (e) => {
				this._mouseMove(e);
			})
			.on('mouseup.colReorder touchend.colReorder', (e) => {
				this._mouseUp(e);
			});
	}

	private _mouseMove(e: JQuery.TriggeredEvent) {
		if (this.dom.drag === null) {
			// Only create the drag element if the mouse has moved a specific distance from the start
			// point - this allows the user to make small mouse movements when sorting and not have a
			// possibly confusing drag element showing up
			if (
				Math.pow(
					Math.pow(this._cursorPosition(e, 'pageX') - this.s.mouse.start.x, 2) +
						Math.pow(this._cursorPosition(e, 'pageY') - this.s.mouse.start.y, 2),
					0.5
				) < 5
			) {
				return;
			}

			this._createDragNode();
		}

		// Position the element - we respect where in the element the click occurred
		this.dom.drag.css({
			left: this._cursorPosition(e, 'pageX') - this.s.mouse.offset.x,
			top: this._cursorPosition(e, 'pageY') - this.s.mouse.offset.y
		});

		// Find cursor's left position relative to the table
		let cursorMouseLeft = this._cursorPosition(e, 'pageX') - this.s.mouse.tableOffset;
		let dropZone = this.s.dropZones.find(function (zone) {
			if (zone.left <= cursorMouseLeft && cursorMouseLeft <= zone.left + zone.width) {
				return true;
			}

			return false;
		});

		if (! dropZone) {
			return;
		}

		if (! dropZone.self) {
			(this.dt as any).colReorder.move(this.s.mouse.targets, dropZone.colIdx);

			this._regions(this.s.mouse.targets);
		}
	}

	private _mouseUp(e: JQuery.TriggeredEvent) {
		$(document).off('.colReorder');

		if (this.dom.drag) {
			this.dom.drag.remove();
			this.dom.drag = null;
		}

		this.dt.cells('.dtcr-moving').nodes().to$().removeClass(
			'dtcr-moving dtcr-moving-first dtcr-moving-last'
		);
	}

	/**
	 * Determine the boundaries for where drops can happen and where they would
	 * insert into.
	 */
	private _regions(moveColumns: number[]) {
		let that = this;
		let dropZones: IDropZone[] = [];
		let totalWidth = 0;
		let negativeCorrect = 0;

		// Each column is a drop zone
		this.dt.columns(':visible').every(function (colIdx, tabIdx, i) {
			let columnWidth = this.width();
			let valid = validateMove(that.dt, moveColumns, colIdx);

			if (valid) {
				// New drop zone. Note that it might have it's offset moved
				// by the final condition in this logic set
				dropZones.push({
					colIdx: colIdx,
					left: totalWidth - negativeCorrect,
					self: moveColumns[0] <= colIdx && colIdx <= moveColumns[moveColumns.length - 1],
					width: columnWidth + negativeCorrect
				});
			}
			else if (colIdx < moveColumns[0]) {
				// Not valid and before the column(s) to be moved - the drop
				// zone for the previous valid drop point is extended
				if (dropZones.length) {
					dropZones[dropZones.length - 1].width += columnWidth;
				}
			}
			else if (colIdx > moveColumns[moveColumns.length - 1]) {
				// Not valid and after the column(s) to be moved - the next
				// drop zone to be created will be extended
				negativeCorrect += columnWidth;
			}

			totalWidth += columnWidth;
		});

		// for (let i=0 ; i<dropZones.length ; i++) {
		// 	let zone = dropZones[i];

		// 	$(that.dt.table().container()).append(
		// 		$('<div>').css({
		// 			position: 'absolute',
		// 			top: 0,
		// 			width: zone.width - 4,
		// 			height: 20,
		// 			left: zone.left + 2,
		// 			border: '1px solid red',
		// 		})
		// 	);
		// }

		console.log(dropZones);

		this.s.dropZones = dropZones;
	}

	static defaults = {
		order: null
	};

	static version = '2.0.0-dev';
}
