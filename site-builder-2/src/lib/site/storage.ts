import { readFile } from "node:fs/promises"

import { SITE_ENV } from "./env"

export const getBuildPath = (community: string, id: string) => {
	return new URL(`../../../../.storage/${community}/${id}/pubs-to-build.json`, import.meta.url)
		.pathname
}

type PageData = {
	pages: { slug: string; title: string; id: string; content: string }[]
	transform: string
}

type BuildData = {
	pages: PageData[]
	css: string
}

let cachedBuildData: BuildData | null = null

const loadBuildData = async (): Promise<BuildData> => {
	if (cachedBuildData) {
		return cachedBuildData
	}

	const automationRunId = SITE_ENV.AUTOMATION_RUN_ID
	const community = SITE_ENV.COMMUNITY_SLUG

	const path = getBuildPath(community, automationRunId)
	const file = await readFile(path)
	try {
		const data = JSON.parse(file.toString())
		// handle both old format (array) and new format (object with pages and css)
		if (Array.isArray(data)) {
			cachedBuildData = { pages: data, css: "" }
		} else {
			cachedBuildData = data as BuildData
		}
		return cachedBuildData
	} catch (_error) {
		return { pages: [], css: "" }
	}
}

export const getPubsToBuild = async () => {
	const data = await loadBuildData()
	return data.pages
}

export const getSiteCss = async () => {
	const data = await loadBuildData()
	return data.css
}
