import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		globalSetup: ["./globalSetup.ts"],
		environment: "jsdom",
		environmentMatchGlobs: [
			["**/(!db).test.ts", "jsdom"],
			// all tests in tests/ with .edge.test.ts will run in edge-runtime
			["**/*.db.test.ts", "node"],
			// ...
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
