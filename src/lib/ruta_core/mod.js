// @ts-check
import { BROWSER, DEV } from 'esm-env';

export { Ruta, define_routes };

const PATTERN_SYMBOL = Symbol(DEV ? 'pattern' : '');
const PAGES_SYMBOL = Symbol(DEV ? 'pages' : '');
const RESOLVED_SYMBOL = Symbol(DEV ? 'resolved' : '');

class Ruta {
	/** router is ready for subsequent navigations. */
	#ok = false;

	#from;
	#to;

	#options;

	// hooks
	/** @type {NavigationHook[]} */
	#before_navigate_hooks = [];

	/** @type {NavigationHook[]} */
	#after_navigate_hooks = [];

	constructor(options = {}) {
		options.base = normalise_base(options.base || '');
		this.#options = options;

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

	/**
	 * Navigate to a route. This is the starting point of a full navigation.
	 */
	async go(to = BROWSER ? location.href : '/') {
		if (BROWSER) {
			to = this.to_href(to);
			await navigation.navigate(to);
		} else {
			await this.#match_route(to);
		}

		if (!this.#ok) {
			this.#ok = true;
		}
	}

	/**
	 * Build a link string. Useful for building links.
	 */
	to_href(to) {
		if (typeof to === 'string') {
			if (BROWSER && to.startsWith(location.origin)) {
				to = to.replace(location.origin, '');
			}
			if (DEV && to.startsWith('http')) {
				error('"to" should not start with http.');
			}
			return join_paths('/', to);
		}

		const { path, params, search } = to;
		const sp = new URLSearchParams(search);
		// TODO: replace path params with params value
		return join_paths('/', this.#options.base, path + '?' + sp);
	}

	/**
	 * Get router context. Useful for injecting dependencies.
	 */
	get context() {
		return this.#options.context;
	}

	// navigation hooks

	/** @param {NavigationHook} hook */
	on_before_navigate(hook) {
		return this.#add_hook(this.#before_navigate_hooks, hook);
	}

	/** @param {NavigationHook} hook */
	on_after_navigate(hook) {
		return this.#add_hook(this.#after_navigate_hooks, hook);
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
			const i = hooks.indexOf(hook);
			hooks.splice(i, 1);
		};
	}

	/**
	 * Do route matching. This also calls the respective navigation hooks.
	 *
	 * @param {string | URL} url
	 */
	async #match_route(url) {
		url = new URL(url);
		const routes = this.#options.routes;

		for (const path in routes) {
			const route = routes[path];

			const pattern =
				route[PATTERN_SYMBOL] ||
				(route[PATTERN_SYMBOL] = new URLPattern({
					// base can or cannot contain prefix `/`, so add manually.
					pathname: join_paths('/', this.#options.base, path),
				}));

			const match = pattern.exec(url);

			// we now have a route match
			if (match) {
				const {
					pathname: { groups },
				} = match;

				this.#from = this.#to;
				this.#to = {
					path,
					params: route.parse_params?.(groups) ?? {},
					search: route.parse_search?.(url.searchParams) ?? {},
					pages: [],
				};

				// call before navigate hooks if available
				if (this.#before_navigate_hooks.length) {
					await Promise.all(
						this.#before_navigate_hooks.map((h) => h(this.#to, this.#from)),
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
				if (this.#after_navigate_hooks.length) {
					await Promise.all(
						this.#after_navigate_hooks.map((h) => h(this.#to, this.#from)),
					);
				}

				break;
			}
		}
	}
}

function define_routes(parent, children) {
	const { path: parent_path, page, error, parse_params, parse_search } = parent;

	const new_routes = {
		[parent_path]: {
			page,
			error,
			parse_params,
			parse_search,
			[PAGES_SYMBOL]: [page],
		},
	};

	for (const child_path in children) {
		const full_path = join_paths(parent_path, child_path);
		// store child route reference in new routes
		const child = (new_routes[full_path] = children[child_path]);

		// add internal pages to render the DOM tree
		(child[PAGES_SYMBOL] || (child[PAGES_SYMBOL] = [child.page])).push(
			parent.page,
		);
	}

	return new_routes;
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

/** @param {string} msg */
function error(msg) {
	throw new Error(`[ruta error]: ${msg}`);
}

/**
 * @typedef {import('./types').NavigationHook} NavigationHook
 */
