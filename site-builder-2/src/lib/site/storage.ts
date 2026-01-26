import { readFile } from "node:fs/promises"

import { SITE_ENV } from "./env"

export const getBuildPath = (community: string, id: string) => {
	return new URL(`../../../../.storage/${community}/${id}/pubs-to-build.json`, import.meta.url)
		.pathname
}

export const getPubsToBuild = async () => {
	const automationRunId = SITE_ENV.AUTOMATION_RUN_ID
	const community = SITE_ENV.COMMUNITY_SLUG

	const path = getBuildPath(community, automationRunId)
	const file = await readFile(path)
	try {
		return JSON.parse(file.toString())
	} catch (error) {
		console.error(`Error parsing pubs-to-build.json: ${error}`)
		return []
	}
}
