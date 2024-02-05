import { inject, markRaw, readonly, shallowReactive } from 'vue';
import { Ruta } from 'ruta-core';
import { ROUTER_SYMBOL, ROUTE_SYMBOL } from './route_matches.vue';

export * from 'ruta-core';
export { default as RouteMatches } from './route_matches.vue';
export { RutaVue, use_router, use_route };

class RutaVue extends Ruta {
	#route = shallowReactive({});

	/** @param {import('./index').RutaOptions} opts */
	constructor(opts) {
		super(opts);

		this.after(({ to }) => {
			for (const key in to) {
				// @ts-expect-error
				this.#route[key] = key === 'pages' ? markRaw(to[key]) : to[key];
			}
		});
	}

	/** @type {import('./index').RutaVue['install']} */
	install(app) {
		app.provide(ROUTER_SYMBOL, this);
		app.provide(ROUTE_SYMBOL, readonly(this.#route));
	}
}

/** @type {import('./index').use_router} */
function use_router() {
	// @ts-expect-error
	return inject(ROUTER_SYMBOL);
}

/** @type {import('./index').use_route} */
function use_route() {
	// @ts-expect-error
	return inject(ROUTE_SYMBOL);
}
