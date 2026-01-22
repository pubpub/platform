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
	const status = useSaveStatus({ defaultMessage: "Save form to keep changes" })
	return (
		<div className="flex max-w-full items-center gap-2 font-normal text-muted-foreground text-sm">
			<span
				data-testid="save-status-text"
				className="inline-block max-w-full truncate whitespace-nowrap text-xs md:text-sm"
			>
				{status}
			</span>

			<div className="mx-1 h-4 border-gray-300 border-r"></div>
			<FormSwitcher
				forms={forms}
				defaultFormSlug={defaultFormSlug}
				// i hate figuring out how to do truncation!
				// modify with care!
				className="m-0 line-clamp-1 flex h-6 max-w-full items-center bg-none p-0 text-xs shadow-none focus-visible:ring-2 focus-visible:ring-offset-1 md:text-sm"
			>
				<Pencil size={14} className="size-3 md:size-4" />
			</FormSwitcher>
		</div>
	)
}
