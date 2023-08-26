/// <reference types="vite/client" />

import './style.css';

const fw = import.meta.env.FW;
const is_vue = fw === 'vue';
const is_svelte = fw === 'svelte';
const is_solid = fw === 'solid';

if (is_vue) {
	import('./main_vue.js').then(({ init_vue_app }) => {
		init_vue_app();
	});
} else if (is_svelte) {
	import('./main_svelte.js').then(({ init_svelte_app }) => {
		init_svelte_app();
	});
} else if (is_solid) {
	import('./main_solid.jsx').then(({ init_solid_app }) => {
		init_solid_app();
	});
}
