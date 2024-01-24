import { use_router } from 'ruta-solid';
import { ParentProps } from 'solid-js';

export default function root_layout(props: ParentProps) {
	const router = use_router();

	return (
		<>
			<h1>root layout {Date.now()}</h1>

			<a href={router.to_href('/')}>index</a>
			<a
				href={router.to_href({
					path: '/params/:param_id',
					params: {
						param_id: 123,
					},
				})}
			>
				params/123
			</a>

			{props.children}
		</>
	);
}
