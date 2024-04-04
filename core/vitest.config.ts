import react from "@vitejs/plugin-react";
import tsconfigPaths from "vitest-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		environment: "jsdom",
	},
});
