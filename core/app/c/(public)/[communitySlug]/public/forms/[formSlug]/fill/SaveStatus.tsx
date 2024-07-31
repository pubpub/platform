"use client";

import { useSearchParams } from "next/navigation";

import { CircleHelp } from "ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

import { formatDateAsTime } from "~/lib/dates";

export const SAVE_TIME_QUERY_PARAM = "saveTime";

export const SaveStatus = () => {
	const searchParams = useSearchParams();
	const urlSearchParams = new URLSearchParams(searchParams ?? undefined);

	const queryParam = urlSearchParams.get(SAVE_TIME_QUERY_PARAM);
	let lastSavedTime;
	if (queryParam) {
		const queryAsNumber = +queryParam;
		if (!isNaN(queryAsNumber)) {
			lastSavedTime = new Date(queryAsNumber);
		}
	}

	return (
		<div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
			<span>
				{lastSavedTime
					? `Last saved at ${formatDateAsTime(lastSavedTime)}`
					: `Progress will be automatically saved`}
			</span>
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
