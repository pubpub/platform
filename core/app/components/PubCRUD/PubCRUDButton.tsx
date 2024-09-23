"use client";

import { Button } from "ui/button";
import { cn } from "utils";

import type { PubCRUDSearchParamProps } from "./pubCRUDSearchParam";
import { useSearchParamModal } from "~/lib/client/useSearchParamModal";
import { CRUDMap } from "./CRUDMap";
import { createPubCRUDSearchParam } from "./pubCRUDSearchParam";

export type CRUDButtonProps = {
	title?: string | null;
	variant?: "secondary" | "outline" | "ghost" | "default" | "destructive";
	size?: "sm" | "default" | "lg" | "icon";
	className?: string;
};

export const PubCRUDButton = ({
	method,
	identifyingString,
	...button
}: PubCRUDSearchParamProps & CRUDButtonProps) => {
	const pubSearchParam = createPubCRUDSearchParam({
		method,
		identifyingString,
	});
	const crud = CRUDMap[method];

	const { toggleModal } = useSearchParamModal({ identifyingString: pubSearchParam });
	return (
		<Button
			onClick={() => toggleModal(true)}
			variant={button?.variant ?? "outline"}
			size={button?.size ?? "sm"}
			className={cn("flex items-center gap-x-2 py-4", button?.className)}
		>
			<crud.icon size="12" className="mb-0.5" />
			{button?.title === null ? null : <span>{button?.title ?? crud.buttonText}</span>}
		</Button>
	);
};
