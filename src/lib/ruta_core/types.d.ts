type MaybePromise<T> = Promise<T> | T;

export type NavigationHook = (to, from) => MaybePromise<void>;
