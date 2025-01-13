import fuzzy from "fuzzy"

import initialPubs from "./initialPubs.json"

export const getPubs = async (filter: string) => {
	return fuzzy
		.filter(filter || "", initialPubs, {
			extract: (el) => {
				return el.values["rd:title"]
			},
		})
		.map((result) => result.original)
}
