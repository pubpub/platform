import JSON5 from "json5";
import jsonata from "jsonata";

interface InterpolationBlock {
	expression: string;
	startIndex: number;
	endIndex: number;
}

/**
 * parses template string to find all {{ }} interpolation blocks
 */
function parseInterpolations(template: string): InterpolationBlock[] {
	const blocks: InterpolationBlock[] = [];
	let i = 0;

	while (i < template.length) {
		// look for opening {{
		if (template[i] === "{" && template[i + 1] === "{") {
			const startIndex = i;
			i += 2; // skip past {{

			let braceDepth = 0;
			let expression = "";
			let foundClosing = false;

			while (i < template.length) {
				const char = template[i];
				const nextChar = template[i + 1];

				// check for closing }}
				if (char === "}" && nextChar === "}" && braceDepth === 0) {
					foundClosing = true;
					blocks.push({
						expression: expression.trim(),
						startIndex,
						endIndex: i + 2,
					});
					i += 2; // skip past }}
					break;
				}

				if (char === "{") {
					braceDepth++;
				} else if (char === "}") {
					braceDepth--;
				}

				expression += char;
				i++;
			}

			if (!foundClosing) {
				throw new Error(`unclosed interpolation block starting at position ${startIndex}`);
			}
		} else {
			i++;
		}
	}

	return blocks;
}

/**
 * checks if its something like `"Hello {{ $.name }}"`, vs just a plain `{{ $.name }}`
 */
function isStringTemplate(template: string): boolean {
	const trimmed = template.trim();
	return trimmed.startsWith('"') && trimmed.endsWith('"');
}

function isSingleRawInterpolation(template: string, blocks: InterpolationBlock[]): boolean {
	if (blocks.length !== 1) {
		return false;
	}

	const block = blocks[0];
	const before = template.slice(0, block.startIndex).trim();
	const after = template.slice(block.endIndex).trim();

	return before === "" && after === "";
}

/**
 * checks if an interpolation block is within a string
 */
function isBlockInQuotedContext(template: string, block: InterpolationBlock): boolean {
	// look backwards for the nearest quote
	let quotesBefore = 0;
	for (let i = block.startIndex - 1; i >= 0; i--) {
		if (template[i] === '"' && template[i - 1] !== "\\") {
			quotesBefore++;
			break;
		}
	}

	// if there's an odd number of quotes before, we're inside a quoted context
	return quotesBefore === 1;
}

/**
 * interpolates JSONata expressions in a template string
 *
 * @param template - template string with {{ $.expression }} placeholders
 * @param data - data to evaluate expressions against
 * @returns interpolated result (string for string templates, any JSON type for raw)
 */
export async function interpolate(template: string, data: unknown): Promise<unknown> {
	const blocks = parseInterpolations(template);

	if (blocks.length === 0) {
		return template;
	}

	// single raw interpolation - return the actual value
	if (isSingleRawInterpolation(template, blocks)) {
		const expression = jsonata(blocks[0].expression);
		const result = await expression.evaluate(data);

		if (result === undefined) {
			throw new Error(`expression '${blocks[0].expression}' returned undefined`);
		}

		// jsonata sequences have a non-enumerable `sequence` property
		// convert to plain array to avoid issues with deep equality checks
		if (Array.isArray(result) && (result as any).sequence === true) {
			return [...result];
		}
		return result;
	}

	const inStringContext = isStringTemplate(template);

	// check if template is a structured context (array or object)
	const trimmed = template.trim();
	const startsWithArray = trimmed.startsWith("[");
	const startsWithObject = trimmed.startsWith("{") && !trimmed.startsWith("{{");
	const endsWithArray = trimmed.endsWith("]");
	const endsWithObject = trimmed.endsWith("}") && !trimmed.endsWith("}}");

	const isArrayContext = startsWithArray && endsWithArray;
	const isObjectContext = startsWithObject && endsWithObject;
	const isStructuredContext = isArrayContext || isObjectContext;

	// multiple interpolations in non-string, non-structured context
	// allow multiple interpolations in arrays/objects like [{{ $.a }}, {{ $.b }}]
	// but not in raw contexts like {{ $.a }}{{ $.b }}
	if (!inStringContext && blocks.length > 1 && !isStructuredContext) {
		throw new Error(
			`multiple interpolations are only allowed in string contexts, found ${blocks.length} interpolations in non-string template`
		);
	}

	let result = template;

	// process blocks in reverse order to maintain correct indices for multiple interpolations
	// otherwise wed have to offset the indices of all the blocks after the current one
	// eg we have two blocks [{first: '$.first', startIndex: 0, endIndex: 5 }, {last: '$.last', startIndex: 10, endIndex: 15 }]
	// if we replaced first with the value, we'd have to offset the indices of the last block by 5 - whatever the difference in length between $.first and its value is, which is really annoying
	for (let i = blocks.length - 1; i >= 0; i--) {
		const block = blocks[i];
		const expression = jsonata(block.expression);
		const value = await expression.evaluate(data);

		if (value === undefined) {
			throw new Error(`expression '${block.expression}' returned undefined`);
		}

		const stringified = JSON.stringify(value);

		if (inStringContext) {
			if (typeof value === "string") {
				// for strings, remove the outer quotes and use the content
				// the content is already escaped by JSON.stringify
				const valueStr = stringified.slice(1, -1);
				result =
					result.slice(0, block.startIndex) + valueStr + result.slice(block.endIndex);
			} else {
				// for objects/arrays/etc, we need to escape the quotes for JSON string context
				const escaped = stringified.replace(/"/g, '\\"');
				result = result.slice(0, block.startIndex) + escaped + result.slice(block.endIndex);
			}
		} else {
			const inQuotes = isBlockInQuotedContext(template, block);

			if (inQuotes && typeof value === "string") {
				const valueStr = stringified.slice(1, -1);
				result =
					result.slice(0, block.startIndex) + valueStr + result.slice(block.endIndex);
			} else {
				result =
					result.slice(0, block.startIndex) + stringified + result.slice(block.endIndex);
			}
		}
	}

	// if we're in a structured context (array or object), parse the result as JSON
	// use JSON5 to support unquoted keys and more lenient syntax
	if (isStructuredContext) {
		try {
			return JSON5.parse(result);
		} catch (error) {
			throw new Error(
				`Failed to parse structured result as JSON: ${error instanceof Error ? error.message : String(error)}. Attempted to parse: ${result}`
			);
		}
	}

	return result;
}
