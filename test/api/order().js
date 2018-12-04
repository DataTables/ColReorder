describe('colReorder - order()', function() {
	var table;

	dt.libs({
		js: ['jquery', 'datatables', 'colreorder'],
		css: ['datatables', 'colreorder']
	});

	describe('Check the defaults', function() {
		dt.html('basic');
		let table;
		it('Exists and is a function', function() {
			table = $('#example').DataTable({
				colReorder: true
			});
			expect(typeof table.colReorder.order).toBe('function');
		});

		it('Setter returns an API instance', function() {
			expect(table.colReorder.order() instanceof Array).toBe(true);
		});

		it('Setter returns an API instance', function() {
			expect(table.colReorder.order([0, 1, 2, 3, 4, 5]) instanceof $.fn.dataTable.Api).toBe(true);
		});
	});

	describe('Check the getter', function() {
		dt.html('basic');
		let table;
		it('Standard position initially', function() {
			table = $('#example').DataTable({
				colReorder: true
			});
			expect(JSON.stringify(table.colReorder.order())).toBe(JSON.stringify([0, 1, 2, 3, 4, 5]));
		});
		it('Reorder all columns', function() {
			table.colReorder.order([5, 4, 3, 2, 1, 0]);
			expect(JSON.stringify(table.colReorder.order())).toBe(JSON.stringify([5, 4, 3, 2, 1, 0]));
		});
		it('Move a column', function() {
			table.colReorder.move(0, 5);
			expect(JSON.stringify(table.colReorder.order())).toBe(JSON.stringify([4, 3, 2, 1, 0, 5]));
		});

		dt.html('basic');
		it('Order changed at initialisation', function() {
			table = $('#example').DataTable({
				colReorder: {
					order: [5, 4, 3, 2, 1, 0]
				}
			});
			expect(JSON.stringify(table.colReorder.order())).toBe(JSON.stringify([5, 4, 3, 2, 1, 0]));
		});
	});

	function checkHeaders(expected) {
		for (let i = 0; i < 6; i++) {
			expect($('thead tr th:eq(' + i + ')').text()).toBe(expected[i]);
		}
	}

	describe('Check the setter', function() {
		dt.html('basic');
		let table;
		it('Standard position initially', function() {
			table = $('#example').DataTable({
				colReorder: true
			});
			checkHeaders(['Name', 'Position', 'Office', 'Age', 'Start date', 'Salary']);
		});
		it('Reorder reverse', function() {
			table.colReorder.order([5, 4, 3, 2, 1, 0]);
			checkHeaders(['Salary', 'Start date', 'Age', 'Office', 'Position', 'Name']);
		});
		it('Reorder back', function() {
			table.colReorder.order([5, 4, 3, 2, 1, 0]);
			checkHeaders(['Name', 'Position', 'Office', 'Age', 'Start date', 'Salary']);
		});
		it('Reorder reverse with false for original index', function() {
			table.colReorder.order([5, 4, 3, 2, 1, 0], false);
			checkHeaders(['Salary', 'Start date', 'Age', 'Office', 'Position', 'Name']);
		});
		it('Reorder back with false for original index', function() {
			table.colReorder.order([5, 4, 3, 2, 1, 0], false);
			checkHeaders(['Name', 'Position', 'Office', 'Age', 'Start date', 'Salary']);
		});
		it('Reorder reverse using original indexes', function() {
			table.colReorder.order([5, 4, 3, 2, 1, 0], true);
			checkHeaders(['Salary', 'Start date', 'Age', 'Office', 'Position', 'Name']);
		});
		it('Reorder back using original indexes', function() {
			table.colReorder.order([0, 1, 2, 3, 4, 5], true);
			checkHeaders(['Name', 'Position', 'Office', 'Age', 'Start date', 'Salary']);
		});
	});
});
