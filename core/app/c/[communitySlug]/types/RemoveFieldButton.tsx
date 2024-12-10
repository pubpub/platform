"use client";

import { useCallback } from "react";

import type { PubFieldsId, PubTypesId } from "db/public";
import { Button } from "ui/button";
import { X } from "ui/icon";
import { ToastAction } from "ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { toast } from "ui/use-toast";

import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { defaultFormSlug } from "~/lib/form";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { removePubField } from "./actions";

type Props = {
	pubTypeId: string;
	pubTypeName: string;
	pubFieldId: string;
	disabled?: boolean;
};

export const RemoveFieldButton = ({ pubFieldId, pubTypeId, disabled, pubTypeName }: Props) => {
	const community = useCommunity();
	const runRemoveField = useServerAction(removePubField);
	const handleRemove = useCallback(async () => {
		const result = await runRemoveField(pubTypeId as PubTypesId, pubFieldId as PubFieldsId);
		if (didSucceed(result)) {
			toast({
				title: "Field removed successfully",
				duration: 10000,
				description: (
					<>
						This update will not be automatically reflected in the default editor form
						for <span className="italic">{pubTypeName}</span> unless you manually update
						it.
					</>
				),
				action: (
					<ToastAction altText="Manually update the default editor form.">
						<a href={`/c/${community.slug}/forms/${defaultFormSlug(pubTypeName)}/edit`}>
							Update form
						</a>
					</ToastAction>
				),
			});
		}
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
