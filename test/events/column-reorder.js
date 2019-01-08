describe('colReorder - column-reorder', function() {
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
			table.on('column-reorder', function() {
				params = arguments;
				count++;
				headers = $('thead tr th').text();
			});

			table.colReorder.move(0, 5);

			expect(params.length).toBe(3);
			expect(params[0] instanceof $.Event).toBe(true);
			expect(params[1]).toBe(table.settings()[0]);
			expect(typeof params[2]).toBe('object');
		});
		it('Is called after the move', function() {
			expect(headers).toBe('PositionOfficeAgeStart dateSalaryName');
		});
		it('called once per move', function() {
			expect(count).toBe(1);
		});
	});

	describe('Functional tests', function() {
		let table;
		let params;
		let count;
		let headers;

		function resetTest() {
			table.colReorder.reset();
			count = 0;
			params = undefined;
			headers = '';
		}

		dt.html('basic');
		it('Set stuff up', function() {
			table = $('#example').DataTable({
				colReorder: true
			});

			table.on('column-reorder', function() {
				params = arguments;
				count++;
				headers = $('thead tr th').text();
			});
		});
		it('Called just the once for a move', function() {
			resetTest();
			table.colReorder.move(0, 5);

			expect(count).toBe(1);
		});
		it('from has the correct value', function() {
			expect(params[2].from).toBe(0);
		});
		it('to has the correct value', function() {
			expect(params[2].to).toBe(5);
		});
		it('mapping has the correct value', function() {
			expect(JSON.stringify(params[2].mapping)).toBe(JSON.stringify([5, 0, 1, 2, 3, 4]));
		});
		it('drop has the correct value', function() {
			// DD-744 expect(params[2].drop).toBe(true);
		});

		it('Called for each move when order() called', function() {
			resetTest();
			table.colReorder.order([5, 4, 3, 2, 1, 0]);

			expect(count).toBe(5);
		});
		it('last from has the correct value', function() {
			expect(params[2].from).toBe(5);
		});
		it('last to has the correct value', function() {
			expect(params[2].to).toBe(4);
		});
		it('last mapping has the correct value', function() {
			expect(JSON.stringify(params[2].mapping)).toBe(JSON.stringify([0, 1, 2, 3, 5, 4]));
		});
		it('last drop has the correct value', function() {
			expect(params[2].drop).toBe(true);
		});
	});
});
