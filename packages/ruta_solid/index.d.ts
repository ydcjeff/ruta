import type { Component, Context, JSX } from 'solid-js';
import type { Ruta, Register } from 'ruta-core';

declare module 'ruta-core' {
	interface Register {
		component: Component;
	}
}

type RegisteredRouter = Register extends { router: infer R } ? R : RutaSolid;

export * from 'ruta-core';

export const RouterContext: Context<RutaSolid>;

export class RutaSolid extends Ruta {}

export function use_router(): Omit<RegisteredRouter, 'add'>;

export function use_route<
	T extends keyof RegisteredRouter['ROUTES'] = keyof RegisteredRouter['ROUTES'],
>(route?: T): RegisteredRouter['ROUTES'][T];

export function RouteMatches(): JSX.Element;
