import { create_routes, define_route } from './mod.js';
import { expect, test } from 'vitest';

test(create_routes.name, () => {
	const routes = create_routes()
		.add('', [
			define_route({
				path: '/',
				page: '/',
				error: '/',
			}),
		])
		.add('/', [
			define_route({
				path: '',
				page: '',
			}),
			define_route({
				path: 'child-1',
				page: 'child-1',
				error: 'child-1',
			}),
		])
		.add('/child-1', [
			define_route({
				path: 'grand-child-1',
				page: 'grand-child-1',
			}),
		])
		.add('/', [
			define_route({
				path: 'users',
				page: 'users',
			}),
		])
		.add('/users', [
			define_route({
				path: ':user_id',
				page: ':user_id',
			}),
			define_route({
				path: '',
				page: '',
			}),
			define_route({
				path: '/',
				page: '/',
			}),
		])
		.done();

	expect(routes).toMatchSnapshot();
});
