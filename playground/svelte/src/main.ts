/// <reference types="svelte" />
/// <reference types="vite/client" />

import '../../style.css';

import App from './app.svelte';
import { Ruta, define_route } from 'ruta-svelte';

const ruta = new Ruta()
	.add('', [
		define_route({
			path: '/',
			page: () => import('./routes/root_layout.svelte'),
		}),
	])
	.add('/', [
		define_route({
			path: '',
			page: () => import('./routes/home_page.svelte'),
		}),
		define_route({
			path: 'params/:param_id',
			page: () => import('./routes/param_id_page.svelte'),
			parse_params(params) {
				return { param_id: +params.param_id };
			},
		}),
	]);

ruta.go().then(() => {
	new App({
		target: document.getElementById('app')!,
		props: { ruta },
	});
});

declare module 'ruta-svelte' {
	interface Register {
		router: typeof ruta;
	}
}
