import { Ruta } from 'ruta-core';
import { createContext, useContext, Show, createMemo } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Dynamic } from 'solid-js/web';

export * from 'ruta-core';
export {
	RutaSolid,
	use_router,
	use_route,
	router_provider as RouterProvider,
	RouteMatches,
};

const DEPTH_CONTEXT = createContext(1);
const ROUTER_CONTEXT = createContext();

class RutaSolid extends Ruta {
	constructor(options) {
		super(options);

		const [route, set_route] = createStore({
			path: '/',
			params: {},
			search: {},
			pages: [],
		});

		this.route = route;
		this.on_after_navigate((to) => {
			set_route(to);
		});
	}
}

function router_provider(props) {
	return (
		<ROUTER_CONTEXT.Provider value={props.ruta}>
			{props.children}
		</ROUTER_CONTEXT.Provider>
	);
}

function use_router() {
	return useContext(ROUTER_CONTEXT);
}

function use_route() {
	return useContext(ROUTER_CONTEXT).route;
}

function RouteMatches() {
	const route = use_route();
	const depth = useContext(DEPTH_CONTEXT);

	const component = createMemo(() => route.pages[route.pages.length - depth]);
	const has_children = createMemo(() => route.pages.length > depth);

	return (
		<DEPTH_CONTEXT.Provider value={depth + 1}>
			<Show when={component()}>
				{(c) => (
					<Dynamic component={c()}>
						<Show when={has_children()}>
							<RouteMatches />
						</Show>
					</Dynamic>
				)}
			</Show>
		</DEPTH_CONTEXT.Provider>
	);
}
