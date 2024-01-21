import { Ruta } from 'ruta-core';
import { inject, readonly, shallowReactive } from 'vue';

export * from 'ruta-core';
export { default as RouteMatches } from './route_matches.vue';
export { RutaVue, use_router, use_route };

const ROUTER_SYMBOL = Symbol();

const ROUTE_SYMBOL = Symbol();

class RutaVue extends Ruta {
	#route = shallowReactive({
		path: '/',
		params: {},
		search: {},
		pages: [],
	});

	constructor(options = {}) {
		super(options);
		this.after((to) => {
			for (const key in to) {
				// TODO update route
			}
		});
	}

	/** @type {import('./index').RutaVue['install']} */
	install(app) {
		app.provide(ROUTER_SYMBOL, this);
		app.provide(ROUTE_SYMBOL, readonly(this.#route));
	}
}

function use_router() {
	return inject(ROUTER_SYMBOL);
}

function use_route() {
	return inject(ROUTE_SYMBOL);
}
