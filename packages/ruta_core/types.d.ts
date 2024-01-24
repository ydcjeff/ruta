import { URLPattern } from 'urlpattern-polyfill';
import {
	SYMBOL_ERROR,
	SYMBOL_HAS_LAYOUT,
	SYMBOL_LOAD,
	SYMBOL_PAGE,
	SYMBOL_PARAMS_FN,
	SYMBOL_PATTERN,
	SYMBOL_RESOLVED,
	SYMBOL_SEARCH_FN,
} from './constants.js';

type Prettify<T> = { [K in keyof T]: T[K] } & {};
type AnyObj = Record<string, any>;
type MaybePromise<T> = Promise<T> | T;

type CleanPath<T extends string> = T extends `${infer L}//${infer R}`
	? CleanPath<`${CleanPath<L>}/${CleanPath<R>}`>
	: T extends `${infer L}//`
		? `${CleanPath<L>}/`
		: T extends `//${infer L}`
			? `/${CleanPath<L>}`
			: T;

type JoinPaths<
	Head extends string,
	Tail extends string,
> = CleanPath<`${Head}/${Tail}`>;

type StaticPaths<T> = T extends `${infer S}:${infer U}` ? never : T;

type Split<T extends string> = T extends `${infer S}/`
	? [...Split<S>]
	: T extends `/${infer S}`
		? [...Split<S>]
		: T extends `${infer L}/${infer R}`
			? [...Split<L>, ...Split<R>]
			: [T];

type ParseParams<T extends string> = {
	[K in Split<T>[number] as K extends `:${infer Param}`
		? Param
		: never]: string;
};

type ToOptions<
	TPath extends string = string,
	_AllParams = RegisteredRouter['ROUTES'][TPath]['params'],
	_AllSearch = RegisteredRouter['ROUTES'][TPath]['search'],
> = {
	path: TPath;
} & (keyof _AllParams extends never
	? { params?: never }
	: { params: _AllParams }) &
	(keyof _AllSearch extends never
		? { search?: never }
		: { search: _AllSearch });

type Route<
	TAllPath extends string = string,
	TAllParams extends AnyObj = {},
	TAllSearch extends AnyObj = {},
> = {
	/** Resolved href string in the shape of `/base/pathname?search#hash`. */
	href: string;
	/** Resolved full path. */
	path: TAllPath;
	/** Resolved all parameters. */
	params: TAllParams;
	/** Resolved all search. */
	search: TAllSearch;
	/** Resolved matched pages. */
	pages: RegisteredComponent[];
};

type InternalRoute<
	TAllPath extends string = string,
	TAllParams extends AnyObj = {},
	TAllSearch extends AnyObj = {},
> = Route<TAllPath, TAllParams, TAllSearch> &
	RouteOptions & {
		[SYMBOL_PAGE]: RouteOptions['page'][];
		[SYMBOL_ERROR]: Required<RouteOptions['error'][]>;
		[SYMBOL_LOAD]: Required<RouteOptions['load'][]>;
		[SYMBOL_PARAMS_FN]: Required<RouteOptions['parse_params'][]>;
		[SYMBOL_SEARCH_FN]: Required<RouteOptions['parse_search'][]>;
		[SYMBOL_PATTERN]: URLPattern;
		[SYMBOL_RESOLVED]: boolean;
		[SYMBOL_HAS_LAYOUT]: boolean;
	};

type RouteOptions<
	TPath extends string = string,
	TParams extends AnyObj = {},
	TSearch extends AnyObj = {},
	_ParsedParams = ParseParams<TPath>,
> = {
	path: TPath;
	page: RegisteredComponent | (() => Promise<{ default: RegisteredComponent }>);
	error?:
		| RegisteredComponent
		| (() => Promise<{ default: RegisteredComponent }>);
	load?: NavigationHook;
	parse_params?: (
		params: _ParsedParams,
	) => TParams extends Record<keyof _ParsedParams, any>
		? TParams
		: 'parse_params must return an object';
	parse_search?: (search: URLSearchParams) => TSearch;
};

type NavigationHookArgs = {
	to: RegisteredRoutes[keyof RegisteredRoutes] extends never
		? Route
		: RegisteredRoutes[keyof RegisteredRoutes];
	from: RegisteredRoutes[keyof RegisteredRoutes] extends never
		? Route
		: RegisteredRoutes[keyof RegisteredRoutes];
	context: RegisteredRouter['context'];
	controller: AbortController;
};

type NavigationHook = (args: NavigationHookArgs) => MaybePromise<void>;

interface RutaOptions<
	TRoutes extends Record<string, InternalRoute> = Record<string, InternalRoute>,
	TContext extends AnyObj = AnyObj,
> {
	routes: TRoutes;
	base?: string;
	context?: TContext;
}

interface Register {
	// router
	// component
}

type RegisteredComponent = Register extends { component: infer C }
	? C
	: unknown;

type RegisteredRouter = Register extends { router: infer R } ? R : Ruta;

type RegisteredRoutes = RegisteredRouter['ROUTES'];

type MyReturnType<T extends (...args: any) => any> = T extends (
	...args: any
) => infer R
	? R
	: {};

declare class Ruta<
	TRoutes extends Record<string, InternalRoute> = Record<string, InternalRoute>,
	TContext extends AnyObj = AnyObj,
	TPaths extends string = keyof TRoutes & string,
> {
	/**
	 * Type only, no runtime equivalent.
	 */
	ROUTES: { [K in keyof TRoutes]: Prettify<Pick<TRoutes[K], keyof Route>> };

	constructor(options: RutaOptions<TRoutes, TContext>);

	/**
	 * Get router context. Useful for injecting dependencies.
	 */
	get context(): TContext;

	/**
	 * Navigate to a route. This is the starting point of a full navigation.
	 */
	go<TPath extends TPaths>(
		to?: StaticPaths<TPath> | ToOptions<TPath>,
	): Promise<void>;

	/**
	 * Build a link string. Useful for building links.
	 */
	to_href<TPath extends TPaths>(
		to: StaticPaths<TPath> | ToOptions<TPath>,
	): string;

	/**
	 * Register a router before hook.
	 */
	before(hook: NavigationHook): () => void;

	/**
	 * Register a router after hook.
	 */
	after(hook: NavigationHook): () => void;
}

declare function define_route<
	const TPath extends string = string,
	TParams extends AnyObj = {},
	TSearch extends AnyObj = {},
>(
	route: RouteOptions<TPath, TParams, TSearch>,
): RouteOptions<TPath, TParams, TSearch>;

declare function create_routes(): RouteTree;

type RouteTree<
	TPaths extends string = '',
	TRoutes extends Record<string, InternalRoute> = {},
> = {
	// add<const TChildren extends RouteOptions[]>(
	// 	parent: true,
	// 	children: TChildren,
	// ): RouteTree<
	// 	TChildren[number]['path'],
	// 	{
	// 		[C in TChildren[number] as C['path']]: Route<
	// 			C,
	// 			C['path'],
	// 			MyReturnType<NonNullable<C['parse_params']>>,
	// 			MyReturnType<NonNullable<C['parse_search']>>
	// 		>;
	// 	}
	// >;
	add<
		const TParentPath extends TPaths,
		const TChildren extends RouteOptions[],
		_ParentRoute extends InternalRoute = TRoutes[TParentPath],
	>(
		parent: TParentPath,
		children: TChildren,
	): RouteTree<
		TPaths | JoinPaths<TParentPath, TChildren[number]['path']>,
		TRoutes & {
			[C in TChildren[number] as C['path'] extends ''
				? TParentPath
				: JoinPaths<TParentPath, C['path']>]: InternalRoute<
				C['path'] extends '' ? TParentPath : JoinPaths<TParentPath, C['path']>,
				_ParentRoute['params'] & MyReturnType<NonNullable<C['parse_params']>>,
				_ParentRoute['search'] & MyReturnType<NonNullable<C['parse_search']>>
			>;
		}
	>;
	done(): TRoutes;
};
