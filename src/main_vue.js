import { createApp } from 'vue';
import { RutaVue, RouteMatches } from 'ruta-vue';

import { use_router } from 'ruta-core';

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

const ruta = use_router();

ruta.to_href('/groups');

ruta.to_href({
	path: '/groups/:group_id/problems/:problem_id',
	params: {
		group_id: 1,
		problem_id: 1,
	},
	search: {
		date: '2024-01-01',
		sorted: true,
		// group_name: null,
	},
});

ruta.go({
	path: '/groups',
	search: {
		sorted: false,
	},
});

ruta.go({
	path: '/groups/:group_id/problems',
	params: {
		group_id: 2,
	},
	search: {
		date: '',
		sorted: true,
	},
});

ruta.go({
	path: '/groups/:group_id/members',
	params: { group_id: 3 },
	search: { dob: '1998-09-12', sorted: !1 },
});
