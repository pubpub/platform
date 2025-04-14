const path = require("path");
const sharedConfig = require("ui/tailwind.config.cjs");
// const editorConfig = require("context-editor/tailwind.config.cjs");
const packagePath = (id) => path.dirname(require.resolve(`${id}/package.json`));
const packageSource = (id) => path.join(packagePath(id), "src", "**/*.{ts,tsx}");

/** @type {import('tailwindcss').Config} */
module.exports = {
	presets: [sharedConfig],
	plugins: [require("@tailwindcss/forms")],
	content: [
		"./app/**/*.{ts,tsx}",
		"./actions/**/*.{ts,tsx}",
		packageSource("ui"),
		packageSource("context-editor"),
	],
};
