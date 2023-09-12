import { defineConfig, Options } from "tsup";

export default defineConfig((options: Options) => ({
	treeshake: true,
	splitting: false,
	entry: ["src/lib/index.ts", "src/react/**/*.tsx"],
	format: ["esm", "cjs"],
	minify: true,
	clean: true,
	dts: process.env.NODE_ENV === "production",
	onSuccess: process.env.NODE_ENV !== "production" ? "pnpm exec tsc" : undefined,
	...options,
}));
