import {
	RouteMatches,
	RutaSolid,
	RouterContext,
	define_route,
} from 'ruta-solid';
import { render } from 'solid-js/web';

export { init_solid_app };

function init_solid_app() {
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
				page: () => import('./routes/home/home_page.jsx'),
			}),
			define_route({
				path: 'params/:param_id',
				page: () => import('./routes/params/param_id_page.jsx'),
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
			/** @type {HTMLElement} */ (document.getElementById('app')),
		);
	});
}
