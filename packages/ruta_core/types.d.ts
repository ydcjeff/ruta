import { URLPattern } from 'urlpattern-polyfill';
import {
	KEY_ERRORS,
	KEY_HAS_LAYOUT,
	KEY_LOAD_FNS,
	KEY_PAGES,
	KEY_PARAMS_FNS,
	KEY_URL_PATTERN,
	KEY_PAGES_RESOLVED,
	KEY_SEARCH_FNS,
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

type Split<
	T extends string,
	TSplitter extends string,
> = T extends `${infer S}${TSplitter}`
	? [...Split<S, TSplitter>]
	: T extends `${TSplitter}${infer S}`
		? [...Split<S, TSplitter>]
		: T extends `${infer L}${TSplitter}${infer R}`
			? [...Split<L, TSplitter>, ...Split<R, TSplitter>]
			: [T];

type ParamSeparators =
	| '~'
	| '!'
	| '@'
	| '#'
	| '$'
	| '%'
	| '^'
	| '&'
	| '('
	| ')'
	| '-'
	| '='
	| '['
	| ']'
	| '{'
	| '}'
	| ';'
	| '"'
	| "'"
	| '.'
	| ',';

type ParseParamKeys<T extends string> = keyof {
	[K in Split<
		Split<T, '/'>[number],
		ParamSeparators
	>[number] as K extends `:${infer Param}` ? Param : never]: string;
};

type ParseParams<
	T extends string,
	_ParsedParamKeys extends string = ParseParamKeys<T>,
	_OptionalParams extends string = Extract<
		_ParsedParamKeys,
		`${string}${'*' | '?'}`
	>,
	_RequiredParams extends string = Exclude<_ParsedParamKeys, _OptionalParams>,
> = Prettify<
	{
		[K in _RequiredParams as K extends `${infer Param}+` ? Param : K]: string;
	} & {
		[K in _OptionalParams as K extends `${infer Param}${'*' | '?'}`
			? Param
			: never]?: string;
	}
>;

type HasRequiredProperties<T extends AnyObj> = Required<{
	[K in keyof T]: undefined extends T[K] ? false : true;
}>[keyof T];

type ToOptions<
	TPath extends string = string,
	_AllParams extends AnyObj = RegisteredRoutes[TPath]['params'],
	_AllSearch extends AnyObj = RegisteredRoutes[TPath]['search'],
> = {
	path: TPath;
} & (keyof _AllParams extends never
	? { params?: never }
	: HasRequiredProperties<_AllParams> extends false
		? { params?: _AllParams }
		: { params: _AllParams }) &
	(keyof _AllSearch extends never
		? { search?: never }
		: HasRequiredProperties<_AllSearch> extends false
			? { search?: _AllSearch }
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
	/** Error occurred during route navigation. */
	error: unknown;
};

type ResolvedRouteOptions<
	TAllPath extends string = string,
	TAllParams extends AnyObj = {},
	TAllSearch extends AnyObj = {},
> = RouteOptions & {
	[KEY_PAGES]: RouteOptions['page'][];
	[KEY_ERRORS]: [parent?: RouteOptions['error'], own?: RouteOptions['error']];
	[KEY_LOAD_FNS]: RouteOptions['load'][];
	[KEY_PARAMS_FNS]: RouteOptions['parse_params'][];
	[KEY_SEARCH_FNS]: RouteOptions['parse_search'][];
	[KEY_URL_PATTERN]?: URLPattern;
	[KEY_PAGES_RESOLVED]: boolean;
	[KEY_HAS_LAYOUT]: boolean;
	/** Type only, no runtime equivalent. */
	ROUTE: Route<TAllPath, TAllParams, TAllSearch>;
};

type RouteOptions<
	TPath extends string = string,
	TParams extends AnyObj = {},
	TSearch extends AnyObj = {},
	_ParsedParams = ParseParams<TPath>,
> = {
	path: TPath;
	page: RegisteredComponent | (() => Promise<{ default: RegisteredComponent }>);
	error?: RegisteredComponent;
	load?: NavigationHook;
	parse_params?(
		params: _ParsedParams,
	): TParams extends Record<keyof _ParsedParams, any> ? TParams : _ParsedParams;
	parse_search?(search: URLSearchParams): TSearch;
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
	TRoutes extends Record<string, ResolvedRouteOptions> = Record<
		string,
		ResolvedRouteOptions
	>,
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
	TRoutes extends Record<string, ResolvedRouteOptions> = Record<
		string,
		ResolvedRouteOptions
	>,
	TContext extends AnyObj = AnyObj,
	TPaths extends string = keyof TRoutes & string,
> {
	/** Type only, no runtime equivalent. */
	ROUTES: { [K in keyof TRoutes]: TRoutes[K]['ROUTE'] };

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
	TRoutes extends Record<string, ResolvedRouteOptions> = {},
> = {
	add<
		const TParentPath extends TPaths,
		const TChildren extends RouteOptions[],
		_ParentRoute extends ResolvedRouteOptions = TRoutes[TParentPath],
	>(
		parent: TParentPath,
		children: TChildren,
	): RouteTree<
		TPaths | JoinPaths<TParentPath, TChildren[number]['path']>,
		TRoutes & {
			[C in TChildren[number] as C['path'] extends ''
				? TParentPath
				: JoinPaths<TParentPath, C['path']>]: ResolvedRouteOptions<
				C['path'] extends '' ? TParentPath : JoinPaths<TParentPath, C['path']>,
				_ParentRoute['ROUTE']['params'] &
					MyReturnType<NonNullable<C['parse_params']>>,
				_ParentRoute['ROUTE']['search'] &
					MyReturnType<NonNullable<C['parse_search']>>
			>;
		}
	>;
	done(): TRoutes;
};
