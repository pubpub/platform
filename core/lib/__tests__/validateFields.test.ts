import { expect, test } from "vitest";

import { CoreSchemaType } from "db/public";

import { validatePubValuesBySchemaName } from "~/lib/server/validateFields";

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
};

test.each([
	{ value: "", expected: false },
	{ value: 1, expected: false },
	{ value: {}, expected: false },
	{ value: JSON_EXAMPLE, expected: true },
])("validating rich text field", ({ value, expected }) => {
	const fields = [
		{ name: "Rich Text", slug: "community:richtext", schemaName: CoreSchemaType.RichText },
	];
	const values = { "community:richtext": value };
	const result = validatePubValuesBySchemaName({ fields, values });
	if (expected) {
		expect(result).toStrictEqual({});
	} else {
		expect(result[fields[0].slug]).toBeTruthy();
	}
});
