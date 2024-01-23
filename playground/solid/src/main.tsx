/// <reference types="vite/client" />

import '../../style.css';

import {
	RouteMatches,
	RutaSolid,
	RouterContext,
	define_route,
	create_routes,
} from 'ruta-solid';
import { lazy } from 'solid-js';
import { render } from 'solid-js/web';

const routes = create_routes()
	.add('', [
		define_route({
			path: '/',
			page: lazy(() => import('./routes/root_layout.jsx')),
		}),
	])
	.add('/', [
		define_route({
			path: 'home',
			page: lazy(() => import('./routes/home_page.jsx')),
		}),
		define_route({
			path: 'params/:param_id',
			page: lazy(() => import('./routes/param_id_page.jsx')),
			parse_params(params) {
				return { param_id: +params.param_id };
			},
		}),
	])
	.done();

const ruta = new RutaSolid({ base: 'solid', context: { di: 123 }, routes });

ruta.go().then(() => {
	render(
		() => (
			<RouterContext.Provider value={ruta}>
				<RouteMatches />
			</RouterContext.Provider>
		),
		document.getElementById('app')!,
	);
});

declare module 'ruta-solid' {
	interface Register {
		router: typeof ruta;
	}
}
