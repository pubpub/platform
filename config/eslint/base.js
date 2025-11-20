// @ts-check
import * as path from "node:path"
import { includeIgnoreFile } from "@eslint/compat"
import importPlugin from "eslint-plugin-import"
import tseslint from "typescript-eslint"

/**
 * All packages that leverage t3-env should use this rule
 */
export const restrictEnvAccess = tseslint.config(
	{ ignores: ["**/env.ts"] },
	{
		files: ["**/*.js", "**/*.ts", "**/*.tsx"],
		rules: {
			"no-restricted-properties": [
				"error",
				{
					object: "process",
					property: "env",
					message:
						"Use `import { env } from '~/lib/env/env'` instead to ensure validated types.",
				},
			],
			"no-restricted-imports": [
				"error",
				{
					name: "process",
					importNames: ["env"],
					message:
						"Use `import { env } from '~/lib/env/env'` instead to ensure validated types.",
				},
			],
		},
	}
)

export default tseslint.config(
	// Ignore files not tracked by VCS and any config files
	includeIgnoreFile(path.join(import.meta.dirname, "../../.gitignore")),
	{ ignores: ["**/*.config.*"] },
	{
		files: ["**/*.js", "**/*.ts", "**/*.tsx"],
		extends: [
			// we don't want anything on by default, but these are quite common
			//		"turbo",
			//		"eslint:recommended",
			//		"plugin:@typescript-eslint/recommended-type-checked",
			//		"plugin:@typescript-eslint/stylistic-type-checked",
		],
		plugins: {
			import: importPlugin,
			"@typescript-eslint": tseslint.plugin,
		},
		rules: {
			// "turbo/no-undeclared-env-vars": "error",
			// "@typescript-eslint/no-unused-vars": [
			// 	"error",
			// 	{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
			// ],
			// "@typescript-eslint/no-misused-promises": [2, { checksVoidReturn: { attributes: false } }],
			// "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
			"no-console": "error",
		},
		languageOptions: {
			parser: tseslint.parser,
		},
	},
	{ languageOptions: { parserOptions: { projectService: true } } }
)
