"use client";

import { useCallback } from "react";

import type { PubTypesId } from "db/public/PubTypes";
import { Button } from "ui/button";
import { Trash } from "ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

import { useServerAction } from "~/lib/serverActions";
import { removePubType } from "./actions";

type Props = {
	pubTypeId: string;
};

export const RemoveTypeButton = ({ pubTypeId }: Props) => {
	const runRemoveType = useServerAction(removePubType);
	const handleRemove = useCallback(async () => {
		await runRemoveType(pubTypeId as PubTypesId);
	}, [pubTypeId]);
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button variant="secondary" size="sm" className="flex gap-2" onClick={handleRemove}>
					<Trash size={12} />
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>Remove type</p>
			</TooltipContent>
		</Tooltip>
	);
};
