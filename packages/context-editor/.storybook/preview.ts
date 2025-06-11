import type { Preview } from "@storybook/nextjs-vite";

import "../src/tailwind.css";
import "../src/style.css";

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
};

export default preview;
