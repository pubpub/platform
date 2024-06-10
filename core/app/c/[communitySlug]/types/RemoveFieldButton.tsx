"use client";

import { useCallback } from "react";

import { Button } from "ui/button";
import { Trash } from "ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";

import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import type { PubTypesId } from "~/kysely/types/public/PubTypes";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { removePubField } from "./actions";

type Props = {
	pubTypeId: string;
	pubFieldId: string;
};

export const RemoveFieldButton = ({ pubFieldId, pubTypeId }: Props) => {
	const runRemoveField = useServerAction(removePubField);
	const handleRemove = useCallback(async () => {
		const result = await runRemoveField(pubTypeId as PubTypesId, pubFieldId as PubFieldsId);
		if (didSucceed(result)) {
			// delete from parent
		}
	}, []);
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="secondary"
						size="sm"
						className="flex gap-2"
						onClick={handleRemove}
					>
						<Trash size={14} />
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>Remove field</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};
