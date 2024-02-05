import { Ruta } from 'ruta-core';
import { getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';
// @ts-expect-error
import { ROUTER_SYMBOL, ROUTE_SYMBOL } from './route_matches.svelte';

export * from 'ruta-core';
export { RutaSvelte, get_route, get_router };
export { default as RouteMatches } from './route_matches.svelte';

class RutaSvelte extends Ruta {
	#route = writable();

	/** @param {import('./index').RutaOptions} opts */
	constructor(opts) {
		super(opts);

		this.after(({ to }) => {
			this.#route.set(to);
		});
	}

	install() {
		setContext(ROUTER_SYMBOL, this);
		setContext(ROUTE_SYMBOL, { subscribe: this.#route.subscribe });
	}
}

/** @type {import('./index').get_router} */
function get_router() {
	return getContext(ROUTER_SYMBOL);
}

/** @type {import('./index').get_route} */
function get_route() {
	return getContext(ROUTE_SYMBOL);
}
