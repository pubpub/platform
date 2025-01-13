/** @type {import('tailwindcss').Config} */
const path = require("path")
const sharedConfig = require("ui/tailwind.config.js")
const packagePath = (id) => path.dirname(require.resolve(`${id}/package.json`))
const packageSource = (id) => path.join(packagePath(id), "src", "**/*.{ts,tsx}")

module.exports = {
	presets: [sharedConfig],
	plugins: [require("@tailwindcss/forms")],
	content: ["./app/**/*.{ts,tsx}", packageSource("ui"), packageSource("@pubpub/sdk")],
}
