// @ts-check

import baseConfig from "./index.js"

/** @typedef {import("prettier").Config} PrettierConfig */
/** @typedef {import("prettier-plugin-tailwindcss").PluginOptions} TailwindConfig */
/** @typedef {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig */

/** @type {PrettierConfig & SortImportsConfig & TailwindConfig} */
const config = {
	...baseConfig,
	plugins: [...(baseConfig.plugins ?? []), "prettier-plugin-astro"],
	overrides: [
		{
			files: "*.astro",
			options: {
				parser: "astro",
			},
		},
	],
}

export default config
