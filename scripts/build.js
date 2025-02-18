// @ts-check
import { build } from 'esbuild';

const entryFile = 'src/index.ts';

/** @typedef {import('esbuild').BuildOptions} BuildOptions */

/**
 * @type {BuildOptions}
 */
const opts = {
	bundle: true,
	sourcemap: true,
	sourcesContent: false,
	target: 'es2022',
	tsconfig: 'tsconfig.json',
	outdir: 'dist',

	// minifySyntax: true,
	// minifyIdentifiers: true,
};

/** @type {BuildOptions} */
const node = {
	platform: 'node',
	minifySyntax: true,
	packages: 'external',
};

/** @type {BuildOptions} */
const browser = {
	platform: 'browser',
	entryPoints: { 'tmi': entryFile },
};

/** @type {BuildOptions} */
const esm = {
	format: 'esm',
	outExtension: { '.js': '.mjs' },
};

/** @type {BuildOptions} */
const esm_min = {
	...esm,
	minify: true,
};

/** @type {BuildOptions} */
const cjs = {
	format: 'cjs',
	outExtension: { '.js': '.cjs' },
};

/** @type {BuildOptions} */
const iife = {
	format: 'iife',
	globalName: 'tmi',
	outExtension: { '.js': '.js' },
};

/** @type {BuildOptions} */
const iife_min = {
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