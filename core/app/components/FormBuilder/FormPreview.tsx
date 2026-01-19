import type { ProcessedPub } from "contracts"
import type { PubsId } from "db/public"
import type { Form } from "~/lib/server/form"
import type { HydrateMarkdownResult } from "./actions"

import { useCallback, useEffect, useMemo, useState } from "react"

import { StructuralFormElement } from "db/public"
import { usePubTypeContext } from "ui/pubTypes"
import { toast } from "ui/use-toast"

import { useCommunity } from "~/app/components/providers/CommunityProvider"
import { transformRichTextValuesToProsemirrorClient } from "~/lib/editor/serialize-client"
import { didSucceed, useServerAction } from "~/lib/serverActions"
import { ContextEditorContextProvider } from "../ContextEditor/ContextEditorContext"
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

export const FormPreview = (props: FormPreviewProps) => {
	const onSuccess = () => {
		toast.success("Form saved! (if it was not a preview)")
	}
	const previewPubId = useMemo(() => crypto.randomUUID() as PubsId, [])
	const pubTypes = usePubTypeContext()
	const _community = useCommunity()

	const [hydratedElements, setHydratedElements] = useState<Map<string, string>>(new Map())
	const runHydrate = useServerAction(hydrateMarkdownForPreview)

	const selectedPub = useMemo(() => {
		if (!props.selectedPub) {
			return undefined
		}
		return props.selectedPub
		return transformRichTextValuesToProsemirrorClient(
			props.selectedPub as ProcessedPub<{ withPubType: true; withStage: true }>
		)
	}, [props.selectedPub])

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
	}, [props.form.elements, props.selectedPub, runHydrate])

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
		<div className="m-4">
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
					>
						{elementsWithHydratedContent.map((e) => (
							<FormElement
								key={e.id}
								pubId={previewPubId}
								element={e}
								values={pubValues}
							/>
						))}
						{props.children}
					</PubEditorClient>
				</PubFormProvider>
			</ContextEditorContextProvider>
		</div>
	)
}
