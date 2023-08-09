/** @type {import('tailwindcss').Config} */

const sharedConfig = require("ui/tailwind.config.js");

module.exports = {
	presets: [sharedConfig],
	prefix: "",
	content: [
		"./app/**/*.{ts,tsx}",
		// "../packages/**/*.{js,ts,jsx,tsx}"
		"./node_modules/ui/**/*.{js,ts,jsx,tsx}"
	],
};
