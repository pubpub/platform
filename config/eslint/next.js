/** @type {import('eslint').Linter.Config} */
const config = {
	extends: ["plugin:@next/next/core-web-vitals"],
	rules: {
		"@next/next/no-html-link-for-pages": "off",
		"@typescript-eslint/require-await": "off",
		"no-restricted-syntax": [
			"error",
			{
				selector:
					"CallExpression[callee.name='defineServerAction'] > :nth-child(1):not(FunctionExpression[id.name][async=true])",
				message: "You can only pass named, async functions into defineServerAction",
			},
		],
	},
};

module.exports = config;
