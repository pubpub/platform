/** @type {import('tailwindcss').Config} */
const path = require("path");

const sharedConfig = require("ui/tailwind.config.js");
const resolve = (packageName) =>
	path.join(path.dirname(require.resolve(packageName)), "**/*.{js,cjs,mjs}");

module.exports = {
	presets: [sharedConfig],
	content: ["./app/**/*.{ts,tsx}", resolve("@pubpub/sdk/react"), resolve("ui")],
};
