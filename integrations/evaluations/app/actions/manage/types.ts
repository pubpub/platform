import * as z from "zod";

export type Evaluator =
	| { userId: string; firstName: string; lastName?: string }
	| { email: string; firstName: string; lastName?: string };

export type EvaluatorInvite = Evaluator & {
	template: {
		subject: string;
		message: string;
	};
	selected?: boolean;
};

export const EvaluatorInviteBase = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required").optional(),
	template: z.object({
		subject: z.string(),
		message: z.string(),
	}),
	selected: z.boolean().optional(),
});

export const EvaluatorInvite: z.ZodType<EvaluatorInvite> = z.union([
	z
		.object({
			userId: z.string(),
		})
		.and(EvaluatorInviteBase),
	z
		.object({
			email: z.string().email("Invalid email address"),
		})
		.and(EvaluatorInviteBase),
]);

// TODO: generate fields using instance's configured PubType
export const EmailFormSchema = z.object({
	invites: z.array(EvaluatorInvite),
});
