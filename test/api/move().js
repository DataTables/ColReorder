describe('colReorder - move()', function() {
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
			expect(typeof table.colReorder.move).toBe('function');
		});

		it('Returns an API instance', function() {
			expect(table.colReorder.move(1, 0) instanceof $.fn.dataTable.Api).toBe(true);
		});
	});

	function checkHeaders(expected) {
		for (let i = 0; i < 6; i++) {
			expect($('thead tr th:eq(' + i + ')').text()).toBe(expected[i]);
		}
	}

	describe('Check the behaviour', function() {
		dt.html('basic');
		let table;
		it('Standard position initially', function() {
			table = $('#example').DataTable({
				colReorder: true
			});
			checkHeaders(['Name', 'Position', 'Office', 'Age', 'Start date', 'Salary']);
		});
		it('Move first column to the end', function() {
			table.colReorder.move(0, 5);
			checkHeaders(['Position', 'Office', 'Age', 'Start date', 'Salary', 'Name']);
		});
		it('Move last column to the start', function() {
			table.colReorder.move(5, 0);
			checkHeaders(['Name', 'Position', 'Office', 'Age', 'Start date', 'Salary']);
		});
		it('Move middle columns', function() {
			table.colReorder.move(4, 2);
			checkHeaders(['Name', 'Position', 'Start date', 'Office', 'Age', 'Salary']);
		});
		it('Move explicitly stating drop', function() {
			table.colReorder.move(2, 4, true);
			checkHeaders(['Name', 'Position', 'Office', 'Age', 'Start date', 'Salary']);
		});
		// TK COLIN not sure what this should do
		it('Move without drop', function() {
			table.colReorder.move(4, 2, false);
			checkHeaders(['Name', 'Position', 'Start date', 'Office', 'Age', 'Salary']);
		});
		it('Draw to refresh', function() {
			table.draw();
			checkHeaders(['Name', 'Position', 'Start date', 'Office', 'Age', 'Salary']);
		});
		it('Move without invalidate', function() {
			table.colReorder.move(2, 4, true, false);
			checkHeaders(['Name', 'Position', 'Office', 'Age', 'Start date', 'Salary']);

			table.order([2, 'asc']).draw();
			expect($('tbody tr td:eq(2)').text()).toBe('New York');
		});
		it('Invalidate to refresh', function() {
			table
				.rows()
				.invalidate()
				.draw();
			checkHeaders(['Name', 'Position', 'Office', 'Age', 'Start date', 'Salary']);
			expect($('tbody tr td:eq(2)').text()).toBe('Edinburgh');
		});
		it('Move with invalidate', function() {
			table.colReorder.move(2, 4, true, true);
			checkHeaders(['Name', 'Position', 'Age', 'Start date', 'Office', 'Salary']);

			table.order([4, 'asc']).draw();
			expect($('tbody tr td:eq(4)').text()).toBe('Edinburgh');
		});
	});

	describe('Advanced/integration test', function() {
		dt.html('basic');
		let table;

		// TK COLIN Disabled because of DD-759
		// it('Ensure row heights are sensible', function() {
		// 	table = $('#example').DataTable({
		// 		colReorder: true
		// 	});

		// 	let height = $('tbody tr:eq(1)').height();

		// 	table.column(1).visible(false);
		// 	table.colReorder.move(4, 3);
		// 	table.columns().visible(true);

		// 	expect(height).toBe($('tbody tr:eq(1)').height())
		// });
	});
});
