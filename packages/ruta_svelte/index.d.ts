import type { SvelteComponent } from 'svelte';
import type { Ruta, RegisteredRouter } from 'ruta-core';

declare module 'ruta-core' {
	interface Register {
		component: SvelteComponent;
	}
}

export * from 'ruta-core';

export class RouteMatches extends SvelteComponent {}

export function get_router(): Omit<RegisteredRouter, 'add'>;

export function get_route<
	T extends keyof RegisteredRouter['ROUTES'] = keyof RegisteredRouter['ROUTES'],
>(route?: T): RegisteredRouter['ROUTES'][T];

export function install_router(router: Ruta): void;
