<script lang="ts">
const DEPTH_SYMBOL: InjectionKey<number> = Symbol();
</script>

<script setup lang="ts">
import { computed, inject, provide, type InjectionKey } from 'vue';
import { use_route } from './mod.js';
import RouteMatches from './route_matches.vue';

const route = use_route();
const depth = inject(DEPTH_SYMBOL, 1);

const component = computed(() => route.pages[route.pages.length - depth]);
const has_children = computed(() => route.pages.length > depth);

provide(DEPTH_SYMBOL, depth + 1);
</script>

<template>
	<component v-if="component" :is="component">
		<RouteMatches v-if="has_children" />
	</component>
</template>
