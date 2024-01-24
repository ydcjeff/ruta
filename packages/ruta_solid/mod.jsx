import { Ruta } from 'ruta-core';
import { createContext, useContext, Show, createMemo } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Dynamic } from 'solid-js/web';

export * from 'ruta-core';
export { RutaSolid, use_router, use_route, RouteMatches, RouterContext };

const DepthContext = createContext(1);

const RouterContext = createContext();

class RutaSolid extends Ruta {
	/** @param {import('./index').RutaOptions} options */
	constructor(options) {
		super(options);

		const [route, set_route] = createStore();

		this.route = route;
		this.after(({ to }) => set_route(to));
	}
}

/** @type {import('./index').use_router} */
function use_router() {
	return useContext(RouterContext);
}

/** @type {import('./index').use_route} */
function use_route() {
	return useContext(RouterContext).route;
}

function RouteMatches() {
	const route = use_route();
	const depth = useContext(DepthContext);

	const component = createMemo(() => route.pages[route.pages.length - depth]);
	const has_children = createMemo(() => route.pages.length > depth);

	return (
		<DepthContext.Provider value={depth + 1}>
			<Show when={component()}>
				{(c) => (
					<Dynamic component={c()}>
						<Show when={has_children()}>
							<RouteMatches />
						</Show>
					</Dynamic>
				)}
			</Show>
		</DepthContext.Provider>
	);
}
