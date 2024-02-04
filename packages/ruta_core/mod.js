import 'urlpattern-polyfill';

import { BROWSER, DEV } from 'esm-env';
import {
	KEY_PAGES,
	KEY_PAGES_RESOLVED,
	KEY_URL_PATTERN,
	KEY_ERRORS,
	KEY_LOAD_FNS,
	KEY_PARAMS_FNS,
	KEY_SEARCH_FNS,
	KEY_HAS_LAYOUT,
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
		error: null,
	};
	/** @type {Route} */
	#to = {
		href: '/',
		pages: IMMUTABLE_EMPTY_ARRAY,
		params: IMMUTABLE_EMPTY_OBJ,
		path: '/',
		search: IMMUTABLE_EMPTY_OBJ,
		error: null,
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
				const param_value = params[key];
				/** @type {string} */ (path) = path
					// try replacing with modifiers first
					.replace(`:${key}*`, param_value)
					.replace(`:${key}+`, param_value)
					.replace(`:${key}?`, param_value)
					.replace(`:${key}`, param_value);
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
		if (this.#from.href === href) {
			return;
		}

		/** @type {unknown} */
		let captured_error = null,
			captured_index = -1;
		const routes = this.#routes;
		for (const full_pathname in routes) {
			const route = routes[full_pathname];
			const is_dynamic_path = full_pathname.includes(':');

			if (!route) continue;

			if (is_dynamic_path && !route[KEY_URL_PATTERN]) {
				route[KEY_URL_PATTERN] = new URLPattern({
					pathname: join_paths(full_pathname),
				});
			}

			let {
				[KEY_PAGES]: pages,
				[KEY_ERRORS]: errors,
				[KEY_LOAD_FNS]: load_fns,
				[KEY_PARAMS_FNS]: params_fns,
				[KEY_SEARCH_FNS]: search_fns,
				[KEY_URL_PATTERN]: url_pattern,
				[KEY_PAGES_RESOLVED]: are_pages_resolved,
			} = route;

			const url = new URL(href_without_base, FAKE_ORIGIN);
			const match = is_dynamic_path
				? url_pattern?.exec(url.href)
				: full_pathname === url.pathname;

			if (!match) continue;

			// can't use url.href since it contains origin
			this.#to.href = href;
			this.#to.path = full_pathname;

			if (match !== true) {
				try {
					// prettier-ignore
					const { pathname: { groups } } = match;
					this.#to.params = groups;
					for (const [i, fn] of params_fns.entries()) {
						captured_index = i;
						Object.assign(groups, fn?.(groups));
					}
				} catch (error) {
					captured_error = error;
				}
			} else {
				// reset params
				this.#to.params = IMMUTABLE_EMPTY_OBJ;
			}

			try {
				this.#to.search = {};
				for (const [i, fn] of search_fns.entries()) {
					if (!captured_error) {
						captured_index = i;
					}
					Object.assign(this.#to.search, fn?.(url.searchParams));
				}
			} catch (error) {
				captured_error = error;
			}

			this.#to.pages = IMMUTABLE_EMPTY_ARRAY;

			// call before navigate hooks if available
			if (this.#before_hooks.length) {
				const results = await Promise.allSettled(
					this.#before_hooks.map((hook) =>
						// wrap in async IIFE to catch all sync/async errors
						(async () => hook(this.#hook_args))(),
					),
				);
				if (!captured_error) {
					for (const [i, result] of results.entries()) {
						if (result.status === 'rejected') {
							captured_index = i;
							captured_error = result.reason;
							break;
						}
					}
				}
			}

			// fetch components and run load functions parallel
			const [resolved_pages, load_results] = await Promise.all([
				are_pages_resolved
					? IMMUTABLE_EMPTY_ARRAY
					: // Promise.all is used to throw error automatically
						// if the page components cannot be fetched.
						Promise.all(pages.map((v) => (typeof v === 'function' ? v() : v))),
				// Promise.allSettled is used to capture the error
				Promise.allSettled(
					// wrap in async IIFE to catch all sync/async errors
					load_fns.map((load) => (async () => load?.(this.#hook_args))()),
				),
			]);

			if (!captured_error) {
				for (const [i, result] of load_results.entries()) {
					if (result.status === 'rejected') {
						captured_index = i;
						captured_error = result.reason;
						break;
					}
				}
			}

			if (!are_pages_resolved) {
				route[KEY_PAGES] = pages = resolved_pages.map((v) => v.default || v);
				route[KEY_PAGES_RESOLVED] = true;
			}

			if (captured_error) {
				this.#to.error = captured_error;
				this.#to.pages = pages.slice(0, captured_index);
				this.#to.pages.push(errors[1] || errors[0]);
				if (DEV && !errors[1] && !errors[0]) {
					error(
						`"${captured_error}" occurred.\n` +
							'But, there is no error component. ' +
							`Consider providing error component in this ${full_pathname} route or its parent routes.`,
					);
				}
			} else {
				this.#to.pages = pages;
			}

			// only update `from` route if not preload since it is not navigation
			if (!preload) {
				// call after navigate hooks if available
				if (this.#after_hooks.length) {
					await Promise.all(
						this.#after_hooks.map((hook) => hook(this.#hook_args)),
					);
				}
				// store old route
				this.#from = { ...this.#to };
			}
			return;
		}
		DEV && warn(`Unmatched ${href}`);
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

				const parent_pages = parent?.[KEY_PAGES] || [];
				const parent_errors = parent?.[KEY_ERRORS] || [];
				const parent_loads = parent?.[KEY_LOAD_FNS] || [];
				const parent_params_fn = parent?.[KEY_PARAMS_FNS] || [];
				const parent_search_fn = parent?.[KEY_SEARCH_FNS] || [];
				const parent_has_layout = parent?.[KEY_HAS_LAYOUT];

				if (resolved_child_path === parent_path) {
					parent_pages.push(child.page);
					child.error && (parent_errors[1] = child.error);
					parent_loads.push(child.load);
					parent_params_fn.push(child.parse_params);
					parent_search_fn.push(child.parse_search);
					parent && (parent[KEY_HAS_LAYOUT] = true);
				} else {
					child[KEY_PAGES] = get_private_route_field(
						parent_pages,
						child.page,
						parent_has_layout,
					);
					child[KEY_ERRORS] = [child.error || parent_errors[0]];
					child[KEY_LOAD_FNS] = get_private_route_field(
						parent_loads,
						child.load,
						parent_has_layout,
					);
					child[KEY_PARAMS_FNS] = get_private_route_field(
						parent_params_fn,
						child.parse_params,
						parent_has_layout,
					);
					child[KEY_SEARCH_FNS] = get_private_route_field(
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

class RutaError extends Error {
	name = 'RutaError';
}
/** @param {string} msg */
function error(msg) {
	throw new RutaError(msg);
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
