describe('colReorder - enable', function() {
	let table;

	dt.libs({
		js: ['jquery', 'datatables', 'colreorder'],
		css: ['datatables', 'colreorder']
	});

	dt.html('basic');
	it('No order set by default', function() {
		expect($.fn.dataTable.ColReorder.defaults.enable).toBe(true);
	});

	// TK COLIN need to add test to confirm user interaction
	dt.html('basic');
	it('Can still move columns with the API', function() {
		table = $('#example').DataTable({
			colReorder: {
				enable: false
			}
		});
		table.colReorder.move(5,0);
		expect($('thead tr th').text()).toBe('SalaryNamePositionOfficeAgeStart date');
	});
});
