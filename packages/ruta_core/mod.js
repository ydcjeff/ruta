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
	#from;
	#to;

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
			// @ts-expect-error private property
			if (!child[PAGES_SYMBOL]) {
				// @ts-expect-error private property
				child[PAGES_SYMBOL] = [child.page];
			}
			if (parent) {
				// @ts-expect-error private property
				child[PAGES_SYMBOL].push(parent.page);
			}
			this.#routes[join_paths(parent_path, child.path)] = child;
		}
		return /** @type {any} */ (this);
	}

	/** @type {import('./index').Ruta['go']} */
	async go(to) {
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
			// base can or cannot contain prefix `/`, so add manually.
			return join_paths('/', this.#base, to);
		}

		let { path, params, search } = to;
		if (Object.keys(params).length) {
			for (const key in params) {
				path = path.replace(`:${key}`, params[key]);
			}
		}
		const has_search = Object.keys(search).length;
		return join_paths(
			// base can or cannot contain prefix `/`, so add manually.
			'/',
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
		url = new URL(url);

		// exit if navigating to the same URL
		if (this.#from?.url?.href === url.href) {
			return;
		}

		const routes = this.#routes;
		for (const path in routes) {
			const route = routes[path];

			const pattern =
				route[PATTERN_SYMBOL] ||
				// @ts-expect-error experimental API
				(route[PATTERN_SYMBOL] = new URLPattern({
					// base can or cannot contain prefix `/`, so add manually.
					pathname: join_paths('/', this.#base, path),
				}));

			const match = pattern.exec(url);

			// we now have a route match
			if (match) {
				const {
					pathname: { groups },
				} = match;

				this.#to = {
					url,
					path,
					params: route.parse_params?.(groups) ?? {},
					search: route.parse_search?.(url.searchParams) ?? {},
					pages: [],
				};

				// call before navigate hooks if available
				if (this.#before_hooks.length) {
					await Promise.all(
						this.#before_hooks.map((h) => h(this.#to, this.#from)),
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
						this.#after_hooks.map((h) => h(this.#to, this.#from)),
					);
				}

				// store old route
				this.#from = this.#to;
				break;
			}
		}
	}
}

/** @type {import('./index').DefineRoute} */
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
