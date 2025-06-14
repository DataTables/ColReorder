import { Api, ColumnSelector } from '../../../types/types'; // declare var DataTable: any;
import { init, getOrder, setOrder, validateMove, move } from './functions';

interface IDropZone {
	colIdx: number;
	inlineStart: number;
	self: boolean;
	width: number;
}

interface IConfig {
	columns: ColumnSelector;

	enable: boolean;

	headerRows: null | number[];

	order: number[];
}

interface ISettings {
	dropZones: IDropZone[];
	mouse: {
		absLeft: number;
		offset: {
			x: number;
			y: number;
		};
		start: {
			x: number;
			y: number;
		};
		target: JQuery;
		targets: number[];
	};
	scrollInterval: number;
}

/**
 * This is one possible UI for column reordering in DataTables. In this case
 * columns are reordered by clicking and dragging a column header. It calculates
 * where columns can be dropped based on the column header used to start the drag
 * and then `colReorder.move()` method to alter the DataTable.
 */
export default class ColReorder {
	private dom = {
		drag: null
	};

	private dt: Api;

	private c: IConfig = {
		columns: null,
		enable: null,
		headerRows: null,
		order: null
	};

	private s: ISettings = {
		dropZones: [],

		mouse: {
			absLeft: -1,
			offset: {
				x: -1,
				y: -1
			},
			start: {
				x: -1,
				y: -1
			},
			target: null,
			targets: []
		},

		scrollInterval: null
	};

	public disable() {
		this.c.enable = false;

		return this;
	}

	public enable(flag: boolean = true) {
		if (flag === false) {
			return this.disable();
		}

		this.c.enable = true;

		return this;
	}

	constructor(dt: Api, opts: typeof ColReorder.defaults) {
		let that = this;
		let ctx = dt.settings()[0];

		// Check if ColReorder already has been initialised on this DataTable - only
		// one can exist.
		if (ctx._colReorder) {
			return;
		}
		dt.settings()[0]._colReorder = this;

		this.dt = dt;
		$.extend(this.c, ColReorder.defaults, opts);

		init(dt);

		dt.on('stateSaveParams', function (e, s, d) {
			d.colReorder = getOrder(dt);
		});

		dt.on('destroy', function () {
			dt.off('.colReorder');
			(dt as any).colReorder.reset();
		});

		// Initial ordering / state restoring
		let loaded = dt.state.loaded() as any;
		let order = this.c.order;

		if (loaded && loaded.colReorder && dt.columns().count() === loaded.colReorder.length) {
			order = loaded.colReorder;
		}

		if (order) {
			dt.ready(function () {
				setOrder(dt, order, true);
			});
		}

		dt.table()
			.header.structure()
			.forEach(function (row, rowIdx) {
				let headerRows = opts.headerRows;

				for (let i = 0; i < row.length; i++) {
					if (!headerRows || headerRows.includes(rowIdx)) {
						if (row[i] && row[i].cell) {
							that._addListener(row[i].cell);
						}
					}
				}
			});
	}

	/**
	 * Attach the mouse down listener to an element to start a column reorder action
	 *
	 * @param el
	 */
	private _addListener(el) {
		let that = this;

		$(el)
			.on('selectstart.colReorder', function () {
				return false;
			})
			.on('mousedown.colReorder touchstart.colReorder', function (e: any) {
				// Ignore middle and right click
				if (e.type === 'mousedown' && e.which !== 1) {
					return;
				}

				// Ignore if disabled
				if (!that.c.enable) {
					return;
				}

				// ColumnControl integration - if there is a CC reorder button in the header
				// then the mousedown is limited to that
				let btn = $('button.dtcc-button_reorder', this);

				if (btn.length && e.target !== btn[0] && btn.find(e.target).length === 0) {
					return;
				}

				that._mouseDown(e, this);
			});
	}

	/**
	 * Create the element that is dragged around the page
	 */
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
		let target = $(e.target).closest('th, td');
		let offset = target.offset();
		let moveableColumns = this.dt.columns(this.c.columns).indexes().toArray();
		let moveColumnIndexes = $(cell)
			.attr('data-dt-column')
			.split(',')
			.map(function (val) {
				return parseInt(val, 10);
			});

		// Don't do anything for columns which are not selected as moveable
		for (let j = 0; j < moveColumnIndexes.length; j++) {
			if (!moveableColumns.includes(moveColumnIndexes[j])) {
				return false;
			}
		}

		this.s.mouse.start.x = this._cursorPosition(e, 'pageX');
		this.s.mouse.start.y = this._cursorPosition(e, 'pageY');
		this.s.mouse.offset.x = this._cursorPosition(e, 'pageX') - offset.left;
		this.s.mouse.offset.y = this._cursorPosition(e, 'pageY') - offset.top;
		this.s.mouse.target = target;
		this.s.mouse.targets = moveColumnIndexes;

		// Classes to highlight the columns being moved
		for (let i = 0; i < moveColumnIndexes.length; i++) {
			let cells = this.dt
				.cells(null, moveColumnIndexes[i] as any, { page: 'current' })
				.nodes()
				.to$();
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
		this._scrollRegions();

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

			$(document.body).addClass('dtcr-dragging');

			this._createDragNode();
		}

		// Position the element - we respect where in the element the click occurred
		this.dom.drag.css({
			left: this._cursorPosition(e, 'pageX') - this.s.mouse.offset.x,
			top: this._cursorPosition(e, 'pageY') - this.s.mouse.offset.y
		});

		// Find cursor's left position relative to the table
		const tableNode = this.dt.table().node();

		let tableOffset = $(tableNode).offset().left;
		let cursorMouseLeft = this._cursorPosition(e, 'pageX') - tableOffset;

		let cursorInlineStart : number;

		if (this._isRtl()) {
			const tableWidth = tableNode.clientWidth;
			cursorInlineStart = tableWidth - cursorMouseLeft;
		}
		else {
			cursorInlineStart = cursorMouseLeft;
		}

		let dropZone = this.s.dropZones.find(function (zone) {
			if (zone.inlineStart <= cursorInlineStart && cursorInlineStart <= zone.inlineStart + zone.width) {
				return true;
			}

			return false;
		});

		this.s.mouse.absLeft = this._cursorPosition(e, 'pageX');

		if (!dropZone) {
			return;
		}

		if (!dropZone.self) {
			this._move(dropZone, cursorInlineStart);
		}
	}

	private _mouseUp(e: JQuery.TriggeredEvent) {
		$(document).off('.colReorder');
		$(document.body).removeClass('dtcr-dragging');

		if (this.dom.drag) {
			this.dom.drag.remove();
			this.dom.drag = null;

			// Once the element is removed, Firefox will then complete the mouse event
			// sequence by firing a click event on the element that the mouse is now
			// over. This means that a click event happens on the header cell triggering
			// a sort. A setTimeout on the remove doesn't appear to work around this.
			//
			// Therefore, we need to add a click event listener that will kill the
			// bubbling of the event, and then _almost_ immediately remove it.
			this.s.mouse.target.on('click.dtcr', function (e) {
				return false;
			});

			setTimeout(() => {
				this.s.mouse.target.off('.dtcr');
			}, 10);
		}

		if (this.s.scrollInterval) {
			clearInterval(this.s.scrollInterval);
		}

		this.dt.cells('.dtcr-moving').nodes().to$().removeClass('dtcr-moving dtcr-moving-first dtcr-moving-last');
	}

	/**
	 * Shift columns around
	 *
	 * @param dropZone Where to move to
	 * @param cursorInlineStart Cursor position, relative to the inline start (left or right) of the table
	 */
	private _move(dropZone: IDropZone, cursorInlineStart: number) {
		let that = this;

		(this.dt as any).colReorder.move(this.s.mouse.targets, dropZone.colIdx);

		// Update the targets
		this.s.mouse.targets = $(this.s.mouse.target)
			.attr('data-dt-column')
			.split(',')
			.map(function (val) {
				return parseInt(val, 10);
			});

		this._regions(this.s.mouse.targets);

		let visibleTargets = this.s.mouse.targets.filter(function (val) {
			return that.dt.column(val).visible();
		});

		// If the column being moved is smaller than the column it is replacing,
		// the drop zones might need a correction to allow for this since, otherwise
		// we might immediately be changing the column order as soon as it was placed.

		// Find the drop zone for the first in the list of targets - is its
		// left greater than the mouse position. If so, it needs correcting
		let dz = this.s.dropZones.find(function (zone) {
			return zone.colIdx === visibleTargets[0];
		});
		let dzIdx = this.s.dropZones.indexOf(dz);

		if (dz.inlineStart > cursorInlineStart) {
			let previousDiff = dz.inlineStart - cursorInlineStart;
			let previousDz = this.s.dropZones[dzIdx - 1];

			dz.inlineStart -= previousDiff;
			dz.width += previousDiff;

			if (previousDz) {
				previousDz.width -= previousDiff;
			}
		}

		// And for the last in the list
		dz = this.s.dropZones.find(function (zone) {
			return zone.colIdx === visibleTargets[visibleTargets.length - 1];
		});

		if (dz.inlineStart + dz.width < cursorInlineStart) {
			let nextDiff = cursorInlineStart - (dz.inlineStart + dz.width);
			let nextDz = this.s.dropZones[dzIdx + 1];

			dz.width += nextDiff;

			if (nextDz) {
				nextDz.inlineStart += nextDiff;
				nextDz.width -= nextDiff;
			}
		}
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
		let allowedColumns = this.dt.columns(this.c.columns).indexes().toArray();
		let widths = this.dt.columns().widths();

		// Each column is a drop zone
		this.dt.columns().every(function (colIdx, tabIdx, i) {
			if (!this.visible()) {
				return;
			}

			let columnWidth = widths[colIdx];

			// Check that we are allowed to move into this column - if not, need
			// to offset the widths
			if (!allowedColumns.includes(colIdx)) {
				totalWidth += columnWidth;
				return;
			}

			let valid = validateMove(that.dt, moveColumns, colIdx);

			if (valid) {
				// New drop zone. Note that it might have it's offset moved
				// by the final condition in this logic set
				dropZones.push({
					colIdx: colIdx,
					inlineStart: totalWidth - negativeCorrect,
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

		this.s.dropZones = dropZones;
		// this._drawDropZones();
	}

	/**
	 * Check if the table is scrolling or not. It is it the `table` isn't the same for
	 * the header and body parents.
	 *
	 * @returns
	 */
	private _isScrolling() {
		return this.dt.table().body().parentNode !== this.dt.table().header().parentNode;
	}

	/**
	 * Set an interval clock that will check to see if the scrolling of the table body should be moved
	 * as the mouse moves on the scroll (allowing a drag and drop to columns which aren't yet visible)
	 */
	private _scrollRegions() {
		if (!this._isScrolling()) {
			// Not scrolling - nothing to do
			return;
		}

		let that = this;
		let tableLeft = $(this.dt.table().container()).offset().left;
		let tableWidth = $(this.dt.table().container()).outerWidth();
		let mouseBuffer = 75;
		let scrollContainer = this.dt.table().body().parentElement.parentElement;

		this.s.scrollInterval = setInterval(function () {
			let mouseLeft = that.s.mouse.absLeft;

			// On initial mouse down the mouse position can be -1, which we want to ignore
			if (mouseLeft === -1) {
				return;
			}

			if (mouseLeft < tableLeft + mouseBuffer && scrollContainer.scrollLeft) {
				scrollContainer.scrollLeft -= 5;
			}
			else if (
				mouseLeft > tableLeft + tableWidth - mouseBuffer &&
				scrollContainer.scrollLeft < scrollContainer.scrollWidth
			) {
				scrollContainer.scrollLeft += 5;
			}
		}, 25);
	}

	// This is handy for debugging where the drop zones actually are!
	// private _drawDropZones () {
	// 	let dropZones = this.s.dropZones;

	// 	$('div.allan').remove();

	// 	for (let i=0 ; i<dropZones.length ; i++) {
	// 		let zone = dropZones[i];

	// 		$(this.dt.table().container()).append(
	// 			$('<div>')
	// 				.addClass('allan')
	// 				.css({
	// 					position: 'absolute',
	// 					top: 0,
	// 					width: zone.width - 4,
	// 					height: 20,
	// 					left: zone.left + 2,
	// 					border: '1px solid red',
	// 				})
	// 		);
	// 	}
	// }

	private _isRtl() {
		return $(this.dt.table()).css('direction') === 'rtl';
	}

	static defaults: IConfig = {
		columns: '',

		enable: true,

		headerRows: null,

		order: null
	};

	static version = '2.1.1';
}
