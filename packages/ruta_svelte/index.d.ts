import type { SvelteComponent } from 'svelte';
import type { Ruta, RegisteredRouter, Route, AnyObj } from 'ruta-core';
import type { Readable } from 'svelte/store';

export * from 'ruta-core';

export function get_router(): RegisteredRouter;

export function get_route<
	T extends keyof RegisteredRouter['ROUTES'] = keyof RegisteredRouter['ROUTES'],
>(route?: T): Readable<RegisteredRouter['ROUTES'][T]>;

export class RutaSvelte<
	TRoutes extends Record<string, Route> = Record<string, Route>,
	TContext extends AnyObj = AnyObj,
	TPaths extends string = keyof TRoutes & string,
> extends Ruta<TRoutes, TContext, TPaths> {
	install(): void;
}

export class RouteMatches extends SvelteComponent {}

declare module 'ruta-core' {
	interface Register {
		component: typeof SvelteComponent<any>;
	}
}
