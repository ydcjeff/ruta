import { createApp } from 'vue';
import { RutaVue, RouteMatches } from 'ruta-vue';

export { init_vue_app };

function init_vue_app() {
	const app = createApp(RouteMatches);
	const ruta = new RutaVue({
		routes: {},
	});

	app.use(ruta);

	ruta.go('/').then(() => app.mount('#app'));
}
