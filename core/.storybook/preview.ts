import type { Preview } from "@storybook/nextjs-vite"

// Import our tailwind styles
import "ui/styles.css"

const preview: Preview = {
	parameters: {
		nextjs: {
			appDirectory: true,
		},
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
}

export default preview
