describe('colReorder - columns-reordered', function() {
	let table;

	dt.libs({
		js: ['jquery', 'datatables', 'colreorder'],
		css: ['datatables', 'colreorder']
	});

	describe('Check the defaults', function() {
		let table;
		let params = undefined;
		let count = 0;
		let headers = '';

		dt.html('basic');
		it('Set stuff up', function() {
			table = $('#example').DataTable({
				colReorder: true
			});
		});
		it('Is called with the right parameters', function() {
			table.on('columns-reordered', function() {
				params = arguments;
				count++;
				headers = $('thead tr th').text();
			});

			table.colReorder.move(0, 5);

			expect(params.length).toBe(2);
			expect(params[0] instanceof $.Event).toBe(true);
			expect(typeof params[1]).toBe('object');
		});
		it('Is called after the move', function() {
			expect(headers).toBe('PositionOfficeAgeStart dateSalaryName');
		});
		it('called once per move', function() {
			expect(count).toBe(1);
		});
	});

	describe('Full ordering', function() {
		let table;
		let params;
		let count = 0;
		let headers;

		dt.html('basic');
		it('Set stuff up', function() {
			table = $('#example').DataTable({
				colReorder: true
			});

			table.on('columns-reordered', function() {
				params = arguments;
				count++;
				headers = $('thead tr th').text();
			});

			table.colReorder.order([5,4,3,2,1,0]);
			expect(params.length).toBe(2);
		});
		it('header was updated', function() {
			expect(headers).toBe('SalaryStart dateAgeOfficePositionName');
		});
		it('called once per order', function() {
			expect(count).toBe(1);
		});
	});
});
