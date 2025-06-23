import type { Preview } from "@storybook/nextjs-vite";

import { INITIAL_VIEWPORTS } from "storybook/viewport";

// Import our tailwind styles
import "ui/styles.css";

const preview: Preview = {
	parameters: {
		nextjs: {
			appDirectory: true,
		},
		viewport: {
			options: INITIAL_VIEWPORTS,
		},
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
};

export default preview;
