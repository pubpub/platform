import type { ValidationError } from "./types"

import { validateJsonata } from "./languages/jsonata"

export const positionToLineColumn = (
	text: string,
	position: number
): { line: number; column: number } => {
	const lines = text.slice(0, position).split("\n")
	return {
		line: lines.length,
		column: (lines[lines.length - 1]?.length ?? 0) + 1,
	}
}

export const validateJson = (value: string): ValidationError[] => {
	if (!value.trim()) return []

	try {
		JSON.parse(value)
		return []
	} catch (err: unknown) {
		const error = err as { message?: string }
		const match = error.message?.match(/at position (\d+)/)
		const position = match ? parseInt(match[1], 10) : 0
		const { line, column } = positionToLineColumn(value, position)

		return [
			{
				message: error.message ?? "Invalid JSON",
				line,
				column,
				severity: "error",
			},
		]
	}
}

export { validateJsonata }
