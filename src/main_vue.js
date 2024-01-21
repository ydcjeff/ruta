import { createApp } from 'vue';
import { RutaVue, RouteMatches, define_route } from 'ruta-vue';

export { init_vue_app };

function init_vue_app() {
	const app = createApp(RouteMatches);
	const ruta = new RutaVue()
		.add('', [
			define_route({
				path: '',
				page: () => import('./routes/root_layout.vue'),
			}),
		])
		.add('', [
			define_route({
				path: '/',
				page: () => import('./routes/home/home_page.vue'),
			}),
			define_route({
				path: 'params/:param_id',
				page: () => import('./routes/params/param_id_page.vue'),
				parse_params(params) {
					return { param_id: +params.param_id };
				},
			}),
		]);

	app.use(ruta);

	ruta.go('/').then(() => app.mount('#app'));
}
