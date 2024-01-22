/// <reference types="vite/client" />

import '../../style.css';

import { createApp } from 'vue';
import { Ruta, RouteMatches, define_route, install_router } from 'ruta-vue';

const app = createApp(RouteMatches);
const ruta = new Ruta({ base: 'vue' }).add('', [
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
]);

app.use(install_router, ruta);

ruta.go().then(() => app.mount('#app'));

declare module 'ruta-vue' {
	interface Register {
		router: typeof ruta;
	}
}
