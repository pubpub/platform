"use client";

import type { PubsId } from "db/public";
import { Checkbox } from "ui/checkbox";

import { usePubsSelectedContext } from "./PubsSelectedContext";

export const PubSelector = ({ pubId }: { pubId: PubsId }) => {
	const { isSelected, toggle } = usePubsSelectedContext();

	return (
		<Checkbox
			checked={isSelected(pubId)}
			onCheckedChange={() => {
				toggle(pubId);
			}}
		/>
	);
};
