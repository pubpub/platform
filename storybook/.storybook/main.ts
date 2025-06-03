import { dirname, join } from "path";

import type { StorybookConfig } from "@storybook/react-vite";

import react from "@vitejs/plugin-react";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
	return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
	stories: [
		"../**/*.mdx",
		"../**/*.stories.@(js|jsx|mjs|ts|tsx)",
		"../../packages/**/*.stories.@(js|jsx|mjs|ts|tsx)",
	],
	addons: [
		getAbsolutePath("@storybook/addon-links"),
		getAbsolutePath("@storybook/addon-essentials"),
		getAbsolutePath("@chromatic-com/storybook"),
		getAbsolutePath("@storybook/addon-interactions"),
	],
	framework: {
		name: getAbsolutePath("@storybook/react-vite"),
		options: {},
	},
	async viteFinal(config) {
		const { mergeConfig } = await import("vite");

		return mergeConfig(config, {
			plugins: [
				react({
					babel: {
						plugins: ["babel-plugin-react-compiler"],
					},
				}),
			],
		});
	},
};
export default config;
