import { create_routes, define_route } from './mod.js';
import { expect, test } from 'vitest';

test(create_routes.name, () => {
	const routes = create_routes()
		.add('', [
			define_route({
				path: '/',
				page: '/',
				error: '/',
				parse_params() {
					return {};
				},
				parse_search() {
					return {};
				},
			}),
		])
		.add('/', [
			define_route({
				path: '',
				page: '/index',
				load() {},
			}),
			define_route({
				path: 'tests',
				page: '/tests',
				error: '/tests',
			}),
		])
		.add('/tests', [
			define_route({
				path: '/',
				page: '/tests/',
				parse_search() {
					return {};
				},
			}),
			define_route({
				path: ':test_id',
				page: '/tests/:test_id',
				load() {},
				parse_params(params) {
					return { test_id: +params.test_id };
				},
			}),
			define_route({
				path: '',
				page: '/tests/index',
				error: '/tests/index',
				load() {},
			}),
		])
		.done();

	expect(routes).toMatchSnapshot();
});
