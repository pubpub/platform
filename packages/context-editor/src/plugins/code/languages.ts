/**
 * Based on https://gitlab.com/emergence-engineering/prosemirror-codemirror-block/-/blob/main/src/languages.ts
 *
 * Differences:
 * * No LegacyLanguages
 * * const array instead of enum
 */

export const CodeBlockLanguages = [
	"javascript",
	"html",
	"css",
	"sql",
	"python",
	"rust",
	"xml",
	"json",
	"markdown",
	"java",
	"cpp",
] as const
