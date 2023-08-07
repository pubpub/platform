import { defineConfig } from "vite"
// @ts-ignore
import postcss from "./postcss.config"

export default defineConfig({
	css: {
		postcss,
	},
})
