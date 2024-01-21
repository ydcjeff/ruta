import App from './app.svelte';
import { RutaSvelte, define_route } from 'ruta-svelte';

export { init_svelte_app };

function init_svelte_app() {
	const ruta = new RutaSvelte()
		.add('', [
			define_route({
				path: '/',
				page: () => import('./routes/root_layout.svelte'),
			}),
		])
		.add('/', [
			define_route({
				path: '',
				page: () => import('./routes/home/home_page.svelte'),
			}),
			define_route({
				path: 'params/:param_id',
				page: () => import('./routes/params/param_id_page.svelte'),
				parse_params(params) {
					return { param_id: +params.param_id };
				},
			}),
		]);

	ruta.go('/').then(() => {
		new App({
			target: /** @type {HTMLElement} */ (document.getElementById('app')),
			props: { ruta },
		});
	});
}
