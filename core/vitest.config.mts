import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const ReactCompilerConfig = {
	/* ... */
};

export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: ["babel-plugin-react-compiler", {}],
			},
		}),
		tsconfigPaths(),
	],
	test: {
		globalSetup: ["./lib/__tests__/globalSetup.ts"],
		setupFiles: ["./lib/__tests__/matchers.ts"],
		environment: "jsdom",
		environmentMatchGlobs: [
			["**/(!db).test.ts", "jsdom"],
			// for database tests we don't want to use `jsdom`
			["**/*.db.test.ts", "node"],
		],
		exclude: [
			"**/playwright/**",
			"**/node_modules/**",
			"**/dist/**",
			"**/cypress/**",
			"**/.{idea,git,cache,output,temp}/**",
			"**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
		],
		// Clean up DOM between test runs https://testing-library.com/docs/vue-testing-library/setup/
		globals: true,
	},
});
