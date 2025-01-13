const path = require("path")
const sharedConfig = require("ui/tailwind.config.js")
const editorConfig = require("context-editor/tailwind.config.js")
const packagePath = (id) => path.dirname(require.resolve(`${id}/package.json`))
const packageSource = (id) => path.join(packagePath(id), "src", "**/*.{ts,tsx}")

/** @type {import('tailwindcss').Config} */
module.exports = {
	presets: [sharedConfig, editorConfig],
	plugins: [require("@tailwindcss/forms")],
	content: [
		"./app/**/*.{ts,tsx}",
		"./actions/**/*.{ts,tsx}",
		packageSource("ui"),
		packageSource("context-editor"),
	],
}
