import { DEV } from 'esm-env';

export const KEY_PAGES = Symbol(DEV ? 'page' : '');
export const KEY_ERRORS = Symbol(DEV ? 'error' : '');
export const KEY_LOAD_FNS = Symbol(DEV ? 'load' : '');
export const KEY_PARAMS_FNS = Symbol(DEV ? 'parse_params' : '');
export const KEY_SEARCH_FNS = Symbol(DEV ? 'parse_search' : '');
export const KEY_URL_PATTERN = Symbol(DEV ? 'urlpattern' : '');
export const KEY_PAGES_RESOLVED = Symbol(DEV ? 'pages_resolved' : '');
export const KEY_HAS_LAYOUT = Symbol(DEV ? 'has_layout' : '');
export const IMMUTABLE_EMPTY_ARRAY = /** @type {any[]} */ (
	/** @type {unknown} */ (Object.freeze([]))
);
export const IMMUTABLE_EMPTY_OBJ = Object.freeze({});
export const FAKE_ORIGIN = 'http://a.b';
