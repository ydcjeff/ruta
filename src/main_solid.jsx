import {
	RouteMatches,
	RutaSolid,
	RouterProvider,
	define_routes,
} from 'ruta-solid';
import { render } from 'solid-js/web';

export { init_solid_app };

function init_solid_app() {
	const ruta = new RutaSolid({
		routes: define_routes(
			{
				path: '/',
				page: () => import('./routes/root_layout.jsx'),
			},
			{
				'': {
					page: () => import('./routes/home/home_page.jsx'),
				},
				'params/:param_id': {
					page: () => import('./routes/params/param_id_page.jsx'),
					parse_params(params) {
						return { param_id: +params.param_id };
					},
				},
			},
		),
	});

	ruta.go().then(() => {
		render(
			() => (
				<RouterProvider ruta={ruta}>
					<RouteMatches />
				</RouterProvider>
			),
			/** @type {HTMLElement} */ (document.getElementById('app')),
		);
	});
}
