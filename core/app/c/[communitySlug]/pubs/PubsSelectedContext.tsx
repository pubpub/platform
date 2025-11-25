"use client"

import type { PubsId } from "db/public"
import type { PropsWithChildren } from "react"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

type PubsSelectedContext = {
	isSelected: (pubId: PubsId) => boolean
	toggle: (pubId: PubsId) => void
	selectedPubIds: PubsId[]
}

const PubsSelectedContext = createContext<PubsSelectedContext>({
	isSelected: () => false,
	toggle: () => {},
	selectedPubIds: [],
})

type Props = PropsWithChildren<{
	pubIds: PubsId[]
}>

export const PubsSelectedProvider = (props: Props) => {
	const [selectedPubs, setSelectedPubs] = useState(new Set(props.pubIds))

	const isSelected = useCallback(
		(pubId: PubsId) => {
			return selectedPubs.has(pubId)
		},
		[selectedPubs]
	)

	const toggle = useCallback(
		(pubId: PubsId) => {
			const nextSelectedPubs = new Set(selectedPubs)
			if (nextSelectedPubs.has(pubId)) {
				nextSelectedPubs.delete(pubId)
			} else {
				nextSelectedPubs.add(pubId)
			}
			setSelectedPubs(nextSelectedPubs)
		},
		[selectedPubs]
	)

	const value = useMemo(
		() => ({ isSelected, toggle, selectedPubIds: Array.from(selectedPubs) }),
		[toggle, selectedPubs, isSelected]
	)

	return (
		<PubsSelectedContext.Provider value={value}>{props.children}</PubsSelectedContext.Provider>
	)
}

export const usePubsSelectedContext = () => useContext(PubsSelectedContext)
