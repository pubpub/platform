import { defineConfig } from "tsup";

export default defineConfig((options) => ({
	// treeshake: true,
	splitting: true,
	entry: ["src/**/*.tsx"],
	format: ["esm", "cjs"],
	minify: true,
	clean: true,
	external: ["react"],
	dts: process.env.NODE_ENV === "production",
	onSuccess: process.env.NODE_ENV !== "production" ? "pnpm exec tsc" : undefined,
	...options,
}));

// Treeshaking enabled is breaking "use client"
// https://github.com/egoist/tsup/issues/835
