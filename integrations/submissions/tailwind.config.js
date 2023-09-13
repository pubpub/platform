/** @type {import('tailwindcss').Config} */
const sharedConfig = require("ui/tailwind.config.js");

module.exports = {
	presets: [sharedConfig],
	content: [
		"./app/**/*.{ts,tsx}",
		"../../packages/ui/**/*.{js,ts,jsx,tsx}",
		"../../packages/sdk/**/*.{js,ts,jsx,tsx}",
	],
};
