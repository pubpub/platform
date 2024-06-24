import { fileURLToPath } from "url";

/** @typedef {import("prettier").Config} PrettierConfig */
/** @typedef {import("prettier-plugin-tailwindcss").PluginOptions} TailwindConfig */
/** @typedef {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig */

/** @type { PrettierConfig | SortImportsConfig | TailwindConfig } */
const config = {
	arrowParens: "always",
	printWidth: 100,
	tabWidth: 4,
	trailingComma: "es5",
	useTabs: true,
	singleQuote: false,
	plugins: ["@ianvs/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],
	// tailwindConfig: fileURLToPath(
	//   new URL("../../tooling/tailwind/web.ts", import.meta.url),
	// ),
	tailwindFunctions: ["cn", "cva"],
	importOrder: [
		"<BUILTIN_MODULES>",
		"",
		"<TYPES>",
		"",
		"^(react/(.*)$)|^(react$)|^(react-native(.*)$)",
		"^(next/(.*)$)|^(next$)",
		"<THIRD_PARTY_MODULES>",
		"",
		"<TYPES>^((lib|db|ui|@pubpub|utils|contracts|logger)/(.*)$)|^((lib|ui|@pubpub/*|utils|contracts|logger)$)",
		"^((lib|db|ui|@pubpub|utils|contracts|logger)/(.*)$)|^((lib|ui|@pubpub/*|utils|contracts|logger)$)",
		"",
		"<TYPES>^[.|..|~]",
		"^~/",
		"^[../]",
		"^[./]",
		"",
		"^(?!.*[.]css$)[./].*$",
		".css$",
	],
	importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
	importOrderTypeScriptVersion: "4.5.0",
};

export default config;
