import { App, DefineComponent } from 'vue';
import { Ruta } from 'ruta-core';

declare module 'ruta-core' {
	interface Register {
		component: DefineComponent;
	}
}

export * from 'ruta-core';

export class RutaVue extends Ruta {
	/**
	 * Install RutaVue plugin.
	 */
	install(app: App): void;
}

export { default as RouteMatches } from './route_matches.vue';

export function use_router(): Omit<RutaVue, 'add'>;

export function use_route(): any;
