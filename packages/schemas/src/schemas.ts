import type { Static } from "@sinclair/typebox";

import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

import { setErrorFunction } from "./errors";
import { registerFormats } from "./formats";
import { checkboxGroupConfigSchema } from "./schemaComponents";
import { MinMaxChoices } from "./types";

registerFormats();
setErrorFunction();

export const Boolean = Type.Boolean({
	description: "A true or false value",
	examples: [true, false],
});

export const String = Type.String({
	description: "A string value of any length",
	examples: [
		"Eating an elephant, one bite at a time: predator interactions at carrion bonanzas",
		"# Title\n\nThis is a markdown document.",
	],
});

export const Number = Type.Number({
	description: "A numeric value",
	examples: [0, 1, 3.14],
});

export const Vector3 = Type.Array(
	Type.Number({
		error: "Invalid number",
	}),
	{
		minItems: 3,
		maxItems: 3,
		description:
			"An array of exactly three numbers. Can be used to specify a confidence interval, three-dimensional coordinates, etc.",
		examples: [
			[0, 0, 0],
			[30, 50, 65],
		],
		error: "Invalid vector",
	}
);

export const NumericArray = Type.Array(
	Type.Number({
		error: "Invalid number",
	}),
	{
		description: "An array of numbers",
		examples: [[], [-1, 0, 2], [1.2, 17, 2.5, 2.7]],
		error: "Invalid array of numbers",
	}
);

const getMinMaxFromCheckboxGroupConfig = (config: Static<typeof checkboxGroupConfigSchema>) => {
	const { numCheckboxes, userShouldSelect } = config;
	let min: number | undefined;
	let max: number | undefined;
	if (userShouldSelect === MinMaxChoices.Exactly) {
		min = numCheckboxes;
		max = numCheckboxes;
	} else if (userShouldSelect === MinMaxChoices.AtLeast) {
		min = numCheckboxes;
		max = undefined;
	} else if (userShouldSelect === MinMaxChoices.AtMost) {
		min = undefined;
		max = numCheckboxes;
	}
	const error =
		min === undefined && max === undefined
			? ""
			: `Please select ${userShouldSelect?.toLocaleLowerCase()} ${config.numCheckboxes}`;
	return { min, max, error };
};

export const getNumericArrayWithMinMax = (config?: unknown) => {
	if (!Value.Check(checkboxGroupConfigSchema, config)) {
		return NumericArray;
	}
	const { min, max, error } = getMinMaxFromCheckboxGroupConfig(config);
	return Type.Array(Type.Number({ error: "Invalid number" }), {
		description: "An array of numbers",
		examples: [[], [-1, 0, 2], [1.2, 17, 2.5, 2.7]],
		error: `Invalid array of numbers. ${error}`,
		minItems: min,
		maxItems: max,
	});
};

export const StringArray = Type.Array(
	Type.String({
		error: "Invalid string",
	}),
	{
		description: "An array of strings",
		examples: [[], ["apple", "banana", "cherry"]],
		error: "Invalid array of strings",
	}
);

export const getStringArrayWithMinMax = (config: unknown) => {
	if (!Value.Check(checkboxGroupConfigSchema, config)) {
		return StringArray;
	}
	const { min, max, error } = getMinMaxFromCheckboxGroupConfig(config);
	return Type.Array(Type.String({ error: "Invalid string" }), {
		description: "An array of strings",
		examples: [[], ["apple", "banana", "cherry"]],
		error: `Invalid array of strings. ${error}`,
		minItems: min,
		maxItems: max,
	});
};

export const DateTime = Type.Date({
	description: "A moment in time",
	examples: ["2021-01-01T00:00:00Z"],
	error: "Invalid date",
});

export const Email = Type.String({
	format: "email",
	description: "An email address",
	examples: ["stevie@example.com"],
	error: "Invalid email address",
});

export const URL = Type.String({
	format: "uri",
	description: "A URL",
	examples: ["https://example.com"],
	error: "Invalid URL",
});

export const MemberId = Type.String({
	format: "uuid",
	description: "A member of your community",
	examples: ["f7b3b3b3-4b3b-4b3b-4b3b-1acefbd22232"],
	error: "Invalid UUID",
});

export const FileUpload = Type.Array(
	Type.Object(
		{
			fileSource: Type.String({ description: "The source of the file." }),
			id: Type.String({ description: "A unique identifier for the file." }),
			fileName: Type.String({ description: "The name of the file." }),
			fileMeta: Type.Object({
				name: Type.String({ description: "The name of the file." }),
				type: Type.String({ description: "The MIME type of the file." }),
				relativePath: Type.Union([
					Type.String({ description: "The relative path of the file." }),
					Type.Null(),
				]),
				absolutePath: Type.Optional(
					Type.String({ description: "The absolute path of the file." })
				),
			}),
			fileType: Type.String({ description: "The MIME type of the file." }),
			fileSize: Type.Number({ description: "The size of the file in bytes." }),
			fileUploadUrl: Type.String({
				format: "uri",
				description: "The URL to upload the file to.",
			}),
			filePreview: Type.Optional(
				Type.String({
					format: "uri",
					description: "The URL to the preview image of the file.",
				})
			),
		},
		{
			description:
				"An Uppy file upload object. See https://uppy.io/docs/uppy/#working-with-uppy-files for more information.",
		}
	)
);

export const Null = Type.Null({ description: "An empty value" });

// Rich text is validated via prosemirror on submit, so we allow Any here
export const RichText = Type.Any({ description: "A rich text document" });
