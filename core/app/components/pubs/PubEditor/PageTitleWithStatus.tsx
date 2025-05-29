"use client";

import { Pencil } from "lucide-react";

import type { SimpleForm } from "~/lib/server/form";
import { useSaveStatus } from "~/app/components/pubs/PubEditor/SaveStatus";
import { FormSwitcher } from "../../FormSwitcher/FormSwitcher";

export const PubPageTitleWithStatus = ({
	title,
	forms,
	defaultFormSlug,
}: {
	title: string | React.ReactNode;
	forms: SimpleForm[];
	defaultFormSlug?: string;
}) => {
	const status = useSaveStatus({ defaultMessage: "Form will save when you click save" });
	return (
		<div className="flex flex-col items-center">
			{title}
			<div
				className="flex items-center gap-2 text-sm font-normal text-muted-foreground"
				data-testid="save-status"
			>
				{status}

				<>
					<div className="mx-1 h-4 border-r border-gray-300"></div>
					<FormSwitcher
						forms={forms}
						defaultFormSlug={defaultFormSlug}
						className="m-0 h-6 bg-none p-0 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-offset-1"
					>
						<Pencil size={14} />
					</FormSwitcher>
				</>
			</div>
		</div>
	);
};
