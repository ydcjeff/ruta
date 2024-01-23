import { DEV } from 'esm-env';

export const PATTERN_SYMBOL = Symbol(DEV ? 'pattern' : '');
export const PAGES_SYMBOL = Symbol(DEV ? 'pages' : '');
export const RESOLVED_SYMBOL = Symbol(DEV ? 'resolved' : '');
