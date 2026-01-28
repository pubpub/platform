import { useEffect, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { ArrowRight, FileText, Link2, Plus, X } from "lucide-react"
import { useTheme } from "next-themes"
import { useFieldArray, useWatch } from "react-hook-form"

import { Button } from "ui/button"
import { FieldDescription, FieldLabel, FieldSet } from "ui/field"
import { MonacoFormField } from "ui/monaco"
import { FieldOutputMap } from "ui/outputMap"
import { usePubFieldContext } from "ui/pubFields"
import { usePubTypeContext } from "ui/pubTypes"
import { QueryBuilder } from "ui/queryBuilder"

import { useServerAction } from "~/lib/serverActions"
import { ActionField } from "../_lib/ActionField"
import { useActionForm } from "../_lib/ActionForm"
import { previewResult } from "./formActions"

export default function BuildJournalSiteActionForm() {
	const { form, path } = useActionForm()

	const pagesPath = path ? `${path}.pages` : "pages"

	const pubFields = usePubFieldContext()
	const pubTypes = usePubTypeContext()

	useEffect(() => {
		if (!form.getValues("outputMap")) {
			form.setValue("outputMap", [])
		}
	}, [form])

	const { append, remove } = useFieldArray({
		control: form.control,
		name: pagesPath,
	})

	const fields = useWatch({ control: form.control, name: pagesPath }) ?? []
	console.log("fields", fields)

	const { resolvedTheme } = useTheme()
	const theme = resolvedTheme as "light" | "dark"

	const handlePreview = useServerAction(previewResult)

	const {
		mutate: handlePreviewMutation,
		data: previewData,
		isPending: isPreviewPending,
		error: previewError,
	} = useMutation({
		mutationFn: handlePreview,
	})

	const [activePreviewIndex, setActivePreviewIndex] = useState<number | null>(null)

	return (
		<FieldSet>
			<ActionField
				name="subpath"
				label="Deployment Subpath"
				description="URL subpath where the site will be deployed (e.g., 'journal-2024'). If not set, uses the automation run ID."
			/>

			{fields.map((_field, index) => (
				<div
					key={index}
					className="flex flex-col gap-y-4 rounded-lg border border-border bg-card p-4"
				>
					<div className="flex flex-row items-center justify-between">
						<div className="flex items-center gap-2">
							<FileText className="h-4 w-4 text-muted-foreground" />
							<FieldLabel className="mb-0">Page Group {index + 1}</FieldLabel>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-muted-foreground hover:text-destructive"
							onClick={() => {
								const newPages = fields.filter((_f, idx) => idx !== index)
								form.setValue(`pages`, newPages)
							}}
						>
							<X size={16} />
						</Button>
					</div>

					<div className="rounded-md border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
						<div className="mb-2 flex items-center gap-2">
							<span className="rounded bg-blue-100 px-1.5 py-0.5 font-medium text-blue-800 text-xs dark:bg-blue-900 dark:text-blue-200">
								Source
							</span>
							<span className="text-blue-700 text-xs dark:text-blue-300">
								Which pubs to include
							</span>
						</div>
						<ActionField
							name={`pages.${index}.filter`}
							render={({ field }) => (
								<QueryBuilder
									value={field.value ?? ""}
									onChange={field.onChange}
									pubFields={pubFields}
									pubTypes={pubTypes}
									theme={theme}
									placeholder="e.g. $.pub.pubType.name = 'Article'"
								/>
							)}
						/>
					</div>

					<div className="flex items-center justify-center">
						<ArrowRight className="h-4 w-4 text-muted-foreground" />
					</div>

					<div className="rounded-md border border-green-200 bg-green-50/50 p-3 dark:border-green-800 dark:bg-green-950/20">
						<div className="mb-2 flex items-center gap-2">
							<Link2 className="h-3 w-3 text-green-700 dark:text-green-300" />
							<span className="rounded bg-green-100 px-1.5 py-0.5 font-medium text-green-800 text-xs dark:bg-green-900 dark:text-green-200">
								URL Slug
							</span>
							<span className="text-green-700 text-xs dark:text-green-300">
								Outputs a string
							</span>
						</div>
						<FieldDescription className="mb-2 text-green-600 text-xs dark:text-green-400">
							Expression evaluated for each pub to generate its URL path
						</FieldDescription>
						<ActionField
							name={`pages.${index}.slug`}
							render={({ field }) => (
								<MonacoFormField field={field} language="jsonata" theme={theme} />
							)}
						/>
					</div>

					<div className="rounded-md border border-purple-200 bg-purple-50/50 p-3 dark:border-purple-800 dark:bg-purple-950/20">
						<div className="mb-2 flex items-center gap-2">
							<FileText className="h-3 w-3 text-purple-700 dark:text-purple-300" />
							<span className="rounded bg-purple-100 px-1.5 py-0.5 font-medium text-purple-800 text-xs dark:bg-purple-900 dark:text-purple-200">
								Content Transform
							</span>
							<span className="text-purple-700 text-xs dark:text-purple-300">
								Outputs the page data
							</span>
						</div>
						<FieldDescription className="mb-2 text-purple-600 text-xs dark:text-purple-400">
							Expression evaluated for each pub to generate its page content
						</FieldDescription>
						<ActionField
							name={`pages.${index}.transform`}
							render={({ field }) => (
								<MonacoFormField field={field} language="jsonata" theme={theme} />
							)}
						/>
					</div>

					<Button
						type="button"
						variant="outline"
						size="sm"
						className="self-start"
						disabled={isPreviewPending && activePreviewIndex === index}
						onClick={() => {
							setActivePreviewIndex(index)
							handlePreviewMutation({
								slug: fields[index].slug ?? "",
								filter: fields[index].filter ?? "",
								transform: fields[index].transform ?? "",
								automationRunId: form.getValues(`automationRunId`) ?? "",
							})
						}}
					>
						{isPreviewPending && activePreviewIndex === index
							? "Loading..."
							: "Preview (first 5 pubs)"}
					</Button>
					{previewError && activePreviewIndex === index && (
						<p className="text-destructive text-sm">
							Preview failed: {previewError.message}
						</p>
					)}
					{previewData && activePreviewIndex === index && (
						<div className="rounded-md border border-border bg-muted/50 p-2">
							<p className="mb-2 font-medium text-muted-foreground text-xs">
								Preview results ({previewData.pubs?.length ?? 0} pubs)
							</p>
							<pre className="max-h-[200px] overflow-auto text-xs">
								{JSON.stringify(previewData.pubs, null, 2)}
							</pre>
						</div>
					)}
				</div>
			))}
			<Button
				variant="outline"
				type="button"
				onClick={() => append({ filter: "", slug: "", transform: "" })}
			>
				<Plus size={16} className="mr-1" />
				Add Page Group
			</Button>

			<ActionField
				name="outputMap"
				render={({ field }) => <FieldOutputMap form={form} fieldName={field.name} />}
			/>
		</FieldSet>
	)
}
