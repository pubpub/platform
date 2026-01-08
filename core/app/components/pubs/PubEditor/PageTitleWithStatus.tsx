"use client"

import type { SimpleForm } from "~/lib/server/form"

import { Pencil } from "lucide-react"

import { useSaveStatus } from "~/app/components/pubs/PubEditor/SaveStatus"
import { FormSwitcher } from "../../FormSwitcher/FormSwitcher"

export const PubPageStatus = ({
	forms,
	defaultFormSlug,
}: {
	forms: SimpleForm[]
	defaultFormSlug?: string
}) => {
	const status = useSaveStatus({ defaultMessage: "Form will save when you click save" })
	return (
		<div className="flex items-center gap-2 font-normal text-muted-foreground text-sm">
			<span data-testid="save-status-text">{status}</span>

			<div className="mx-1 h-4 border-gray-300 border-r"></div>
			<FormSwitcher
				forms={forms}
				defaultFormSlug={defaultFormSlug}
				className="m-0 h-6 bg-none p-0 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-offset-1"
			>
				<Pencil size={14} />
			</FormSwitcher>
		</div>
	)
}
