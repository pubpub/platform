// @ts-check

import jsxA11yPlugin from "eslint-plugin-jsx-a11y"
import reactPlugin from "eslint-plugin-react"
import reactCompilerPlugin from "eslint-plugin-react-compiler"
import reactHooksPlugin from "eslint-plugin-react-hooks"
import validateJsxNestingPlugin from "eslint-plugin-validate-jsx-nesting"

/** @type {Awaited<import('typescript-eslint').Config>} */
export default [
	jsxA11yPlugin.flatConfigs.recommended,
	{
		plugins: {
			react: reactPlugin,
			"validate-jsx-nesting": validateJsxNestingPlugin,
			"react-compiler": reactCompilerPlugin,
			"react-hooks": reactHooksPlugin,
		},
		rules: {
			"react/jsx-key": "error",
			"validate-jsx-nesting/no-invalid-jsx-nesting": "error",
			"react-compiler/react-compiler": "error",
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "warn",
		},
		settings: {
			react: {
				version: "detect",
			},
		},
	},
]
