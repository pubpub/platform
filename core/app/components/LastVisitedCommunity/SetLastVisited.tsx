"use client"

import { useEffect } from "react"

import { LAST_VISITED_COOKIE, LAST_VISITED_COOKIE_MAX_AGE } from "./constants"

export default function SetLastVisited({ communitySlug }: { communitySlug: string }) {
	useEffect(() => {
		document.cookie = `${LAST_VISITED_COOKIE}=${communitySlug}; path=/; max-age=${LAST_VISITED_COOKIE_MAX_AGE}`
	}, [communitySlug])

	return <></>
}
