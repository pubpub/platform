import { defineConfig, Options } from "tsup";

export default defineConfig((options) => ({
	// treeshake: true,
	splitting: true,
	entry: ["src/**/*.tsx"],
	format: ["esm"],
	minify: true,
	clean: true,
	external: ["react"],
	esbuildOptions(options) {
		options.banner = {
			js: '"use client"',
		};
	},
	dts: process.env.NODE_ENV === "production",
	onSuccess: process.env.NODE_ENV !== "production" ? "pnpm exec tsc" : undefined,
	...options,
}));

// Treeshaking enabled is breaking "use client"
// https://github.com/egoist/tsup/issues/835
