import 'urlpattern-polyfill';

import { BROWSER, DEV } from 'esm-env';
import { PAGES_SYMBOL, RESOLVED_SYMBOL, PATTERN_SYMBOL } from './constants.js';

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
	#from = { href: '', pages: [], params: {}, path: '', search: {} };
	/** @type {Route} */
	#to = { href: '/', pages: [], params: {}, path: '/', search: {} };

	// hooks
	/** @type {NavigationHook[]} */
	#before_hooks = [];

	/** @type {NavigationHook[]} */
	#after_hooks = [];

	/** @param {RutaOptions} options */
	constructor(options) {
		this.#base = normalise_base(options.base || '');
		this.#context = options.context || {};
		this.#routes = /** @type {any} */ (options.routes);

		if (BROWSER) {
			// @ts-expect-error experimental API
			navigation.addEventListener('navigate', (e) => {
				const { canIntercept, downloadRequest, hashChange, destination } = e;

				if (!canIntercept || downloadRequest !== null || hashChange) {
					return;
				}

				e.intercept({
					handler: async () => {
						await this.#match_route(destination.url);
					},
				});
			});
		}
	}

	/** @type {TRuta['go']} */
	async go(to = /** @type {any} */ (BROWSER ? location.href : '/')) {
		const url = this.to_href(to);
		if (BROWSER) {
			// @ts-expect-error experimental API
			await navigation.navigate(url);
		} else {
			await this.#match_route(url);
		}

		if (!this.#ok) {
			this.#ok = true;
		}
	}

	/** @type {TRuta['to_href']} */
	to_href(to) {
		if (typeof to === 'string') {
			return join_paths(
				'',
				this.#base,
				to.replace(location.origin, '').replace(this.#base, ''),
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
			'',
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
	 * @param {string} url
	 */
	async #match_route(url) {
		let { href, searchParams } = new URL(url);

		href = href.replace(origin, '').replace(this.#base, '');

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
						pathname: join_paths('', this.#base, path),
					}));

				const match = pattern.exec(url);

				// we now have a route match
				if (match) {
					const {
						pathname: { groups },
					} = match;

					this.#to.href = href;
					this.#to.path = path;
					this.#to.params = route.parse_params?.(groups) || {};
					this.#to.search = route.parse_search?.(searchParams) || {};
					this.#to.pages = [];

					// call before navigate hooks if available
					if (this.#before_hooks.length) {
						await Promise.all(
							this.#before_hooks.map((h) =>
								h({
									to: this.#to,
									from: this.#from,
									context: this.#context,
									controller: this.#controller,
								}),
							),
						);
					}

					if (!route[RESOLVED_SYMBOL]) {
						route[PAGES_SYMBOL] = (
							await Promise.all(
								route[PAGES_SYMBOL].map((v) => {
									if (typeof v === 'function') {
										return v();
									}
									return v;
								}),
							)
						).map((v) => v.default);
						route[RESOLVED_SYMBOL] = true;
					}
					this.#to.pages = route[PAGES_SYMBOL];

					// call after navigate hooks if available
					if (this.#after_hooks.length) {
						await Promise.all(
							this.#after_hooks.map((h) =>
								h({
									to: this.#to,
									from: this.#from,
									context: this.#context,
									controller: this.#controller,
								}),
							),
						);
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

/** @type {import('./index').define_route} */
function define_route(route) {
	return route;
}

/** @type {import('./index').create_routes} */
function create_routes() {
	/** @type {Record<string, InternalRoute>} */
	const routes = {};
	return {
		add(parent_path, children) {
			for (const child of /** @type {InternalRoute[]} */ (
				/** @type {unknown} */ (children)
			)) {
				const parent = routes[parent_path];
				const child_path = join_paths('', parent_path, child.path);

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

const MULTI_SLASH_RE = /\/{2,}/g;
/**
 * Joins the given `paths`, and replaces many `/` with single `/`.
 *
 * @param {...string} paths
 */
function join_paths(...paths) {
	return paths.join('/').replace(MULTI_SLASH_RE, '/');
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
 * @typedef {import('./index').Ruta} TRuta
 * @typedef {import('./index').Route} Route
 * @typedef {import('./index').RutaOptions} RutaOptions
 * @typedef {import('./index').InternalRoute} InternalRoute
 * @typedef {import('./index').NavigationHook} NavigationHook
 */
