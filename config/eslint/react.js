// @ts-check

import jsxA11yPlugin from "eslint-plugin-jsx-a11y"
import reactPlugin from "eslint-plugin-react"
import validateJsxNestingPlugin from "eslint-plugin-validate-jsx-nesting"

/** @type {Awaited<import('typescript-eslint').Config>} */
export default [
	jsxA11yPlugin.flatConfigs.recommended,
	{
		plugins: {
			react: reactPlugin,
			"validate-jsx-nesting": validateJsxNestingPlugin,
		},
		rules: {
			"react/jsx-key": "error",
			"validate-jsx-nesting/no-invalid-jsx-nesting": "error",
		},
		settings: {
			react: {
				version: "detect",
			},
		},
	},
]
