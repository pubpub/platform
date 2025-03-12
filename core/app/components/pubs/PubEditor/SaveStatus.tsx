"use client";

import { useSearchParams } from "next/navigation";

import { CircleHelp } from "ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

import { formatDateAsTime } from "~/lib/dates";
import { SAVE_STATUS_QUERY_PARAM, SUBMIT_ID_QUERY_PARAM } from "./constants";

export const useSaveStatus = ({ defaultMessage }: { defaultMessage?: string }) => {
	const searchParams = useSearchParams();
	const urlSearchParams = new URLSearchParams(searchParams ?? undefined);

	const submitId = urlSearchParams.get(SUBMIT_ID_QUERY_PARAM);
	const saveStatus = urlSearchParams.get(SAVE_STATUS_QUERY_PARAM);

	let status = defaultMessage;

	if (submitId) {
		status = "Completed";
	} else if (saveStatus) {
		const queryAsNumber = +saveStatus;
		if (!isNaN(queryAsNumber)) {
			const lastSavedTime = new Date(queryAsNumber);
			status = `Last saved at ${formatDateAsTime(lastSavedTime)}`;
		}
	}

	return status;
};

export const SaveStatus = ({ autosave }: { autosave?: boolean }) => {
	const defaultMessage = autosave
		? "Progress will be automatically saved"
		: "Form will save when you click submit";
	const status = useSaveStatus({ defaultMessage });

	return (
		<div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
			<span>{status}</span>
			{autosave ? (
				<Tooltip>
					<TooltipContent side="bottom" className="w-60 text-sm">
						Bookmark this page to return to your saved progress anytime.
					</TooltipContent>
					<TooltipTrigger asChild>
						<div>
							<span className="sr-only">More info</span>
							<CircleHelp size={16} />
						</div>
					</TooltipTrigger>
				</Tooltip>
			) : null}
		</div>
	);
};
