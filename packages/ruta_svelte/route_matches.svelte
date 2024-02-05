<script context="module">
	const DEPTH_SYMBOL = Symbol();
</script>

<script>
	import { getContext, setContext } from 'svelte';
	import { get_route } from 'ruta-svelte';

	const route = get_route();
	const index = getContext(DEPTH_SYMBOL) || 0;

	$: component = $route.pages[index];
	$: has_children = $route.pages.length > index;

	setContext(DEPTH_SYMBOL, index + 1);
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
