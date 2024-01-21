import { Ruta } from './mod.js';
import { assert, describe, test } from 'vitest';

describe('Ruta.to_href', () => {
	const ruta = new Ruta();

	test('/', () => {
		assert.deepEqual(ruta.to_href('/'), '/');
	});

	test('/users', () => {
		assert.deepEqual(ruta.to_href('users'), '/users');
	});

	test('to options', () => {
		assert.deepEqual(
			ruta.to_href({
				path: '/test',
				search: {
					pass: true,
				},
			}),
			'/test?pass=true',
		);
	});
});
