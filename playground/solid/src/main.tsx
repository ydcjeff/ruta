/// <reference types="vite/client" />

import '../../style.css';

import {
	RouteMatches,
	RutaSolid,
	RouterContext,
	define_route,
} from 'ruta-solid';
import { render } from 'solid-js/web';

const ruta = new RutaSolid()
	.add('', [
		define_route({
			path: '/',
			page: () => import('./routes/root_layout.jsx'),
		}),
	])
	.add('/', [
		define_route({
			path: '',
			page: () => import('./routes/home_page.jsx'),
		}),
		define_route({
			path: 'params/:param_id',
			page: () => import('./routes/param_id_page.jsx'),
			parse_params(params) {
				return { param_id: +params.param_id };
			},
		}),
	]);

ruta.go('/').then(() => {
	render(
		() => (
			<RouterContext.Provider value={ruta}>
				<RouteMatches />
			</RouterContext.Provider>
		),
		document.getElementById('app')!,
	);
});
