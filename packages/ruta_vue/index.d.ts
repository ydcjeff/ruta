import type { App, Component, DefineComponent } from 'vue';
import type {
	Ruta,
	RegisteredRouter,
	AnyObj,
	RegisteredRoutes,
	ResolvedRouteOptions,
} from 'ruta-core';

export * from 'ruta-core';

export { default as RouteMatches } from './route_matches.vue';

export function use_router(): RegisteredRouter;

export function use_route<
	T extends keyof RegisteredRoutes = keyof RegisteredRoutes,
>(route?: T): RegisteredRoutes[T];

export class RutaVue<
	TRoutes extends Record<string, ResolvedRouteOptions> = Record<
		string,
		ResolvedRouteOptions
	>,
	TContext extends AnyObj = AnyObj,
	TPaths extends string = keyof TRoutes & string,
> extends Ruta<TRoutes, TContext, TPaths> {
	install(app: App): void;
}

declare module 'ruta-core' {
	interface Register {
		component: Component | DefineComponent;
	}
}
