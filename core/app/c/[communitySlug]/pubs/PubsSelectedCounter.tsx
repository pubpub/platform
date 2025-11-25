"use client"

import { usePubsSelectedContext } from "./PubsSelectedContext"

export const PubsSelectedCounter = ({ pageSize }: { pageSize: number }) => {
	const { selectedPubIds } = usePubsSelectedContext()

	return (
		<span className="whitespace-nowrap tabular-nums">
			{selectedPubIds.length} of {pageSize} pub(s) selected
		</span>
	)
}
