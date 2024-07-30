import { Type } from "@sinclair/typebox";

import { registerFormats } from "./formats";

registerFormats();

export const Boolean = Type.Boolean({
	description: "A true or false value.",
	examples: [true, false],
});

export const String = Type.String({
	description: "A string value of any length.",
	examples: [
		"Eating an elephant, one bite at a time: predator interactions at carrion bonanzas",
		"# Title\n\nThis is a markdown document.",
	],
});

export const Vector3 = Type.Array(Type.Number(), {
	minItems: 3,
	maxItems: 3,
	description:
		"An array of exactly three numbers. Can be used to specify a confidence interval, three-dimensional coordinates, etc.",
	examples: [
		[0, 0, 0],
		[30, 50, 65],
	],
});

export const DateTime = Type.Date({
	description: "A moment in time.",
	examples: ["2021-01-01T00:00:00Z"],
});

export const Email = Type.String({
	format: "email",
	description: "An email address.",
	examples: ["stevie@example.com"],
});

export const URL = Type.String({
	format: "uri",
	description: "A URL.",
	examples: ["https://example.com"],
});

export const UserId = Type.String({
	format: "uuid",
	description: "A PubPub user ID.",
	examples: ["f7b3b3b3-4b3b-4b3b-4b3b-1acefbd22232"],
});

export const FileUpload = Type.Object(
	{
		source: Type.String({ description: "The source of the file." }),
		id: Type.String({ description: "A unique identifier for the file." }),
		name: Type.String({ description: "The name of the file." }),
		meta: Type.Object({
			name: Type.String({ description: "The name of the file." }),
			type: Type.String({ description: "The MIME type of the file." }),
			relativePath: Type.String({ description: "The relative path of the file." }),
			absolutePath: Type.String({ description: "The absolute path of the file." }),
		}),
		type: Type.String({ description: "The MIME type of the file." }),
		size: Type.Number({ description: "The size of the file in bytes." }),
		uploadURL: Type.String({
			format: "uri",
			description: "The URL to upload the file to.",
		}),
	},
	{
		description:
			"An Uppy file upload object. See https://uppy.io/docs/uppy/#working-with-uppy-files for more information.",
	}
);
