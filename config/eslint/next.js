// @ts-check

import nextPlugin from "@next/eslint-plugin-next";

/** @type {Awaited<import('typescript-eslint').Config>} */
export default [
	{
		files: ["**/*.ts", "**/*.tsx"],
		plugins: {
			"@next/next": nextPlugin,
		},
		rules: {
			...nextPlugin.configs["core-web-vitals"].rules,
			"@next/next/no-html-link-for-pages": "off",
			"@typescript-eslint/require-await": "off",
			// TypeError: context.getAncestors is not a function
			"@next/next/no-duplicate-head": "off",
			"no-restricted-syntax": [
				"error",
				{
					selector:
						"CallExpression[callee.name='defineServerAction'] > :nth-child(1):not(FunctionExpression[id.name][async=true])",
					message: "You can only pass named, async functions into defineServerAction",
				},
				{
					selector: "TryStatement > .block CallExpression[callee.name='redirect']",
					message:
						"Do not use 'redirect' inside of 'try'. 'redirect' throws an error in order to function: https://nextjs.org/docs/app/api-reference/functions/redirect",
				},
			],
		},
	},
];
