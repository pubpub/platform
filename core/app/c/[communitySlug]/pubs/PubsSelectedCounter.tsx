"use client";

import { usePubsSelectedContext } from "./PubsSelectedContext";

export const PubsSelectedCounter = ({ pageSize }: { pageSize: number }) => {
	const { selectedPubIds } = usePubsSelectedContext();

	return (
		<span className="hidden whitespace-nowrap tabular-nums md:block">
			{selectedPubIds.length} of {pageSize} pub(s) selected
		</span>
	);
};
