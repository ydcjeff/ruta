type Prettify<T> = { [K in keyof T]: T[K] } & {};
type AnyObj = Record<string, any>;
type MaybePromise<T> = Promise<T> | T;

type HookStopHandler = () => void;

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
	// @ts-expect-error
	_AllParams = RegisteredRouter['ROUTES'][TPath]['params'],
	// @ts-expect-error
	_AllSearch = RegisteredRouter['ROUTES'][TPath]['search'],
> = {
	path: TPath;
} & (keyof _AllParams extends never ? {} : { params: _AllParams }) &
	(keyof _AllSearch extends never ? {} : { search: _AllSearch });

type Route<
	TRouteOptions extends RouteOptions = RouteOptions,
	THref extends string = string,
	TAllParams extends AnyObj = {},
	TAllSearch extends AnyObj = {},
> = TRouteOptions & {
	href: THref;
	params: TAllParams;
	search: TAllSearch;
};

type RouteOptions<
	TPath extends string = string,
	TParams extends AnyObj = {},
	TSearch extends AnyObj = {},
	_ParsedParams = ParseParams<TPath>,
> = {
	path: TPath;
	page: MaybePromise<RegisteredComponent>;
	error?: MaybePromise<RegisteredComponent>;
	parse_search?(search: URLSearchParams): TSearch;
	before?(): MaybePromise<void>;
	after?(): MaybePromise<void>;
} & (keyof _ParsedParams extends never
	? {}
	: {
			parse_params(
				params: _ParsedParams,
			): TParams extends Record<keyof _ParsedParams, any>
				? TParams
				: 'parse_params must return an object';
		});

export type NavigationHook = (
	to: Pick<
		RegisteredRouter['ROUTES'][keyof RegisteredRouter['ROUTES']],
		'href' | 'params' | 'path' | 'search'
	>,
	from: Pick<
		RegisteredRouter['ROUTES'][keyof RegisteredRouter['ROUTES']],
		'href' | 'params' | 'path' | 'search'
	>,
) => MaybePromise<void>;

export interface RutaOptions<
	TBase extends string = string,
	TContext extends AnyObj = AnyObj,
> {
	base?: TBase;
	context?: TContext;
}

export interface Register {
	// router
	// component
}

type RegisteredComponent = Register extends { component: infer C }
	? C
	: unknown;

type RegisteredRouter = Register extends { router: infer R } ? R : Ruta;

type MyReturnType<T extends (...args: any) => any> = T extends (
	...args: any
) => infer R
	? R
	: {};

export class Ruta<
	TBase extends string = '',
	TContext extends AnyObj = AnyObj,
	TPaths extends string = '',
	TRoutes extends Record<TPaths, Route> = Record<TPaths, Route>,
> {
	/**
	 * Typed only, no runtime equivalent.
	 */
	ROUTES: Omit<TRoutes, ''>;

	constructor(options?: RutaOptions<TBase, TContext>);

	/**
	 * Get router context.
	 */
	get context(): TContext;

	/**
	 * Add new children routes by the parent path.
	 */
	add<
		TParentPath extends TPaths,
		const TChildren extends RouteOptions[],
		_ParentRoute extends Route = TRoutes[TParentPath],
	>(
		parent_path: TParentPath,
		children: TChildren,
	): Ruta<
		TBase,
		TContext,
		TPaths | JoinPaths<TParentPath, TChildren[number]['path']>,
		// @ts-expect-error idk
		TRoutes & {
			[C in TChildren[number] as JoinPaths<TParentPath, C['path']>]: Route<
				C,
				JoinPaths<TParentPath, C['path']>,
				// @ts-expect-error conditional parameter
				_ParentRoute['params'] & MyReturnType<C['parse_params']>,
				_ParentRoute['search'] & MyReturnType<NonNullable<C['parse_search']>>
			>;
		}
	>;

	/**
	 * Make a navigation.
	 */
	go<TPath extends TPaths>(
		to: StaticPaths<TPath> | ToOptions<TPath>,
	): Promise<void>;

	/**
	 * Make a href-string.
	 */
	to_href<TPath extends TPaths>(
		to: StaticPaths<TPath> | ToOptions<TPath>,
	): string;

	/**
	 * Register a router before hook.
	 */
	before(hook: NavigationHook): HookStopHandler;

	/**
	 * Register a router after hook.
	 */
	after(hook: NavigationHook): HookStopHandler;
}

export function use_router(): Omit<RegisteredRouter, 'add'>;

export function define_route<
	const TPath extends string = string,
	TParams extends AnyObj = {},
	TSearch extends AnyObj = {},
>(
	route: RouteOptions<TPath, TParams, TSearch>,
): RouteOptions<TPath, TParams, TSearch>;
