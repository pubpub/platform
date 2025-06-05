"use client";

import { usePubsSelectedContext } from "./PubsSelectedContext";

export const PubsSelectedCounter = ({ pageSize }: { pageSize: number }) => {
	const { numSelected } = usePubsSelectedContext();

	return (
		<span className="whitespace-nowrap tabular-nums">
			{numSelected} of {pageSize} pub(s) selected
		</span>
	);
};
