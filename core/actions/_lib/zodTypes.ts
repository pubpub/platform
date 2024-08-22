import { z } from "zod";

class Markdown extends z.ZodString {
	static create = () =>
		new Markdown({
			typeName: "Markdown" as z.ZodFirstPartyTypeKind.ZodString,
			checks: [],
			coerce: false,
		});

	_parse(input: z.ParseInput): z.ParseReturnType<string> {
		return {
			status: "valid",
			value: input.data,
		};
	}
}

class StringWithTokens extends z.ZodString {
	static create = () =>
		new StringWithTokens({
			typeName: "StringWithTokens" as z.ZodFirstPartyTypeKind.ZodString,
			checks: [],
			coerce: false,
		});

	_parse(input: z.ParseInput): z.ParseReturnType<string> {
		return {
			status: "valid",
			value: input.data,
		};
	}
}

export const markdown = Markdown.create;
export const stringWithTokens = StringWithTokens.create;
