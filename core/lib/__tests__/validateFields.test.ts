import { expect, test } from "vitest"

import { CoreSchemaType } from "db/public"

import { validatePubValuesBySchemaName } from "~/lib/server/validateFields"

const JSON_EXAMPLE = {
	content: [
		{
			content: [
				{
					text: "Example document",
					type: "text",
				},
			],
			type: "paragraph",
		},
	],
	type: "doc",
}

test.each([
	{ value: 1, expected: false },
	{ value: {}, expected: false },
	{ value: JSON_EXAMPLE, expected: `<p>Example document</p>` },
	// "" is a valid html value
	{ value: "", expected: "" },
])("validating rich text field", ({ value, expected }) => {
	const values = [{ slug: "community:richtext", value, schemaName: CoreSchemaType.RichText }]
	const result = validatePubValuesBySchemaName(values)
	if (expected !== false) {
		expect(result.results[0].value).toStrictEqual(expected)
	} else {
		expect(result.errors.length).toBeGreaterThan(0)
	}
})
