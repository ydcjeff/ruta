import { Component, Context } from 'solid-js';
import { Ruta } from 'ruta-core';

declare module 'ruta-core' {
	interface Register {
		component: Component;
	}
}

export * from 'ruta-core';

export const RouterContext: Context<RutaSolid | undefined>;

export class RutaSolid extends Ruta {}

export function use_router(): Omit<RutaSolid, 'add'>;

export function use_route(): any;

export function RouteMatches(): JSX.Element;
