import { z } from "zod";

class Markdown extends z.ZodString {
	static create = () =>
		new Markdown({
			typeName: "Markdown" as z.ZodFirstPartyTypeKind.ZodString,
			checks: [],
			coerce: false,
		});

	_parse(): z.ParseReturnType<string> {
		return {
			status: "valid",
			value: "",
		};
	}
}

export const markdown = Markdown.create;
