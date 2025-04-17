import type { AstroInlineConfig } from "astro";

import { build } from "astro";

import defaultConfig from "../astro.config.mjs";

// programatic astro building

export const buildAstroSite = async (astroConfig?: Partial<AstroInlineConfig>) => {
	try {
		const config = { ...defaultConfig, ...astroConfig };
		await build(config);
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};
