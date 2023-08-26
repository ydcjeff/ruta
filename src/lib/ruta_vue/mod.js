import { Ruta } from 'ruta-core';
import { inject, markRaw, readonly, shallowReactive } from 'vue';

export * from 'ruta-core';
export { default as RouteMatches } from './route_matches.vue';
export { RutaVue, use_router, use_route };

/** @type {import('vue').InjectionKey<RutaVue>} */
const ROUTER_SYMBOL = Symbol();

const ROUTE_SYMBOL = Symbol();

class RutaVue extends Ruta {
	#route = shallowReactive({
		path: '/',
		params: {},
		search: {},
		pages: [],
	});

	constructor(options) {
		super(options);
		this.on_after_navigate((to) => {
			for (const key in to) {
				const value = to[key];
				this.#route[key] = key === 'pages' ? markRaw(value) : value;
			}
		});
	}

	/**
	 * Install RutaVue plugin.
	 *
	 * @param {import('vue').App} app
	 */
	install(app) {
		app.provide(ROUTER_SYMBOL, this);
		app.provide(ROUTE_SYMBOL, readonly(this.#route));
	}
}

function use_router() {
	return /** @type {RutaVue} */ (inject(ROUTER_SYMBOL));
}

function use_route() {
	return inject(ROUTE_SYMBOL);
}
