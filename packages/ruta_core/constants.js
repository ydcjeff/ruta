import { DEV } from 'esm-env';

export const PATTERN_SYMBOL = Symbol(DEV ? 'pattern' : '');
export const PAGES_SYMBOL = Symbol(DEV ? 'pages' : '');
export const RESOLVED_SYMBOL = Symbol(DEV ? 'resolved' : '');
export const IMMUTABLE_EMPTY_ARRAY = /** @type {any[]} */ (
	/** @type {unknown} */ (Object.freeze([]))
);
export const IMMUTABLE_EMPTY_OBJ = Object.freeze({});
