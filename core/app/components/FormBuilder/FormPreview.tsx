import type { ProcessedPub } from "contracts"
import type { CoreSchemaType, PubsId } from "db/public"
import type { Form } from "~/lib/server/form"
import type { InputTypeForCoreSchemaType } from "../../../../packages/schemas/src"
import type { HydrateMarkdownResult } from "./actions"

import { useCallback, useEffect, useMemo, useState } from "react"

import { InputComponent, StructuralFormElement } from "db/public"
import { FormDescription, FormItem, FormLabel } from "ui/form"
import { usePubTypeContext } from "ui/pubTypes"
import { toast } from "ui/use-toast"

import { transformRichTextValuesToProsemirrorClient } from "~/lib/editor/serialize-client"
import { didSucceed, useServerAction } from "~/lib/serverActions"
import { ContextEditorContextProvider } from "../ContextEditor/ContextEditorContext"
import { FileUploadPreview } from "../forms/FileUpload"
import { FormElement } from "../forms/FormElement"
import { PubFormProvider } from "../providers/PubFormProvider"
import { PubEditorClient } from "../pubs/PubEditor/PubEditorClient"
import { hydrateMarkdownForPreview } from "./actions"

export type FormPreviewProps = {
	form: Form
	selectedPub?: ProcessedPub<{
		withPubType: true
		withStage: true
		withValues: true
		withRelatedPubs: true
	}>
	children?: React.ReactNode
}

type FileUploadValue = InputTypeForCoreSchemaType<CoreSchemaType.FileUpload>

export const FormPreview = (props: FormPreviewProps) => {
	const onSuccess = () => {
		toast.success("Form saved! (if it was not a preview)")
	}
	const previewPubId = useMemo(() => crypto.randomUUID() as PubsId, [])
	const pubTypes = usePubTypeContext()

	const [hydratedElements, setHydratedElements] = useState<Map<string, string>>(new Map())
	const runHydrate = useServerAction(hydrateMarkdownForPreview)

	const selectedPub = useMemo(() => {
		if (!props.selectedPub) {
			return undefined
		}
		return transformRichTextValuesToProsemirrorClient(
			props.selectedPub as ProcessedPub<{ withPubType: true; withStage: true }>
		)
	}, [props.selectedPub?.id])

	const pubValues = useMemo(() => {
		if (!selectedPub) {
			return []
		}
		return selectedPub.values
	}, [selectedPub])

	// is async, so can't just use useMemo
	const hydrateElements = useCallback(async () => {
		const structuralElements = props.form.elements
			.filter((e) => e.element === StructuralFormElement.p && e.content)
			.map((e) => ({
				content: e.content ?? "",
				element: e.element as typeof StructuralFormElement.p | null,
			}))

		if (!structuralElements.length) {
			return
		}

		const result = await runHydrate(structuralElements, props.selectedPub?.id)
		if (didSucceed(result) && Array.isArray(result)) {
			const newMap = new Map<string, string>()
			for (const item of result as HydrateMarkdownResult[]) {
				newMap.set(item.content, item.hydrated)
			}
			setHydratedElements(newMap)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.form.elements, props.selectedPub?.id])

	useEffect(() => {
		void hydrateElements()
	}, [hydrateElements])

	const elementsWithHydratedContent = useMemo(() => {
		return props.form.elements.map((e) => {
			if (e.element === StructuralFormElement.p && e.content) {
				const hydrated = hydratedElements.get(e.content)
				if (hydrated) {
					return { ...e, content: hydrated }
				} else {
					return {
						...e,
						content: `<div className="h-4 w-full animate-pulse rounded-md bg-accent/70" />`,
					}
				}
			}
			return e
		})
	}, [props.form.elements, hydratedElements])

	return (
		// biome-ignore lint/a11y/noNoninteractiveElementInteractions: i want to prevent enter to submit the form
		// biome-ignore lint/a11y/noStaticElementInteractions: it's not interactive
		<div
			onKeyDown={(evt) => {
				// don't allow enter to submit the form
				if (evt.key === "Enter") {
					evt.preventDefault()
					evt.stopPropagation()
				}
			}}
		>
			<ContextEditorContextProvider
				pubId={previewPubId}
				pubTypeId={props.form.pubTypeId}
				pubTypes={pubTypes}
			>
				<PubFormProvider
					form={{
						pubId: previewPubId,
						form: props.form,
						mode: "edit",
						isExternalForm: false,
					}}
				>
					<PubEditorClient
						withAutoSave={false}
						mode="create"
						formSlug={props.form.slug}
						elements={elementsWithHydratedContent}
						pub={{
							id: previewPubId,
							values: pubValues,
							pubTypeId: props.form.pubTypeId,
						}}
						onSuccess={onSuccess}
						withButtonElements={false}
						handleSubmit={async ({ evt }) => {
							evt?.preventDefault()
							evt?.stopPropagation()
						}}
					>
						{elementsWithHydratedContent.map((e) =>
							e.component === InputComponent.fileUpload ? (
								<DummyFileUpload
									key={e.id}
									files={
										pubValues.find((v) => v.fieldSlug === e.slug)
											?.value as FileUploadValue
									}
									label={e.config.label ?? ""}
									help={e.config.help ?? ""}
								/>
							) : (
								<FormElement
									key={e.id}
									pubId={previewPubId}
									element={e}
									values={pubValues}
								/>
							)
						)}
						{props.children}
					</PubEditorClient>
				</PubFormProvider>
			</ContextEditorContextProvider>
		</div>
	)
}

/**
 * This is a dummy file upload component that is used to preview the file upload field in the form preview.
 * If we were to use the actual FileUpload component, it would be actually uploading the files to the server.
 * It doesn't look the exact same, but it's pretty close
 */
const DummyFileUpload = ({
	files,
	label,
	help,
}: {
	files: FileUploadValue
	label: string
	help: string
}) => {
	const [localFiles, setLocalFiles] = useState<FileUploadValue>(files)
	return (
		<FormItem>
			<FormLabel>{label}</FormLabel>

			<div className="relative h-[250px] w-full rounded-md border bg-accent/70 p-2 dark:border-white!">
				<div className="flex h-full w-full flex-col items-center justify-start border border-dashed bg-accent/70 dark:border-white!">
					<p className="mt-4">
						Drop files here or <span className="text-sky-500">browse files</span>
					</p>
					<input
						type="file"
						multiple
						className="absolute inset-0 opacity-0"
						onChange={(e) => {
							const files = e.target.files
							if (files) {
								setLocalFiles(
									Array.from(files).map((file) => ({
										id: crypto.randomUUID(),
										fileName: file.name,
										fileSource: file.name,
										fileType: file.type,
										fileSize: file.size,
										fileMeta: {
											name: file.name,
											type: file.type,
											relativePath: "<not a real path>",
											absolutePath: "<not a real path>",
										},
										fileUploadUrl: file.name,
										filePreview: file.name,
									}))
								)
							}
						}}
					/>
				</div>
			</div>
			<FormDescription>{help}</FormDescription>
			<FileUploadPreview files={localFiles} />
		</FormItem>
	)
}
