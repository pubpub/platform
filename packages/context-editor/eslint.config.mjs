// @ts-check

import baseConfig from "@pubpub/eslint-config/base";
import reactConfig from "@pubpub/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
	{
		ignores: ["dist/**", ".storybook/**"],
	},
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
				projectFolderIgnoreList: ["dist", ".storybook"],
			},
		},
	},
	...baseConfig,
	...reactConfig,
];
