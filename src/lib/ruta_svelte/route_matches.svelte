<script context="module">
	const DEPTH_SYMBOL = Symbol();
</script>

<script>
	import { getContext, setContext } from 'svelte';
	import { get_route } from './mod.js';

	const route = get_route();
	const depth = getContext(DEPTH_SYMBOL) || 1;

	$: component = $route.pages[$route.pages.length - depth];
	$: has_children = $route.pages.length > depth;

	setContext(DEPTH_SYMBOL, depth + 1);
</script>

{#if component}
	<!-- Due to how slot is implemented in Svelte, we have to wrap the whole block https://github.com/sveltejs/svelte/issues/6325 -->
	{#if has_children}
		<svelte:component this={component}>
			<svelte:self />
		</svelte:component>
	{:else}
		<svelte:component this={component}></svelte:component>
	{/if}
{/if}
