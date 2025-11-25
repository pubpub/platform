import jsonata from "jsonata"

interface InterpolationBlock {
	expression: string
	startIndex: number
	endIndex: number
}

/**
 * parses template string to find all {{ }} interpolation blocks
 */
function parseInterpolations(template: string): InterpolationBlock[] {
	const blocks: InterpolationBlock[] = []
	let i = 0

	while (i < template.length) {
		// look for opening {{
		if (template[i] === "{" && template[i + 1] === "{") {
			const startIndex = i
			i += 2 // skip past {{

			let braceDepth = 0
			let expression = ""
			let foundClosing = false

			while (i < template.length) {
				const char = template[i]
				const nextChar = template[i + 1]

				// check for closing }}
				if (char === "}" && nextChar === "}" && braceDepth === 0) {
					foundClosing = true
					blocks.push({
						expression: expression.trim(),
						startIndex,
						endIndex: i + 2,
					})
					i += 2 // skip past }}
					break
				}

				if (char === "{") {
					braceDepth++
				} else if (char === "}") {
					braceDepth--
				}

				expression += char
				i++
			}

			if (!foundClosing) {
				throw new Error(`unclosed interpolation block starting at position ${startIndex}`)
			}
		} else {
			i++
		}
	}

	return blocks
}

const determineMode = (template: string): "template" | "jsonata" => {
	if (template.includes("{{")) {
		return "template"
	}

	return "jsonata"
}

/**
 * interpolates JSONata expressions in a template string
 *
 * @param template - template string with {{ $.expression }} placeholders or pure JSONata expression
 * @param data - data to evaluate expressions against
 * @param mode - "template" for {{ }} interpolation (always returns string), "jsonata" for pure JSONata (returns any type)
 * @returns interpolated result (string for template mode, any JSON type for jsonata mode)
 */
export async function interpolate(template: string, data: unknown): Promise<unknown> {
	const mode = determineMode(template)

	// jsonata mode: evaluate entire input as pure JSONata expression
	if (mode === "jsonata") {
		const expression = jsonata(template)
		const result = await expression.evaluate(data)

		if (result === undefined) {
			throw new Error(`expression '${template}' returned undefined`)
		}

		// jsonata sequences have a non-enumerable `sequence` property
		// convert to plain array to avoid issues with deep equality checks
		if (Array.isArray(result) && (result as any).sequence === true) {
			return [...result]
		}

		return result
	}

	// template mode: parse {{ }} blocks and return string
	const blocks = parseInterpolations(template)

	if (blocks.length === 0) {
		return template
	}

	let result = template

	// process blocks in reverse order to maintain correct indices for multiple interpolations
	// otherwise wed have to offset the indices of all the blocks after the current one
	for (let i = blocks.length - 1; i >= 0; i--) {
		const block = blocks[i]
		const expression = jsonata(block.expression)
		const value = await expression.evaluate(data)

		if (value === undefined) {
			throw new Error(`expression '${block.expression}' returned undefined`)
		}

		// in template mode, we always convert values to strings
		let stringValue: string
		if (typeof value === "string") {
			stringValue = value
		} else {
			stringValue = JSON.stringify(value)
		}

		result = result.slice(0, block.startIndex) + stringValue + result.slice(block.endIndex)
	}

	return result
}
