import react from "@vitejs/plugin-react";
// @ts-expect-error no types for this package
import tsconfigPaths from "vitest-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		globalSetup: ["./globalSetup.ts"],
		environment: "jsdom",
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
