import { inject, markRaw, readonly, shallowReactive } from 'vue';

export * from 'ruta-core';
export { default as RouteMatches } from './route_matches.vue';
export { use_router, use_route, install_router };

const ROUTER_SYMBOL = Symbol();

const ROUTE_SYMBOL = Symbol();

function use_router() {
	return inject(ROUTER_SYMBOL);
}

function use_route() {
	return inject(ROUTE_SYMBOL);
}

/** @type {import('./index').install_router} */
function install_router(app, router) {
	const route = shallowReactive(
		/** @type {import('./index').Route} */ ({
			href: '/',
			pages: [],
			params: {},
			path: '/',
			search: {},
		}),
	);

	router.after((to) => {
		for (const key in to) {
			// @ts-expect-error
			route[key] = key === 'pages' ? markRaw(to[key]) : to[key];
		}
	});

	app.provide(ROUTER_SYMBOL, router);
	app.provide(ROUTE_SYMBOL, readonly(route));
}
