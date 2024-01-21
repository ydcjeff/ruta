import { SvelteComponent } from 'svelte';
import { Ruta } from 'ruta-core';

declare module 'ruta-core' {
	interface Register {
		component: SvelteComponent;
	}
}

export * from 'ruta-core';

export class RutaSvelte extends Ruta {
	/**
	 * Install RutaSvelte plugin.
	 */
	install(): void;
}

export { default as RouteMatches } from './route_matches.svelte';

export function get_router(): Omit<RutaSvelte, 'add'>;

export function get_route(): any;
