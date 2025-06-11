import path, { dirname, join } from "path";

import type { StorybookConfig } from "@storybook/nextjs-vite";
import type { InlineConfig } from "vite";

// import { env } from "~/lib/env/env";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
	return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
	stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: [
		getAbsolutePath("@storybook/addon-onboarding"),
		// getAbsolutePath("@chromatic-com/storybook"),
		getAbsolutePath("@storybook/addon-vitest"),
		getAbsolutePath("@storybook/addon-docs"),
	],
	core: {},
	framework: {
		name: getAbsolutePath("@storybook/nextjs-vite"),
		options: {},
	},
	features: {
		experimentalRSC: true,
	},
	staticDirs: ["../public"],
	env: (env) => {
		console.log(process.env.SKIP_VALIDATION);
		console.log(process.env.PUBPUB_URL);
		return {
			...env,
			SKIP_VALIDATION: "true",
			PUBPUB_URL: "http://localhost:6006",
		};
	},

	// typescript: {
	// 	reactDocgen: "react-docgen-typescript",
	// },
	viteFinal: async (config) => {
		// return config;
		// const { mergeConfig } = await import("vite");

		// return mergeConfig(config, {
		// ssr: {
		// 	external: ["@node-rs/argon2", "@node-rs/argon2-wasm32-wasi"],
		// },
		config.resolve = config.resolve || {};
		if (config.resolve) {
			config.resolve.alias = [
				{
					find: /.*pubeditor.*actions(.ts)?$/i,
					replacement: new URL("./__mocks__/PubEditor.actions.mock.ts", import.meta.url)
						.pathname,
				},
				{
					find: /.*stages.*actions(.ts)?$/i,
					replacement: new URL("./__mocks__/Stages.actions.mock.ts", import.meta.url)
						.pathname,
				},
				{
					find: /.*serverAction(.ts)?$/,
					replacement: new URL("./__mocks__/runActionInstance.mock.ts", import.meta.url)
						.pathname,
				},
				{
					find: "server-only",
					replacement: new URL("./__mocks__/server-only.mock.ts", import.meta.url)
						.pathname,
				},
				{
					find: /.*server\/pubFields$/,
					replacement: new URL("./__mocks__/pubFields.mock.ts", import.meta.url).pathname,
				},

				// {
				// 	find: /^pg.*$/,
				// 	replacement: new URL("./__mocks__/pg.mock.ts", import.meta.url).pathname,
				// },
			];
			// define: {
			// 	"process.env.SKIP_VALIDATION": "true",
			// 	"process.env.PUBPUB_URL": "http://localhost:6006",
			// },
			// optimizeDeps: {
			// 	exclude: ["storybook/internal/csf"],
			// },
			// resolve: {
			// {
			// ...config.resolve?.alias,
			// "server-only": path.resolve(__dirname, "./__mocks__/server-only.mock.ts"),
			// "~/app/components/pubs/PubEditor/actions": path.resolve(
			// 	__dirname,
			// 	"./__mocks__/PubEditor.actions.mock.ts"
			// ),
			// "~/app/c/[communitySlug]/stages/components/lib/actions": path.resolve(
			// 	__dirname,
			// 	"./__mocks__/Stages.actions.mock.ts"
			// ),
			// "~/lib/server/pubFields": path.resolve(
			// 	__dirname,
			// 	"./__mocks__/pubFields.mock.ts"
			// ),
			// "~/actions/api/serverAction": new URL(
			// 	"./__mocks__/runActionInstance.mock.ts",
			// 	import.meta.url
			// ).pathname,
			// "~/app/components/ActionUI/ActionRunFormWrapper": path.resolve(
			// 	__dirname,
			// 	"./__mocks__/ActionRunFormWrapper.mock.tsx"
			// ),
			// };
			// },
		}
		console.dir(config, { depth: null });
		return config;
		//  satisfies Partial<InlineConfig>);
	},
};
export default config;
