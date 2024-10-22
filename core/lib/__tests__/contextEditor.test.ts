import { expect, test } from "vitest";

import { validateAgainstContextEditorSchema } from "~/lib/server/contextEditor";

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
])("validateAgainstContextEditorSchema", ({ value, expected }) => {
	const result = validateAgainstContextEditorSchema(value);
	expect(result).toBe(expected);
});
