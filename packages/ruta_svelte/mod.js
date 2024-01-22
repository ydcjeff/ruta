import { Ruta } from 'ruta-core';
import { getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';

export * from 'ruta-core';
export { install_router, get_route, get_router };
export { default as RouteMatches } from './route_matches.svelte';

const ROUTER_SYMBOL = Symbol();

const ROUTE_SYMBOL = Symbol();

function get_router() {
	return getContext(ROUTER_SYMBOL);
}

function get_route() {
	return getContext(ROUTE_SYMBOL);
}

/** @type {import('./index').install_router} */
function install_router(router) {
	const route = writable({
		path: '/',
		params: {},
		search: {},
		pages: [],
	});

	router.after((to) => {
		route.set(to);
	});

	setContext(ROUTER_SYMBOL, router);
	setContext(ROUTE_SYMBOL, { subscribe: route.subscribe });
}
