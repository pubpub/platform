/** @type {import("eslint").Linter.Config} */
const config = {
	extends: [
		// we don't want anything on by default, but these are quite common
		//		"turbo",
		//		"eslint:recommended",
		//		"plugin:@typescript-eslint/recommended-type-checked",
		//		"plugin:@typescript-eslint/stylistic-type-checked",
	],
	env: {
		es2022: true,
		node: true,
	},
	parser: "@typescript-eslint/parser",
	parserOptions: { project: true },
	plugins: ["@typescript-eslint", "import", "n"],
	rules: {
		// "turbo/no-undeclared-env-vars": "error",
		"n/no-process-env": "error",
		// "@typescript-eslint/no-unused-vars": [
		// 	"error",
		// 	{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
		// ],
		"@typescript-eslint/consistent-type-imports": [
			"warn",
			{ prefer: "type-imports", fixStyle: "separate-type-imports" },
		],
		// "@typescript-eslint/no-misused-promises": [2, { checksVoidReturn: { attributes: false } }],
		"import/consistent-type-specifier-style": ["error", "prefer-top-level"],
		"no-console": "error",
	},
	ignorePatterns: [
		"**/*.config.js",
		"**/*.config.cjs",
		"**/.eslintrc.cjs",
		".next",
		"dist",
		"pnpm-lock.yaml",
	],
	reportUnusedDisableDirectives: true,
};

module.exports = config;
