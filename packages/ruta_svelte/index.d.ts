import type { SvelteComponent } from 'svelte';
import type {
	Ruta,
	RegisteredRouter,
	AnyObj,
	RegisteredRoutes,
	InternalRoute,
} from 'ruta-core';
import type { Readable } from 'svelte/store';

export * from 'ruta-core';

export function get_router(): RegisteredRouter;

export function get_route<
	T extends keyof RegisteredRoutes = keyof RegisteredRoutes,
>(route?: T): Readable<RegisteredRoutes[T]>;

export class RutaSvelte<
	TRoutes extends Record<string, InternalRoute> = Record<string, InternalRoute>,
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
