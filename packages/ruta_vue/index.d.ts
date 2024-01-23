import type { App, Component } from 'vue';
import type {
	Ruta,
	RegisteredRouter,
	AnyObj,
	Route,
	RegisteredRoutes,
} from 'ruta-core';

export * from 'ruta-core';

export { default as RouteMatches } from './route_matches.vue';

export function use_router(): RegisteredRouter;

export function use_route<
	T extends keyof RegisteredRoutes = keyof RegisteredRoutes,
>(route?: T): RegisteredRoutes[T];

export class RutaVue<
	TRoutes extends Record<string, Route> = Record<string, Route>,
	TContext extends AnyObj = AnyObj,
	TPaths extends string = keyof TRoutes & string,
> extends Ruta<TRoutes, TContext, TPaths> {
	install(app: App): void;
}

declare module 'ruta-core' {
	interface Register {
		component: Component;
	}
}
