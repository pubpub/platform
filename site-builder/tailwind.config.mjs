// @ts-check
import { dirname, join } from "path";

import sharedConfig from "ui/tailwind.config.js";

/** @param {string} id */
const packagePath = (id) => dirname(require.resolve(`${id}/package.json`));
/** @param {string} id */
const packageSource = (id) => join(packagePath(id), "src", "**/*.{ts,tsx}");

/** @type {import('tailwindcss').Config} */
export default {
	presets: [sharedConfig],
	plugins: [],
	// content: ["./src/**/*.{ts,tsx}", "./src/**/*.astro", packageSource("ui")],
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}", packageSource("ui")],
};
