import { defineConfig, Options } from "tsup";
import typescript from "@rollup/plugin-typescript";

export default defineConfig((options: Options) => ({
	treeshake: true,
	splitting: false,
	entry: ["src/lib/index.ts", "src/react/**/*.tsx"],
	format: ["esm", "cjs"],
	dts: process.env.NODE_ENV === "production",
	bundle: false,
	minify: true,
	clean: true,
	onSuccess: process.env.NODE_ENV !== "production" ? "pnpm exec tsc" : undefined,
	...options,
}));
