import 'urlpattern-polyfill';

import { BROWSER, DEV } from 'esm-env';

export { Ruta, define_route };

const PATTERN_SYMBOL = Symbol(DEV ? 'pattern' : '');
const PAGES_SYMBOL = Symbol(DEV ? 'pages' : '');
const RESOLVED_SYMBOL = Symbol(DEV ? 'resolved' : '');

class Ruta {
	/** router is ready for subsequent navigations. */
	#ok = false;
	#base;
	#context;

	/** @type {Record<string, import('./index').RouteOptions>} */
	#routes = {};

	/** @type {import('./index').Route} */
	#from = { href: '', pages: [], params: {}, path: '', search: {} };
	/** @type {import('./index').Route} */
	#to = { href: '/', pages: [], params: {}, path: '/', search: {} };

	// hooks
	/** @type {NavigationHook[]} */
	#before_hooks = [];

	/** @type {NavigationHook[]} */
	#after_hooks = [];

	/**
	 * @param {import('./index').RutaOptions} options
	 */
	constructor(options = {}) {
		this.#base = normalise_base(options.base || '');
		this.#context = options.context || {};

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

	/** @type {import('./index').Ruta['add']} */
	add(parent_path, children) {
		for (const child of children) {
			const parent = this.#routes[parent_path];
			const child_path = join_paths('', parent_path, child.path);

			// layout route matched
			if (parent_path === child_path && parent) {
				// @ts-expect-error private property
				parent[PAGES_SYMBOL].unshift(child.page);
			} else {
				// @ts-expect-error private property
				if (!child[PAGES_SYMBOL]) {
					// @ts-expect-error private property
					child[PAGES_SYMBOL] = [child.page];
				}
				if (parent) {
					// @ts-expect-error private property
					child[PAGES_SYMBOL].push(parent.page);
				}
				this.#routes[join_paths('', parent_path, child.path)] = child;
			}
		}
		return /** @type {any} */ (this);
	}

	/** @type {import('./index').Ruta['go']} */
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

	/** @type {import('./index').Ruta['to_href']} */
	to_href(to) {
		if (typeof to === 'string') {
			/** @type {string} */ (to) = to
				.replace(location.origin, '')
				.replace(this.#base, '');
			return join_paths('', this.#base, /** @type {string} */ (to));
		}

		let { path, params = {}, search = {} } = to;
		if (Object.keys(params).length) {
			for (const key in params) {
				// @ts-expect-error it is assignable
				path = path.replace(`:${key}`, params[key]);
			}
		}
		const has_search = Object.keys(search).length;
		return join_paths(
			'',
			this.#base,
			`${path}${has_search ? `?${new URLSearchParams(search)}` : ''}`,
		);
	}

	/** @type {import('./index').Ruta['context']} */
	get context() {
		return this.#context;
	}

	// navigation hooks

	/** @type {import('./index').Ruta['before']} */
	before(hook) {
		return this.#add_hook(this.#before_hooks, hook);
	}

	/** @type {import('./index').Ruta['after']} */
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
	 * @param {string | URL} url
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

			const pattern =
				// @ts-expect-error private property
				route[PATTERN_SYMBOL] ||
				// @ts-expect-error private property
				(route[PATTERN_SYMBOL] = new URLPattern({
					pathname: join_paths('', this.#base, path),
				}));

			const match = pattern.exec(url);

			// we now have a route match
			if (match && route) {
				const {
					pathname: { groups },
				} = match;

				this.#to.href = href;
				this.#to.path = path;
				// @ts-expect-error conditional types
				this.#to.params = route.parse_params?.(groups) || {};
				this.#to.search = route.parse_search?.(searchParams) || {};
				this.#to.pages = [];

				// call before navigate hooks if available
				if (this.#before_hooks.length) {
					await Promise.all(
						this.#before_hooks.map((h) => h(this.#to, this.#from)),
					);
				}

				// @ts-expect-error private property
				if (!route[RESOLVED_SYMBOL]) {
					// @ts-expect-error private property
					route[PAGES_SYMBOL] = (
						await Promise.all(
							// @ts-expect-error private property
							route[PAGES_SYMBOL].map((v) => {
								if (typeof v === 'function') {
									return v();
								}
								return v;
							}),
						)
					)
						// @ts-expect-error idk why
						.map((v) => v.default);
					// @ts-expect-error private property
					route[RESOLVED_SYMBOL] = true;
				}
				// @ts-expect-error private property
				this.#to.pages = route[PAGES_SYMBOL];

				// call after navigate hooks if available
				if (this.#after_hooks.length) {
					await Promise.all(
						this.#after_hooks.map((h) => h(this.#to, this.#from)),
					);
				}

				// store old route
				this.#from = this.#to;
				return;
			}
		}
		DEV && warn(`Unmatched ${href}`);
	}
}

/** @type {import('./index').define_route} */
function define_route(route) {
	return route;
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
 * @typedef {import('./index').NavigationHook} NavigationHook
 */
