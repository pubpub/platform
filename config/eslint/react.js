/** @type {import('eslint').Linter.Config} */
const config = {
	extends: [
		//	"plugin:react/recommended",
		//	"plugin:react-hooks/recommended",
		"plugin:jsx-a11y/recommended",
	],
	plugins: ["react", "jsx-a11y", "validate-jsx-nesting"],
	rules: {
		"react/prop-types": "off",
		"react/jsx-key": "error",
		"validate-jsx-nesting/no-invalid-jsx-nesting": "error",
	},
	globals: {
		React: "writable",
	},
	settings: {
		react: {
			version: "detect",
		},
	},
	env: {
		browser: true,
	},
};

module.exports = config;
