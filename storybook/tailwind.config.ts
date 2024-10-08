import type { Config } from "tailwindcss";

import uiConfig from "ui/tailwind.config.js";

const config: Config = {
	...uiConfig,
	content: [
		// CSS classes that our other packages use
		"../packages/*/src/**/*.{js,ts,jsx,tsx}",
		// CSS classes that our storybook stories themselves use
		"./stories/*.tsx",
	],
};

export default config;
