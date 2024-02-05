<script lang="ts">
const DEPTH_SYMBOL: InjectionKey<number> = Symbol();
</script>

<script setup lang="ts">
import { computed, inject, provide, type InjectionKey } from 'vue';
import { use_route } from 'ruta-vue';
import RouteMatches from './route_matches.vue';

const route = use_route();
const index = inject(DEPTH_SYMBOL, 0);

const component = computed(() => route.pages[index]);
const has_children = computed(() => route.pages.length > index);

provide(DEPTH_SYMBOL, index + 1);
</script>

<template>
	<component v-if="component" :is="component">
		<RouteMatches v-if="has_children" />
	</component>
</template>
