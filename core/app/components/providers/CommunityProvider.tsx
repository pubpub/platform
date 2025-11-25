"use client"

import type { CommunityData } from "~/lib/server/community"

import { createContext, useContext } from "react"

type Props = {
	children: React.ReactNode
	community: CommunityData
}

const CommunityContext = createContext<CommunityData>(undefined)

export function CommunityProvider({ children, community }: Props) {
	return <CommunityContext.Provider value={community}>{children}</CommunityContext.Provider>
}

export const useCommunity = () => {
	const community = useContext(CommunityContext)
	if (!community) {
		throw new Error("Community context used without provider")
	}
	return community
}
