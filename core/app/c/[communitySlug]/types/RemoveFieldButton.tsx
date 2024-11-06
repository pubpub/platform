"use client";

import { useCallback } from "react";

import type { PubFieldsId, PubTypesId } from "db/public";
import { Button } from "ui/button";
import { X } from "ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

import { useServerAction } from "~/lib/serverActions";
import { removePubField } from "./actions";

type Props = {
	pubTypeId: string;
	pubFieldId: string;
	disabled?: boolean;
};

export const RemoveFieldButton = ({ pubFieldId, pubTypeId, disabled }: Props) => {
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
					disabled={disabled}
				>
					<span className="sr-only">Remove field</span>
					<X size={10} />
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>Remove field</p>
			</TooltipContent>
		</Tooltip>
	);
};
