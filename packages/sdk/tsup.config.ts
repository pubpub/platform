import { defineConfig, Options } from "tsup";

export default defineConfig((options: Options) => ({
	treeshake: true,
	splitting: false,
	entry: ["src/lib/index.ts", "src/react/**/*.tsx"],
	format: ["esm", "cjs"],
	dts: true,
	minify: true,
	clean: true,
	...options,
}));
