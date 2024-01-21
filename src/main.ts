/// <reference types="vite/client" />

import './style.css';

const fw = import.meta.env.FW;
const is_vue = fw === 'vue';
const is_svelte = fw === 'svelte';
const is_solid = fw === 'solid';

if (is_vue) {
	import('./main_vue.js').then(({ init_vue_app }) => {
		init_vue_app();
	});
} else if (is_svelte) {
	import('./main_svelte.js').then(({ init_svelte_app }) => {
		init_svelte_app();
	});
} else if (is_solid) {
	import('./main_solid.jsx').then(({ init_solid_app }) => {
		init_solid_app();
	});
}

import { Ruta, define_route } from 'ruta-core';

const page = () => 2;

export const ruta = new Ruta({
	base: 'base',
	context: {
		qc: 1,
	},
})
	.add('', [
		define_route({
			path: '/',
			page,
		}),
		define_route({
			path: 'groups',
			page,
			parse_search(search) {
				return { sorted: search.get('sorted') === 'true' };
			},
		}),
	])
	.add('/groups', [
		define_route({
			path: ':group_id',
			page,
			parse_params(params) {
				return {
					group_id: +params.group_id,
				};
			},
			before() {},
			// parse_search(search) {
			// 	return { group_name: search.get('group_name') };
			// },
		}),
	])
	.add('/groups/:group_id', [
		define_route({
			path: 'problems',
			page,
			parse_search(search) {
				return {
					date: search.get('date'),
				};
			},
		}),
		define_route({
			path: 'members',
			page,
			parse_search(search) {
				return {
					dob: search.get('dob'),
				};
			},
		}),
	])
	.add('/groups/:group_id/problems', [
		define_route({
			path: ':problem_id',
			page,
			parse_params({ problem_id }) {
				return { problem_id: +problem_id };
			},
		}),
	]);

ruta.after((to, from) => {
	if (to.href === '/groups/:group_id/problems') {
		// show walkthrough steps
	}
});

declare module 'ruta-core' {
	interface Register {
		router: typeof ruta;
	}
}
