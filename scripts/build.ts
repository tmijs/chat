import { build, type BuildOptions } from 'esbuild';

const entryFile = 'src/index.ts';

const opts: BuildOptions = {
	bundle: true,
	sourcemap: true,
	sourcesContent: false,
	target: 'es2022',
	tsconfig: 'tsconfig.json',
	outdir: 'dist',

	// minifySyntax: true,
	// minifyIdentifiers: true,
};

const node: BuildOptions = {
	platform: 'node',
	minifySyntax: true,
	packages: 'external',
};

const browser: BuildOptions = {
	platform: 'browser',
	entryPoints: { 'tmi': entryFile },
};

const esm: BuildOptions = {
	format: 'esm',
	outExtension: { '.js': '.mjs' },
};

const esm_min: BuildOptions = {
	...esm,
	minify: true,
};

const cjs: BuildOptions = {
	format: 'cjs',
	outExtension: { '.js': '.cjs' },
};

const iife: BuildOptions = {
	format: 'iife',
	globalName: 'tmi',
	outExtension: { '.js': '.js' },
};

const iife_min: BuildOptions = {
	...iife,
	minify: true,
};

// Node - ESM & CJS
// tmi.node.mjs
build({ ...opts, ...node,    ...esm,      entryPoints: { 'tmi.node': entryFile } });
// tmi.node.cjs
build({ ...opts, ...node,    ...cjs,      entryPoints: { 'tmi.node': entryFile } });

// Browser - ESM & IIFE, with & without minification
// tmi.browser.mjs
build({ ...opts, ...browser, ...esm,      entryPoints: { 'tmi.browser': entryFile } });
// tmi.browser.min.mjs
build({ ...opts, ...browser, ...esm_min,  entryPoints: { 'tmi.browser.min': entryFile } });
// tmi.browser-global.js
build({ ...opts, ...browser, ...iife,     entryPoints: { 'tmi.browser-global': entryFile } });
// tmi.browser-global.min.js
build({ ...opts, ...browser, ...iife_min, entryPoints: { 'tmi.browser-global.min': entryFile } });