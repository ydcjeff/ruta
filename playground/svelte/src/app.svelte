<script>
	import { RouteMatches } from 'ruta-svelte';

	/** @type {import('ruta-svelte').RutaSvelte } */
	export let ruta;

	ruta.install();
</script>

<RouteMatches />
