/// <reference types="vite/client" />

import '../../style.css';

import { createApp } from 'vue';
import { RouteMatches, define_route, create_routes, RutaVue } from 'ruta-vue';

const routes = create_routes()
	.add('', [
		define_route({
			path: '/',
			page: () => import('./routes/root_layout.vue'),
		}),
		define_route({
			path: 'home',
			page: () => import('./routes/home_page.vue'),
		}),
		define_route({
			path: 'params/:param_id',
			page: () => import('./routes/param_id_page.vue'),
			parse_params(params) {
				return { param_id: +params.param_id };
			},
		}),
	])
	.done();

const app = createApp(RouteMatches);
const ruta = new RutaVue({ base: 'vue', routes, context: { qc: 1 } });

app.use(ruta);

ruta.go().then(() => app.mount('#app'));

declare module 'ruta-vue' {
	interface Register {
		router: typeof ruta;
	}
}
