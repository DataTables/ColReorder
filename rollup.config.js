import resolve from '@rollup/plugin-node-resolve';

export default [
	{
		input: 'js/dataTables.colReorder.js',
		output: {
			file: process.env.OUT + '/js/dataTables.colReorder.js',
			format: 'iife'
		},
		plugins: [resolve()]
	}
];
