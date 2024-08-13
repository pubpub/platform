"use client";

import { useSearchParams } from "next/navigation";

import { CircleHelp } from "ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

import { formatDateAsTime } from "~/lib/dates";
import { SAVE_STATUS_QUERY_PARAM, SUBMIT_ID_QUERY_PARAM } from "./constants";

export const SaveStatus = () => {
	const searchParams = useSearchParams();
	const urlSearchParams = new URLSearchParams(searchParams ?? undefined);

	const submitId = urlSearchParams.get(SUBMIT_ID_QUERY_PARAM);
	const saveStatus = urlSearchParams.get(SAVE_STATUS_QUERY_PARAM);
	let status = "Progress will be automatically saved";
	if (submitId) {
		status = "Completed";
	} else if (saveStatus) {
		const queryAsNumber = +saveStatus;
		if (!isNaN(queryAsNumber)) {
			const lastSavedTime = new Date(queryAsNumber);
			status = `Last saved at ${formatDateAsTime(lastSavedTime)}`;
		}
	}

	return (
		<div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
			<span>{status}</span>
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
		</div>
	);
};
