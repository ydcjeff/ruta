import type { Component, Context, JSX } from 'solid-js';
import type { Ruta, RegisteredRouter, AnyObj, Route } from 'ruta-core';

export * from 'ruta-core';

export const RouterContext: Context<RutaSolid>;

export class RutaSolid<
	TRoutes extends Record<string, Route> = Record<string, Route>,
	TContext extends AnyObj = AnyObj,
	TPaths extends string = keyof TRoutes & string,
> extends Ruta<TRoutes, TContext, TPaths> {}

export function use_router(): RegisteredRouter;

export function use_route<
	T extends keyof RegisteredRouter['ROUTES'] = keyof RegisteredRouter['ROUTES'],
>(route?: T): RegisteredRouter['ROUTES'][T];

export function RouteMatches(): JSX.Element;

declare module 'ruta-core' {
	interface Register {
		component: Component;
	}
}
