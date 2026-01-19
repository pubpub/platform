import type { AstroInlineConfig } from "astro"

import { build } from "astro"

import defaultConfig from "../astro.config.mjs"

// programatic astro building

export const buildAstroSite = async (astroConfig?: Partial<AstroInlineConfig>) => {
	try {
		const config = { ...defaultConfig, ...astroConfig } satisfies AstroInlineConfig
		await build(config)
		console.log("AAAAAAAAAAAAAAA")
		return true
	} catch (_error) {
		console.error(_error)
		return false
	}
}
