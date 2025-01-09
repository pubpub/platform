// @ts-check

import baseConfig from "@pubpub/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
	{
		ignores: ["dist/**", "**/.generated-pubtypes.ts", "**/__snapshots__/**"],
	},
	...baseConfig,
];
