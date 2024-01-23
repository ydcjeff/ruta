import { use_route } from 'ruta-solid';

export default function param_id_page() {
	const route = use_route('/params/:param_id');

	return <h1>param id - {route.params.param_id}</h1>;
}
