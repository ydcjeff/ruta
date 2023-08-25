import { Ruta } from 'ruta-core';
import { getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';

export * from 'ruta-core';
export { RutaSvelte, get_route, get_router };
export { default as RouteMatches } from './route_matches.svelte';

const ROUTER_SYMBOL = Symbol();

const ROUTE_SYMBOL = Symbol();

class RutaSvelte extends Ruta {
	#route = writable({
		path: '/',
		params: {},
		search: {},
		pages: [],
	});

	constructor(options) {
		super(options);
		this.on_after_navigate((to) => {
			this.#route.set(to);
		});
	}

	/**
	 * Install RutaSvelte plugin.
	 */
	install() {
		setContext(ROUTER_SYMBOL, this);
		setContext(ROUTE_SYMBOL, { subscribe: this.#route.subscribe });
	}
}

/**
 * Get RutaSvelte instance from Svelte app's context.
 *
 * @returns {RutaSvelte}
 */
function get_router() {
	return getContext(ROUTER_SYMBOL);
}

function get_route() {
	return getContext(ROUTE_SYMBOL);
}
