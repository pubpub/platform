import type { FormElements } from "db/public"
import { StructuralFormElement } from "db/public"

import type { RenderWithPubContext } from "~/lib/server/render/pub/renderWithPubUtils"
import {
	renderMarkdownAsHtml,
	renderMarkdownWithPub,
} from "~/lib/server/render/pub/renderMarkdownWithPub"

/**
 * Converts an individual form element in place into HTMl that can be rendered.
 * Can also render with pub context.
 */
export const renderElementMarkdownContent = async (
	element: Pick<FormElements, "content">,
	renderWithPubContext: RenderWithPubContext | undefined
) => {
	if (element.content === null) {
		return ""
	}
	if (renderWithPubContext) {
		// Parses the markdown with the pub and returns as HTML
		return renderMarkdownWithPub(element.content, renderWithPubContext).catch(
			() => element.content
		)
	}
	return renderMarkdownAsHtml(element.content)
}

/**
 * Converts in place any structural elements to HTMl that can be rendered.
 * Can also render with pub context.
 * */
export const hydrateMarkdownElements = async ({
	elements,
	renderWithPubContext,
}: {
	elements: Pick<FormElements, "element" | "content">[]
	renderWithPubContext: RenderWithPubContext | undefined
}) => {
	const elementsWithMarkdownContent = elements.filter(
		(element) => element.element === StructuralFormElement.p
	)
	await Promise.all(
		elementsWithMarkdownContent.map(async (element) => {
			element.content = await renderElementMarkdownContent(element, renderWithPubContext)
		})
	)
}
