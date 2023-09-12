import { defineConfig, Options } from "tsup";

export default defineConfig((options: Options) => ({
	treeshake: true,
	splitting: true,
	entry: ["src/**/*.ts"],
	format: ["esm"],
	minify: true,
	clean: true,
	external: ["react"],
	dts: process.env.NODE_ENV === "production",
	onSuccess: process.env.NODE_ENV !== "production" ? "pnpm exec tsc" : undefined,
	...options,
}));
