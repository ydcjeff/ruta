import { define_routes } from 'ruta-core';
import App from './app.svelte';
import { RutaSvelte } from 'ruta-svelte';

export { init_svelte_app };

function init_svelte_app() {
	const ruta = new RutaSvelte({
		routes: define_routes(
			{
				path: '/',
				page: () => import('./routes/root_layout.svelte'),
			},
			{
				'': {
					page: () => import('./routes/home/home_page.svelte'),
				},
				'params/:param_id': {
					page: () => import('./routes/params/param_id_page.svelte'),
					parse_params(params) {
						return { param_id: +params.param_id };
					},
				},
			},
		),
	});

	ruta.go().then(() => {
		new App({
			target: /** @type {HTMLElement} */ (document.getElementById('app')),
			props: { ruta },
		});
	});
}
