"use client";

import { useCallback } from "react";

import { Button } from "ui/button";
import { X } from "ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import type { PubTypesId } from "~/kysely/types/public/PubTypes";
import { useServerAction } from "~/lib/serverActions";
import { removePubField } from "./actions";

type Props = {
	pubTypeId: string;
	pubFieldId: string;
};

export const RemoveFieldButton = ({ pubFieldId, pubTypeId }: Props) => {
	const runRemoveField = useServerAction(removePubField);
	const handleRemove = useCallback(async () => {
		await runRemoveField(pubTypeId as PubTypesId, pubFieldId as PubFieldsId);
	}, [pubTypeId, pubFieldId]);
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="secondary"
					size="sm"
					className="flex h-5 gap-2 px-2"
					onClick={handleRemove}
				>
					<X size={10} />
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>Remove field</p>
			</TooltipContent>
		</Tooltip>
	);
};
