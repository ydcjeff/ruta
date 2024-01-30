import 'urlpattern-polyfill';

import { BROWSER, DEV } from 'esm-env';
import {
	SYMBOL_PAGE,
	SYMBOL_RESOLVED,
	SYMBOL_PATTERN,
	SYMBOL_ERROR,
	SYMBOL_LOAD,
	SYMBOL_PARAMS_FN,
	SYMBOL_SEARCH_FN,
	SYMBOL_HAS_LAYOUT,
	IMMUTABLE_EMPTY_ARRAY,
	IMMUTABLE_EMPTY_OBJ,
	FAKE_ORIGIN,
} from './constants.js';

export { Ruta, define_route, create_routes };

class Ruta {
	/** router is ready for subsequent navigations. */
	#ok = false;
	#base;
	#context;

	/** @type {AbortController} */
	#controller = new AbortController();

	/** @type {Record<string, ResolvedRouteOptions>} */
	#routes = {};

	/** @type {Route} */
	#from = {
		href: '',
		pages: IMMUTABLE_EMPTY_ARRAY,
		params: IMMUTABLE_EMPTY_OBJ,
		path: '',
		search: IMMUTABLE_EMPTY_OBJ,
	};
	/** @type {Route} */
	#to = {
		href: '/',
		pages: IMMUTABLE_EMPTY_ARRAY,
		params: IMMUTABLE_EMPTY_OBJ,
		path: '/',
		search: IMMUTABLE_EMPTY_OBJ,
	};

	// hooks
	/** @type {NavigationHook[]} */
	#before_hooks = [];

	/** @type {NavigationHook[]} */
	#after_hooks = [];

	/** @type {NavigationHookArgs} */
	#hook_args;

	/** @param {RutaOptions} options */
	constructor(options) {
		this.#base = normalise_base(options.base || '');
		this.#context = options.context || {};
		this.#routes = options.routes;

		this.#hook_args = {
			to: this.#to,
			from: this.#from,
			context: this.#context,
			controller: this.#controller,
		};

		if (BROWSER) {
			window.navigation?.addEventListener('navigate', (e) => {
				const { canIntercept, downloadRequest, hashChange, destination } = e;

				if (!canIntercept || downloadRequest !== null || hashChange) {
					return;
				}

				e.intercept({
					handler: async () => {
						await this.#match_route(this.to_href(destination.url));
					},
				});
			});

			const events = /** @type {const} */ ([
				'pointerover',
				'touchstart',
				'pointerdown',
			]);
			/** @type {number} */
			let timeout;
			for (const event of events) {
				addEventListener(event, (e) => {
					const anchor = /** @type {HTMLElement} */ (e.target).closest('a');
					const ruta_preload =
						anchor?.dataset.rutaPreload ||
						document.documentElement.dataset.rutaPreload;
					if (
						!anchor ||
						anchor.hasAttribute('download') ||
						anchor.getAttribute('rel')?.includes('external') ||
						anchor.getAttribute('target')?.includes('_blank') ||
						((event === events[1] || event === events[2]) &&
							ruta_preload !== 'tap') ||
						(event === events[0] && ruta_preload !== 'hover')
					) {
						return;
					}

					cancelIdleCallback(timeout);
					timeout = requestIdleCallback(
						() => {
							this.#match_route(this.to_href(anchor.href), true);
						},
						{ timeout: 50 },
					);
				});
			}
		}
	}

	/** @type {TRuta['go']} */
	async go(to = /** @type {any} */ (BROWSER ? location.href : '/')) {
		const href = this.to_href(to);
		if (BROWSER && window.navigation) {
			await window.navigation.navigate(href).finished;
		} else {
			await this.#match_route(href);
		}

		if (!this.#ok) {
			this.#ok = true;
		}
	}

	/** @type {TRuta['to_href']} */
	to_href(to) {
		if (typeof to === 'string') {
			return join_paths(
				this.#base,
				to.replace(HTTP_RE, '').replace(this.#base, ''),
			);
		}

		let {
			path,
			params = /** @type {Record<string, any>} */ ({}),
			search = {},
		} = to;
		if (Object.keys(params).length) {
			for (const key in params) {
				/** @type {string} */ (path) = path.replace(`:${key}`, params[key]);
			}
		}
		const has_search = Object.keys(search).length;
		return join_paths(
			this.#base,
			`${path}${has_search ? `?${new URLSearchParams(search)}` : ''}`,
		);
	}

	/** @type {TRuta['context']} */
	get context() {
		return this.#context;
	}

	// navigation hooks

	/** @type {TRuta['before']} */
	before(hook) {
		return this.#add_hook(this.#before_hooks, hook);
	}

	/** @type {TRuta['after']} */
	after(hook) {
		return this.#add_hook(this.#after_hooks, hook);
	}

	/**
	 * Register a `hook` in `hooks`. Returns a function that removes the registerd
	 * `hook`.
	 *
	 * @param {NavigationHook[]} hooks
	 * @param {NavigationHook} hook
	 */
	#add_hook(hooks, hook) {
		if (this.#ok) {
			DEV &&
				warn(`Navigation hook should be registered before visiting a route.`);
			return () => {};
		}
		hooks.push(hook);
		return () => {
			hooks.splice(hooks.indexOf(hook), 1);
		};
	}

	/**
	 * Do route matching. This also calls the respective navigation hooks.
	 *
	 * The parameter `href` should be absolute href string.
	 * `this.to_href` method can be used to get that.
	 *
	 * @param {string} href `/base/pathname?search#hash`
	 * @param {boolean} [preload]
	 */
	async #match_route(href, preload = false) {
		const href_without_base = href
			.replace(this.#base, '')
			.replace(MULTI_SLASH_RE, '/');

		// exit if navigating to the same URL
		if (this.#from.href === href_without_base) {
			return;
		}

		const routes = this.#routes;
		for (const path in routes) {
			const route = routes[path];
			const is_dynamic_path = path.includes(':');

			if (route) {
				if (is_dynamic_path && !route[SYMBOL_PATTERN]) {
					route[SYMBOL_PATTERN] = new URLPattern({
						pathname: join_paths(path),
					});
				}

				const url = new URL(href_without_base, FAKE_ORIGIN);
				const match = is_dynamic_path
					? route[SYMBOL_PATTERN]?.exec(url.href)
					: path === url.pathname;

				if (match) {
					// can't use url.href since it contains origin
					this.#to.href = href_without_base;
					this.#to.path = path;

					if (match !== true) {
						const {
							pathname: { groups },
						} = match;
						this.#to.params = groups;
						for (const fn of route[SYMBOL_PARAMS_FN]) {
							Object.assign(groups, fn?.(groups));
						}
					}

					this.#to.search = {};
					for (const fn of route[SYMBOL_SEARCH_FN]) {
						Object.assign(this.#to.search, fn?.(url.searchParams));
					}

					this.#to.pages = IMMUTABLE_EMPTY_ARRAY;

					// call before navigate hooks if available
					if (this.#before_hooks.length) {
						await Promise.all(
							this.#before_hooks.map((h) => h(this.#hook_args)),
						);
					}

					/** @type {Promise<{ default: RegisteredComponent }>[]} */
					let promises = [];
					if (!route[SYMBOL_RESOLVED]) {
						promises = route[SYMBOL_PAGE].map((v) => {
							if (typeof v === 'function') {
								return v();
							}
							return v;
						});
					}

					// fetch components and run load fn parallel
					const [pages] = await Promise.all([
						Promise.all(promises),
						Promise.all(
							route[SYMBOL_LOAD].map((load) => load?.(this.#hook_args)),
						),
					]);

					if (!route[SYMBOL_RESOLVED]) {
						route[SYMBOL_PAGE] = pages.map((v) => v.default);
						route[SYMBOL_RESOLVED] = true;
					}

					this.#to.pages = route[SYMBOL_PAGE];

					// only update `from` route if not preload since it is not navigation
					if (!preload) {
						// call after navigate hooks if available
						if (this.#after_hooks.length) {
							await Promise.all(
								this.#after_hooks.map((h) => h(this.#hook_args)),
							);
						}
						// store old route
						this.#from = { ...this.#to };
					}
					return;
				}
			}
		}
		DEV && warn(`Unmatched ${href_without_base}`);
	}
}

/** @type {import('./types').define_route} */
function define_route(route) {
	return route;
}

/** @type {import('./types').create_routes} */
function create_routes() {
	/** @type {Record<string, ResolvedRouteOptions>} */
	const routes = {};
	return {
		add(parent_path, children) {
			const parent = routes[parent_path];
			for (const child of /** @type {ResolvedRouteOptions[]} */ (
				/** @type {unknown} */ (children)
			)) {
				const resolved_child_path =
					child.path === '' ? parent_path : join_paths(parent_path, child.path);

				const parent_pages = parent?.[SYMBOL_PAGE] || [];
				const parent_errors = parent?.[SYMBOL_ERROR] || [];
				const parent_loads = parent?.[SYMBOL_LOAD] || [];
				const parent_params_fn = parent?.[SYMBOL_PARAMS_FN] || [];
				const parent_search_fn = parent?.[SYMBOL_SEARCH_FN] || [];
				const parent_has_layout = parent?.[SYMBOL_HAS_LAYOUT];

				if (resolved_child_path === parent_path) {
					parent_pages.push(child.page);
					parent_errors.push(child.error);
					parent_loads.push(child.load);
					parent_params_fn.push(child.parse_params);
					parent_search_fn.push(child.parse_search);
					parent && (parent[SYMBOL_HAS_LAYOUT] = true);
				} else {
					child[SYMBOL_PAGE] = get_private_route_field(
						parent_pages,
						child.page,
						parent_has_layout,
					);
					child[SYMBOL_ERROR] = get_private_route_field(
						parent_errors,
						child.error,
						parent_has_layout,
					);
					child[SYMBOL_LOAD] = get_private_route_field(
						parent_loads,
						child.load,
						parent_has_layout,
					);
					child[SYMBOL_PARAMS_FN] = get_private_route_field(
						parent_params_fn,
						child.parse_params,
						parent_has_layout,
					);
					child[SYMBOL_SEARCH_FN] = get_private_route_field(
						parent_search_fn,
						child.parse_search,
						parent_has_layout,
					);

					routes[resolved_child_path] = child;
				}
			}
			return /** @type {any} */ (this);
		},
		done: () => routes,
	};
}

/**
 * @param {any[]} parent
 * @param {any} target
 * @param {boolean} has_layout
 */
function get_private_route_field(parent, target, has_layout = false) {
	const ret = parent.slice(0, has_layout ? -1 : undefined);
	ret.push(target);
	return ret;
}

const HTTP_RE = /https?:\/\/[^\/]*/;
const MULTI_SLASH_RE = /\/{2,}/g;
/**
 * Joins the given `paths`, and replaces many `/` with single `/`. The returned
 * string is always prefixed with `/`.
 *
 * @param {...string} paths
 */
function join_paths(...paths) {
	return ('/' + paths.join('/')).replace(MULTI_SLASH_RE, '/');
}

/**
 * Use the provided `base` or get from the `href` attribute of `<base>` tag.
 *
 * @param {string} base
 */
function normalise_base(base) {
	if (BROWSER && base !== '' && !base) {
		const href = document.querySelector('base')?.getAttribute('href');
		base = href ? new URL(href).pathname : base;
	}
	return base;
}

/** @param {string} msg */
function warn(msg) {
	console.warn(`[ruta warn]: ${msg}`);
}

/**
 * @typedef {import('./types').Ruta} TRuta
 * @typedef {import('./types').Route} Route
 * @typedef {import('./types').RutaOptions} RutaOptions
 * @typedef {import('./types').ResolvedRouteOptions} ResolvedRouteOptions
 * @typedef {import('./types').NavigationHook} NavigationHook
 * @typedef {import('./types').NavigationHookArgs} NavigationHookArgs
 * @typedef {import('./types').RegisteredComponent} RegisteredComponent
 */
