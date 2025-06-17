"use client";

import type { PubsId } from "db/public";
import { Checkbox } from "ui/checkbox";

import { usePubsSelectedContext } from "./PubsSelectedContext";

export const PubSelector = ({ pubId, className }: { pubId: PubsId; className?: string }) => {
	const { isSelected, toggle } = usePubsSelectedContext();

	return (
		<Checkbox
			checked={isSelected(pubId)}
			onCheckedChange={() => {
				toggle(pubId);
			}}
			className={className}
		/>
	);
};
