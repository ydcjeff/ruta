import type { App, Component } from 'vue';
import type { Ruta, RegisteredRouter } from 'ruta-core';

declare module 'ruta-core' {
	interface Register {
		component: Component;
	}
}

export * from 'ruta-core';

export { default as RouteMatches } from './route_matches.vue';

export function use_router(): Omit<RegisteredRouter, 'add'>;

export function use_route<
	T extends keyof RegisteredRouter['ROUTES'] = keyof RegisteredRouter['ROUTES'],
>(route?: T): RegisteredRouter['ROUTES'][T];

export function install_router(app: App, router: Ruta): void;
