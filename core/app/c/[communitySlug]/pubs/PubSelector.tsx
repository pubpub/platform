"use client";

import type { PubsId } from "db/public";
import { Button } from "ui/button";
import { Checkbox } from "ui/checkbox";

import { usePubsSelectedContext } from "./PubsSelectedContext";

export const PubSelectorCheckbox = ({
	pubId,
	className,
}: {
	pubId: PubsId;
	className?: string;
}) => {
	const { isSelected, toggle } = usePubsSelectedContext();

	return (
		<Checkbox
			aria-label="Select pub"
			checked={isSelected(pubId)}
			onCheckedChange={() => {
				toggle(pubId);
			}}
			className={className}
		/>
	);
};

export const PubSelectorButton = ({
	pubId,
	className,
	children,
}: {
	pubId: PubsId;
	className?: string;
	children: React.ReactNode;
}) => {
	const { toggle } = usePubsSelectedContext();
	return (
		<Button variant="ghost" className={className} onClick={() => toggle(pubId)}>
			{children}
		</Button>
	);
};
