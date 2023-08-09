// tailwind config is required for editor support

const sharedConfig = require("tailwind-config/tailwind.config.js");

module.exports = {
	content: [
		"app/**/*.{ts,tsx}",
		// include packages if not transpiling
		// "../../packages/**/*.{js,ts,jsx,tsx}",
	],
	presets: [sharedConfig],
};
