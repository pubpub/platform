import { useMutation } from "@tanstack/react-query"
import { Plus, X } from "lucide-react"
import { useTheme } from "next-themes"
import { useFieldArray, useWatch } from "react-hook-form"

import { Button } from "ui/button"
import { FieldLabel, FieldSet } from "ui/field"
import { MonacoFormField } from "ui/monaco"
import { usePubFieldContext } from "ui/pubFields"

import { useServerAction } from "~/lib/serverActions"
import { ActionField } from "../_lib/ActionField"
import { useActionForm } from "../_lib/ActionForm"
import { previewResult } from "./formActions"

export default function BuildJournalSiteActionForm() {
	const { form } = useActionForm()

	const _pubFields = usePubFieldContext()

	const { append, remove } = useFieldArray({
		control: form.control,
		name: "pages",
	})

	const fields = useWatch({ control: form.control, name: "pages" }) ?? []

	const { resolvedTheme } = useTheme()
	const theme = resolvedTheme as "light" | "dark"

	const handlePreview = useServerAction(previewResult)

	const {
		mutate: handlePreviewMutation,
		data: previewData,
		isPending: isPreviewPending,
	} = useMutation({
		mutationFn: handlePreview,
	})

	return (
		<FieldSet>
			{fields.map((_field, index) => (
				<div key={index} className="flex flex-col gap-y-2">
					<div className="flex flex-row items-center justify-between space-x-2">
						<FieldLabel>Page Group {index + 1}</FieldLabel>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => {
								const newPages = fields.filter((_f, idx) => idx !== index)
								form.setValue(`pages`, newPages)
							}}
						>
							<X size={16} />
						</Button>
					</div>
					<ActionField
						name={`pages.${index}.filter`}
						label="Filter"
						render={({ field }) => (
							<MonacoFormField field={field} language="jsonata" theme={theme} />
						)}
					/>
					<ActionField
						name={`pages.${index}.slug`}
						label="Slug"
						render={({ field }) => (
							<MonacoFormField field={field} language="jsonata" theme={theme} />
						)}
					/>
					<ActionField
						name={`pages.${index}.transform`}
						label="Transform"
						render={({ field }) => (
							<MonacoFormField field={field} language="jsonata" theme={theme} />
						)}
					/>
					<Button
						type="button"
						variant="secondary"
						onClick={() =>
							handlePreviewMutation({
								slug: form.getValues(`pages.${index}.slug`),
								filter: form.getValues(`pages.${index}.filter`),
								transform: form.getValues(`pages.${index}.transform`),
								automationRunId: form.getValues(`automationRunId`),
							})
						}
					>
						Preview
					</Button>
					{isPreviewPending && <p>Previewing...</p>}
					{previewData && <pre>{JSON.stringify(previewData, null, 2)}</pre>}
				</div>
			))}
			<Button
				variant="secondary"
				type="button"
				onClick={() => append({ filter: "", transform: "" })}
			>
				<Plus size={16} />
			</Button>
		</FieldSet>
	)
}
