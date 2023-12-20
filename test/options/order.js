describe('colReorder - order', function() {
	let table;

	dt.libs({
		js: ['jquery', 'datatables', 'colreorder'],
		css: ['datatables', 'colreorder']
	});

	dt.html('basic');
	it('No order set by default', function() {
		table = $('#example').DataTable({
			colReorder: true
		});
		expect($.fn.dataTable.ColReorder.defaults.order).toBe(null);
		expect($('thead tr th').text()).toBe('NamePositionOfficeAgeStart dateSalary');
	});

	dt.html('basic');
	it('Order complied with', function() {
		table = $('#example').DataTable({
			colReorder: {
				order: [5, 4, 3, 2, 1, 0]
			}
		});
		expect($('thead tr th').text()).toBe('SalaryStart dateAgeOfficePositionName');
	});
});
