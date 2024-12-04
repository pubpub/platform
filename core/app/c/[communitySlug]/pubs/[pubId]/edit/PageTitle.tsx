"use client";

import { useSaveStatus } from "~/app/components/pubs/PubEditor/SaveStatus";

export const PageTitle = () => {
	const status = useSaveStatus({ defaultMessage: "Form will save when you click save" });
	return (
		<div className="flex flex-col items-center">
			Edit pub
			<span className="text-sm font-normal text-muted-foreground">{status}</span>
		</div>
	);
};
