import { inject, markRaw, readonly, shallowReactive } from 'vue';
import { Ruta } from 'ruta-core';

export * from 'ruta-core';
export { default as RouteMatches } from './route_matches.vue';
export { RutaVue, use_router, use_route };

const ROUTER_SYMBOL = Symbol();

const ROUTE_SYMBOL = Symbol();

class RutaVue extends Ruta {
	#route = shallowReactive(
		/** @type {import('./index').Route} */ ({
			href: '/',
			pages: [],
			params: {},
			path: '/',
			search: {},
		}),
	);

	/** @param {import('./index').RutaOptions} opts */
	constructor(opts) {
		super(opts);

		this.after(({ to }) => {
			this.#route = to;
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
