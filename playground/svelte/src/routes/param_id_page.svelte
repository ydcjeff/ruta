<script>
	import { get_route } from 'ruta-svelte';

	const route = get_route('/params/:param_id');
</script>

<h1>
	param id - {$route.params.param_id}
</h1>
