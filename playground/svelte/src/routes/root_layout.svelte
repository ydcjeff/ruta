<script>
	import { get_router } from 'ruta-svelte';

	const router = get_router();
</script>

<h1>
	root layout {Date.now()}
</h1>

<a href={router.to_href('/')}>index</a>
<a
	href={router.to_href({
		path: '/params/:param_id',
		params: {
			param_id: 123,
		},
	})}>params/123</a
>

<slot />
