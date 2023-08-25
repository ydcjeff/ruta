import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import solid from 'vite-plugin-solid';
import vue from '@vitejs/plugin-vue';

const FW = process.env['FW'];

export default defineConfig({
	plugins: [svelte(), solid(), vue()],
	build: {
		target: 'esnext',
		outDir: `dist/${FW}`,
	},
	define: {
		'import.meta.env.FW': JSON.stringify(FW),
	},
});
