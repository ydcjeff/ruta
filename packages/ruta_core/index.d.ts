import { URLPattern } from 'urlpattern-polyfill';
import { PAGES_SYMBOL, PATTERN_SYMBOL, RESOLVED_SYMBOL } from './constants';

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

export type Route<
	TRouteOptions extends RouteOptions = RouteOptions,
	THref extends string = string,
	TAllParams extends AnyObj = {},
	TAllSearch extends AnyObj = {},
> = Pick<TRouteOptions, 'path'> & {
	href: THref;
	params: TAllParams;
	search: TAllSearch;
	pages: RegisteredComponent[];
};

type InternalRoute = Route &
	RouteOptions & {
		[PAGES_SYMBOL]: RegisteredComponent[];
		[PATTERN_SYMBOL]: URLPattern;
		[RESOLVED_SYMBOL]: boolean;
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
	parse_params?(
		params: _ParsedParams,
	): TParams extends Record<keyof _ParsedParams, any>
		? TParams
		: 'parse_params must return an object';
	parse_search?(search: URLSearchParams): TSearch;
	before?: NavigationHook;
	after?: NavigationHook;
};

export type NavigationHookArgs<
	TRoutes = RegisteredRouter['ROUTES'],
	T = TRoutes[keyof TRoutes] extends never ? Route : TRoutes[keyof TRoutes],
> = {
	to: T;
	from: T;
	context: RegisteredRouter['context'];
	controller: AbortController;
};

export type NavigationHook = (args: NavigationHookArgs) => MaybePromise<void>;

export interface RutaOptions<
	TRoutes extends Record<string, Route> = Record<string, Route>,
	TContext extends AnyObj = AnyObj,
> {
	routes: TRoutes;
	base?: string;
	context?: TContext;
}

export interface Register {
	// router
	// component
}

type RegisteredComponent = Register extends { component: infer C }
	? C
	: unknown;

export type RegisteredRouter = Register extends { router: infer R } ? R : Ruta;

type MyReturnType<T extends (...args: any) => any> = T extends (
	...args: any
) => infer R
	? R
	: {};

export class Ruta<
	TRoutes extends Record<string, Route> = Record<string, Route>,
	TContext extends AnyObj = AnyObj,
	TPaths extends string = keyof TRoutes & string,
> {
	/**
	 * Type only, no runtime equivalent.
	 */
	ROUTES: Prettify<TRoutes>;

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

export function define_route<
	const TPath extends string = string,
	TParams extends AnyObj = {},
	TSearch extends AnyObj = {},
>(
	route: RouteOptions<TPath, TParams, TSearch>,
): RouteOptions<TPath, TParams, TSearch>;

export function create_routes(): RouteTree;

type RouteTree<
	TPaths extends string = string,
	TRoutes extends Record<string, Route> = {},
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
		_ParentRoute extends Route = TRoutes[TParentPath],
	>(
		parent: TParentPath,
		children: TChildren,
	): RouteTree<
		TPaths | JoinPaths<TParentPath, TChildren[number]['path']>,
		TRoutes & {
			[C in TChildren[number] as JoinPaths<TParentPath, C['path']>]: Route<
				C,
				JoinPaths<TParentPath, C['path']>,
				_ParentRoute['params'] & MyReturnType<NonNullable<C['parse_params']>>,
				_ParentRoute['search'] & MyReturnType<NonNullable<C['parse_search']>>
			>;
		}
	>;
	done(): TRoutes;
};
