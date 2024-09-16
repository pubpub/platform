// @ts-check

import baseConfig from "@pubpub/eslint-config/base";
import reactConfig from "@pubpub/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
	{
		ignores: ["dist/**"],
	},
	...baseConfig,
	...reactConfig,
];
