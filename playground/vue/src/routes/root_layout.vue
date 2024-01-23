<script setup lang="ts">
import { use_router } from 'ruta-vue';

const router = use_router();
</script>

<template>
	<h1>root layout {{ Date.now() }}</h1>

	<a :href="router.to_href('/home')">home</a>
	<a
		:href="
			router.to_href({
				path: '/params/:param_id',
				params: {
					param_id: 123,
				},
			})
		"
		>123</a
	>
	<a
		:href="
			router.to_href({
				path: '/params/:param_id',
				params: {
					param_id: 456,
				},
			})
		"
		>456</a
	>

	<a :href="router.to_href('/load_hook')">load hook</a>

	<slot />
</template>
