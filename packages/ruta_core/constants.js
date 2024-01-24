import { DEV } from 'esm-env';

export const SYMBOL_PAGE = Symbol(DEV ? 'page' : '');
export const SYMBOL_ERROR = Symbol(DEV ? 'error' : '');
export const SYMBOL_LOAD = Symbol(DEV ? 'load' : '');
export const SYMBOL_PARAMS_FN = Symbol(DEV ? 'parse_params' : '');
export const SYMBOL_SEARCH_FN = Symbol(DEV ? 'parse_search' : '');
export const SYMBOL_PATTERN = Symbol(DEV ? 'pattern' : '');
export const SYMBOL_RESOLVED = Symbol(DEV ? 'resolved' : '');
export const SYMBOL_HAS_LAYOUT = Symbol(DEV ? 'has_layout' : '');
export const IMMUTABLE_EMPTY_ARRAY = /** @type {any[]} */ (
	/** @type {unknown} */ (Object.freeze([]))
);
export const IMMUTABLE_EMPTY_OBJ = Object.freeze({});
export const FAKE_ORIGIN = 'http://a.b';
