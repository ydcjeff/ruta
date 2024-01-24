import 'urlpattern-polyfill';

import { BROWSER, DEV } from 'esm-env';
import {
	PAGES_SYMBOL,
	RESOLVED_SYMBOL,
	PATTERN_SYMBOL,
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

	/** @type {Record<string, InternalRoute>} */
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
		this.#routes = /** @type {any} */ (options.routes);

		this.#hook_args = {
			to: this.#to,
			from: this.#from,
			context: this.#context,
			controller: this.#controller,
		};

		if (BROWSER) {
			// @ts-expect-error experimental API
			navigation.addEventListener('navigate', (e) => {
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
		}
	}

	/** @type {TRuta['go']} */
	async go(to = /** @type {any} */ (BROWSER ? location.href : '/')) {
		const href = this.to_href(to);
		if (BROWSER) {
			// @ts-expect-error experimental API
			await navigation.navigate(href).finished;
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
	 */
	async #match_route(href) {
		href = href.replace(this.#base, '').replace(MULTI_SLASH_RE, '/');

		// exit if navigating to the same URL
		if (this.#from.href === href) {
			return;
		}

		const routes = this.#routes;
		for (const path in routes) {
			const route = routes[path];

			if (route) {
				const pattern =
					route[PATTERN_SYMBOL] ||
					(route[PATTERN_SYMBOL] = new URLPattern({
						pathname: join_paths(path),
					}));

				const url = new URL(href, FAKE_ORIGIN);
				const match = pattern.exec(url.href);

				if (match) {
					const {
						pathname: { groups },
					} = match;

					this.#to.href = href;
					this.#to.path = path;
					this.#to.params = route.parse_params?.(groups) || groups;
					this.#to.search =
						route.parse_search?.(url.searchParams) || IMMUTABLE_EMPTY_OBJ;
					this.#to.pages = IMMUTABLE_EMPTY_ARRAY;

					// call before navigate hooks if available
					if (this.#before_hooks.length) {
						await Promise.all(
							this.#before_hooks.map((h) => h(this.#hook_args)),
						);
					}

					/** @type {Promise<{ default: RegisteredComponent }>[]} */
					let promises = [];
					if (!route[RESOLVED_SYMBOL]) {
						promises = route[PAGES_SYMBOL].map((v) => {
							if (typeof v === 'function') {
								return v();
							}
							return v;
						});
					}

					// fetch components and run load fn parallel
					const [pages] = await Promise.all([
						Promise.all(promises),
						route.load?.(this.#hook_args),
					]);

					if (!route[RESOLVED_SYMBOL]) {
						route[PAGES_SYMBOL] = pages.map((v) => v.default);
						route[RESOLVED_SYMBOL] = true;
					}

					this.#to.pages = route[PAGES_SYMBOL];

					// call after navigate hooks if available
					if (this.#after_hooks.length) {
						await Promise.all(this.#after_hooks.map((h) => h(this.#hook_args)));
					}

					// store old route
					this.#from = this.#to;
					return;
				}
			}
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
	/** @type {Record<string, InternalRoute>} */
	const routes = {};
	return {
		add(parent_path, children) {
			for (const child of /** @type {InternalRoute[]} */ (
				/** @type {unknown} */ (children)
			)) {
				const parent = routes[parent_path];
				const child_path = join_paths(parent_path, child.path);

				if (parent_path === child_path && parent) {
					parent[PAGES_SYMBOL].unshift(child.page);
				} else {
					if (!child[PAGES_SYMBOL]) {
						child[PAGES_SYMBOL] = [child.page];
					}
					if (parent) {
						child[PAGES_SYMBOL].push(parent.page);
					}
					routes[child_path] = child;
				}
			}
			return /** @type {any} */ (this);
		},
		done: () => /** @type {any} */ (routes),
	};
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
 * @typedef {import('./types').InternalRoute} InternalRoute
 * @typedef {import('./types').NavigationHook} NavigationHook
 * @typedef {import('./types').NavigationHookArgs} NavigationHookArgs
 * @typedef {import('./types').RegisteredComponent} RegisteredComponent
 */
