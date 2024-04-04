/** @type {import('eslint').Linter.Config} */
const config = {
	extends: ["plugin:@next/next/core-web-vitals"],
	rules: {
		"@next/next/no-html-link-for-pages": "off",
		"@typescript-eslint/require-await": "off",
		"no-restricted-syntax": [
			"error",
			{
				selector: "TryStatement > BlockStatement CallExpression[callee.name='redirect']",
				message:
					"Do not use 'redirect' inside of 'try'. 'redirect' throws an error in order to function: https://nextjs.org/docs/app/api-reference/functions/redirect",
			},
		],
	},
};

module.exports = config;
