import type { LegacyStructure } from "./legacy-migration"
import type { LayoutBlock } from "./schemas"

import { logger } from "logger"

import { transformProsemirrorTree } from "./prosemirror"

const processTextBlock = (block: LayoutBlock) => {
	if (block.type === "text") {
		return block.content.text?.content ?? []
	}

	return []
}

export const transformLayoutBlocks = (
	_parentId: string,
	blocks: LayoutBlock[],
	_legacyStructure: LegacyStructure
) => {
	const prosemirrorBody = {
		type: "doc",
		content: [] as any[],
	}

	for (const block of blocks) {
		switch (block.type) {
			case "text":
				prosemirrorBody.content.push(...processTextBlock(block))
				break
			case "collection-header":
				//  TODO:
				logger.warn("Collection header not yet implemented")
				break
			case "pubs":
				// TODO:
				logger.warn("Pubs not yet implemented")
				break
			case "html":
				// TODO:
				logger.warn("HTML block not yet implemented")
				break
			case "submission-banner":
				// TODO:
				logger.warn("Submission banner not yet implemented")
				break
			case "banner":
				// TODO:
				logger.warn("Banner not yet implemented")
				break
			case "collections-pages":
				// TODO:
				logger.warn("Collections pages not yet implemented")
				break
			default: {
				const _exhaustiveCheck: never = block
				break
			}
		}
	}

	const { doc } = transformProsemirrorTree(prosemirrorBody)

	return doc
}
