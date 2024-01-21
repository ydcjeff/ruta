<script>
	const links = ['/', '/params/123', '/params/456'];
</script>

<h1>
	root layout {Date.now()}
</h1>

{#each links as l}
	<a href={l}>{l}</a>
{/each}

<slot />
