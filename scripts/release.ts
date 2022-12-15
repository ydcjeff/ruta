#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

// This script requires `chlog` to be installed for generating changelog.
// chlog: https://github.com/ydcjeff/chlog

import * as path from 'https://deno.land/std@0.152.0/path/mod.ts';
import { cyan } from 'https://deno.land/std@0.152.0/fmt/colors.ts';
import {
	inc,
	type ReleaseType,
	valid,
} from 'https://deno.land/std@0.152.0/semver/mod.ts';

async function main() {
	const modules = Array.from(Deno.readDirSync('./modules')).map((v) => v.name);

	const increments = [
		'major',
		'minor',
		'patch',
		'premajor',
		'preminor',
		'prepatch',
		'prerelease',
	];

	const log = (s: string) => console.log(cyan(s));
	const run = async (cmd: string[]) => {
		const p = Deno.run({
			cmd,
			stderr: 'inherit',
			stdout: 'inherit',
		});

		const status = await p.status();
		if (!status.success) {
			throw new Error('subprocess error occurred.');
		}
	};

	const format = (arr: string[]) =>
		`${arr.map((v, i) => `\t${i} > ${v}\n`).join('')}`;

	const mod_idx = prompt(`Select module by number\n${format(modules)}`);

	if (!mod_idx) {
		throw new Error('Choose module by number');
	}

	const module = modules[+mod_idx];

	if (!module) return;

	const mod_path = path.join(Deno.cwd(), 'modules', module);
	const pkg_json_path = path.join(mod_path, 'package.json');
	const pkg = JSON.parse(Deno.readTextFileSync(pkg_json_path));

	const incc = (i: string) => inc(pkg.version, i as ReleaseType)!;

	const release_idx = prompt(
		`Select release type by number\n${format(increments)}`,
	);

	if (!release_idx) {
		throw new Error('Choose release type by number');
	}

	const release = incc(increments[+release_idx]);

	if (!valid(release)) {
		throw new Error(`invalid target version: ${release}`);
	}

	const tag = `${pkg.name}@${release}`;

	const yes = confirm(`Confirm releasing ${tag}?`);

	if (!yes) return;

	log('Updating module version...');
	update_version(pkg_json_path, release);

	log('Generating changelog...');
	await run([
		'chlog',
		'-o',
		path.join(mod_path, 'CHANGELOG.md'),
		'-t',
		tag,
		'--commit-path',
		mod_path,
	]);
	await run([
		'pnpm',
		'prettier',
		'--write',
		path.join(mod_path, 'CHANGELOG.md'),
	]);

	const chlog_ok = confirm('Changelog looks good?');

	if (!chlog_ok) return;

	const final_call = confirm('Commit & push?');

	if (!final_call) return;

	log('Committing changes...');
	await run(['git', 'add', '-A']);
	await run(['git', 'commit', '--no-verify', '-m', `release: ${tag}`]);
	await run(['git', 'tag', tag]);

	log('Pushing to GitHub...');
	await run(['git', 'push', '--tags']);
	await run(['git', 'push']);
}

try {
	main();
} catch (e) {
	console.error(e);
	Deno.exit(1);
}

function update_version(path: string, version: string) {
	const pkg = JSON.parse(Deno.readTextFileSync(path));
	pkg.version = version;
	Deno.writeTextFileSync(path, JSON.stringify(pkg, null, '\t') + '\n');
}
