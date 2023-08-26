import { createApp } from 'vue';
import { RutaVue, RouteMatches, define_routes } from 'ruta-vue';

export { init_vue_app };

function init_vue_app() {
	const app = createApp(RouteMatches);
	const ruta = new RutaVue({
		routes: define_routes(
			{
				path: '/',
				page: () => import('./routes/root_layout.vue'),
			},
			{
				'': {
					page: () => import('./routes/home/home_page.vue'),
				},
				'params/:param_id': {
					page: () => import('./routes/params/param_id_page.vue'),
					parse_params(params) {
						return { param_id: +params.param_id };
					},
				},
			},
		),
	});

	app.use(ruta);

	ruta.go().then(() => app.mount('#app'));
}
