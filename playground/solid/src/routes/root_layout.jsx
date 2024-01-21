import { For } from 'solid-js';

export default function root_layout(props) {
	const links = ['/', '/params/123', '/params/456'];

	return (
		<>
			<h1>root layout {Date.now()}</h1>

			<For each={links}>{(l) => <a href={l}>{l}</a>}</For>

			{props.children}
		</>
	);
}
