<script>
	import { RouteMatches, install_router } from 'ruta-svelte';

	export let ruta;

	install_router(ruta);
</script>

<RouteMatches />
