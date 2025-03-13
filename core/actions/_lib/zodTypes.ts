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

const actionInstanceShape = {
	name: z.string(),
	description: z.string(),
	icon: z.string(),
	action: z.string(),
	actionInstanceId: z.string().uuid(),
};

export type ActionInstanceConfig = z.infer<z.ZodObject<typeof actionInstanceShape>>;

// @ts-expect-error FIXME: '{ name: z.ZodString; description: z.ZodString; icon: z.ZodString; action: z.ZodString; actionInstanceId: z.ZodString; }' is assignable to the constraint of type 'T_1', but 'T_1' could be instantiated with a different subtype of constraint 'ZodRawShape'.ts(2417)
class ActionInstance extends z.ZodObject<typeof actionInstanceShape, "strip", z.ZodTypeAny> {
	static create = () =>
		new ActionInstance({
			typeName: "ActionInstance" as z.ZodFirstPartyTypeKind.ZodObject,
			shape: () => actionInstanceShape,
			catchall: z.never(),
			unknownKeys: "strip",
		});
}

export const markdown = Markdown.create;
export const stringWithTokens = StringWithTokens.create;
export const actionInstance = ActionInstance.create;
