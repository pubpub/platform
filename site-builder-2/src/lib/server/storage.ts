export const getBuildPath = (community: string, id: string) => {
	return new URL(`../../../.storage/${community}/${id}/pubs-to-build.json`, import.meta.url)
		.pathname
}
