describe('colReorder - transpose()', function() {
	let table;

	dt.libs({
		js: ['jquery', 'datatables', 'colreorder'],
		css: ['datatables', 'colreorder']
	});

	describe('Check the defaults', function() {
		dt.html('basic');
		it('Exists and is a function', function() {
			table = $('#example').DataTable({
				colReorder: true
			});
			expect(typeof table.colReorder.transpose).toBe('function');
		});

		it('Returns an integer instance', function() {
			expect(typeof table.colReorder.transpose(1)).toBe('number');
		});

		it('Returns an array instance', function() {
			expect(table.colReorder.transpose([1, 2]) instanceof Array).toBe(true);
		});
	});

	function checkTranspose(idx, expected, direction) {
		// check individuals
		for (let i = 0; i < idx.length; i++) {
			expect(table.colReorder.transpose(idx[i], direction)).toBe(expected[i]);
		}

		// check array
		expect(JSON.stringify(table.colReorder.transpose(idx, direction))).toBe(JSON.stringify(expected));
	}

	describe('Check the behaviour', function() {
		dt.html('basic');
		it('Standard position initially', function() {
			table = $('#example').DataTable({
				colReorder: true
			});
			checkTranspose([0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5], 'toCurrent');
			checkTranspose([0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5], 'fromOriginal');
			checkTranspose([0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5], 'toOriginal');
			checkTranspose([0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5], 'fromCurrent');
		});
		it('Move a column', function() {
			table.colReorder.move(0, 5);
			checkTranspose([0, 1, 2, 3, 4, 5], [5, 0, 1, 2, 3, 4], 'toCurrent');
			checkTranspose([0, 1, 2, 3, 4, 5], [5, 0, 1, 2, 3, 4], 'fromOriginal');
			checkTranspose([0, 1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 0], 'toOriginal');
			checkTranspose([0, 1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 0], 'fromCurrent');
		});
		it('Check a subset', function() {
			checkTranspose([0, 1], [5, 0], 'toCurrent');
			checkTranspose([0, 1], [5, 0], 'fromOriginal');
			checkTranspose([0, 1], [1, 2], 'toOriginal');
			checkTranspose([0, 1], [1, 2], 'fromCurrent');
		});
		it('After a reset', function() {
			table.colReorder.reset();
			checkTranspose([0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5], 'toCurrent');
			checkTranspose([0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5], 'fromOriginal');
			checkTranspose([0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5], 'toOriginal');
			checkTranspose([0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5], 'fromCurrent');
		});
		it('Reorder', function() {
			table.colReorder.order([5, 4, 3, 2, 1, 0]);
			checkTranspose([0, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 0], 'toCurrent');
			checkTranspose([0, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 0], 'fromOriginal');
			checkTranspose([0, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 0], 'toOriginal');
			checkTranspose([0, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 0], 'fromCurrent');
		});

		dt.html('basic');
		it('Modified position initially', function() {
			table = $('#example').DataTable({
				colReorder: {
					order: [5, 4, 3, 2, 1, 0]
				}
			});
			checkTranspose([0, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 0], 'toCurrent');
			checkTranspose([0, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 0], 'fromOriginal');
			checkTranspose([0, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 0], 'toOriginal');
			checkTranspose([0, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 0], 'fromCurrent');
		});
	});
});
