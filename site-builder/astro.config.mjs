// @ts-check
import react from "@astrojs/react"
import tailwind from "@astrojs/tailwind"
// import pdf from "astro-pdf";
import { defineConfig } from "astro/config"

// https://astro.build/config
export default defineConfig({
	vite: {
		ssr: {
			external: ["db"],
		},
	},
	integrations: [
		react(),
		tailwind({
			applyBaseStyles: true,
			configFile: "./tailwind.config.mjs",
		}),

		// pdf({
		// 	baseOptions: {
		// 		path: "/pdf[pathname].pdf",
		// 		navTimeout: 60000,
		// 		maxRetries: 3,

		// 	},
		// 	maxConcurrent: 10,

		// 	pages: (pathname) => {
		// 		if (pathname.includes("/pub") && !pathname.includes("/release")) {
		// 			return true;
		// 		}
		// 		return false;
		// 	},
		// }),
	],
	prefetch: true,
})
