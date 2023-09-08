import { defineConfig, Options } from "tsup";

export default defineConfig((options: Options) => ({
	// treeshake: true,
	splitting: false,
	entry: ["src/lib/index.ts", "src/react/**/*.tsx"],
	format: ["esm", "cjs"],
	dts: true,
	minify: true,
	clean: true,
	plugins: [
		{
			name: "yolo",
			setup(build: any) {
				const useClientExp = /['"]use client['"]\s?;/i;
				const useServerExp = /['"]use server['"]\s?;/i;
				build.onEnd((result: any) => {
					result.outputFiles
						?.filter((f: any) => !f.path.endsWith(".map"))
						.forEach((f: any) => {
							const txt = f.text;
							if (txt.match(useClientExp)) {
								Object.defineProperty(f, "text", {
									value: '"use client";\n' + txt.replace(useClientExp, ""),
								});
							}
							if (txt.match(useServerExp)) {
								Object.defineProperty(f, "text", {
									value: '"use server";\n' + txt.replace(useClientExp, ""),
								});
							}
						});
				});
			},
		},
	],
	...options,
}));

// Treeshaking enabled is breaking "use client"
// https://github.com/egoist/tsup/issues/835
