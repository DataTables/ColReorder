describe('colReorder - reset()', function() {
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
			expect(typeof table.colReorder.reset).toBe('function');
		});

		it('Returns an API instance', function() {
			expect(table.colReorder.reset() instanceof $.fn.dataTable.Api).toBe(true);
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
			expect(JSON.stringify(table.colReorder.order())).toBe(JSON.stringify([0, 1, 2, 3, 4, 5]));
		});
		it('Move first column to the end', function() {
			table.colReorder.move(0, 5);
			checkHeaders(['Position', 'Office', 'Age', 'Start date', 'Salary', 'Name']);
			expect(JSON.stringify(table.colReorder.order())).toBe(JSON.stringify([1, 2, 3, 4, 5, 0]));
		});
		it('Reset', function() {
			table.colReorder.reset();
			checkHeaders(['Name', 'Position', 'Office', 'Age', 'Start date', 'Salary']);
			expect(JSON.stringify(table.colReorder.order())).toBe(JSON.stringify([0, 1, 2, 3, 4, 5]));
		});
		it('Reorder all columns', function() {
			table.colReorder.order([5, 4, 3, 2, 1, 0]);
			checkHeaders(['Salary', 'Start date', 'Age', 'Office', 'Position', 'Name']);
			expect(JSON.stringify(table.colReorder.order())).toBe(JSON.stringify([5, 4, 3, 2, 1, 0]));
		});
		it('Reset', function() {
			table.colReorder.reset();
			checkHeaders(['Name', 'Position', 'Office', 'Age', 'Start date', 'Salary']);
			expect(JSON.stringify(table.colReorder.order())).toBe(JSON.stringify([0, 1, 2, 3, 4, 5]));
		});		

		dt.html('basic');
		it('Order changed at initialisation', function() {
			table = $('#example').DataTable({
				colReorder: {
					order: [5, 4, 3, 2, 1, 0]
				}
			});
			checkHeaders(['Salary', 'Start date', 'Age', 'Office', 'Position', 'Name']);
			expect(JSON.stringify(table.colReorder.order())).toBe(JSON.stringify([5, 4, 3, 2, 1, 0]));
		});
		it('Reset', function() {
			table.colReorder.reset();
			checkHeaders(['Name', 'Position', 'Office', 'Age', 'Start date', 'Salary']);
			expect(JSON.stringify(table.colReorder.order())).toBe(JSON.stringify([0, 1, 2, 3, 4, 5]));
		});	
	});
});
