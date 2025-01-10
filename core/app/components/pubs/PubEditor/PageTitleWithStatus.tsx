"use client";

import { useSaveStatus } from "~/app/components/pubs/PubEditor/SaveStatus";

export const PageTitleWithStatus = ({ title }: { title: string }) => {
	const status = useSaveStatus({ defaultMessage: "Form will save when you click save" });
	return (
		<div className="flex flex-col items-center">
			{title}
			<span className="text-sm font-normal text-muted-foreground" data-testid="save-status">
				{status}
			</span>
		</div>
	);
};
