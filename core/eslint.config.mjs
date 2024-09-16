// @ts-check

import baseConfig, { restrictEnvAccess } from "@pubpub/eslint-config/base";
import nextConfig from "@pubpub/eslint-config/next";
import reactConfig from "@pubpub/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
	{
		ignores: [".next/**"],
	},
	...baseConfig,
	...reactConfig,
	...nextConfig,
	...restrictEnvAccess,
];
