import * as z from "zod";

export type EmailTemplate = { subject: string; message: string };

export const InviteStatus = z.enum([
	"listed",
	"associated",
	"invited",
	"accepted",
	"declined",
	"submitted",
]);
export type InviteStatus = z.infer<typeof InviteStatus>;

export const EvaluatorBase = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required").optional(),
	emailTemplate: z.object({
		subject: z.string(),
		message: z.string(),
	}),
});
export type EvaluatorBase = z.infer<typeof EvaluatorBase>;

export const EvaluatorWithEmail = z
	.object({
		email: z.string().email("Invalid email address"),
	})
	.merge(EvaluatorBase);
export type EvaluatorWithEmail = z.infer<typeof EvaluatorWithEmail>;

export const EvaluatorWithPubPubUser = z
	.object({
		userId: z.string(),
	})
	.merge(EvaluatorBase);
export type EvaluatorWithPubPubUser = z.infer<typeof EvaluatorWithPubPubUser>;

export const EvaluatorWithInvite = EvaluatorWithPubPubUser.merge(
	z.object({
		invitedAt: z.string(),
	})
);

export type EvaluatorWithInvite = z.infer<typeof EvaluatorWithPubPubUser>;

export const Evaluator = z.discriminatedUnion("status", [
	// Listed evaluators, i.e. evaluators in the form that have not been saved
	// yet. These evaluators do not yet have user ids associated with them.
	z.object({ status: z.literal(InviteStatus.options[0]) }).merge(EvaluatorWithEmail),
	// Saved evaluators, i.e. evaluators in the form that have been saved. These
	// evaluators have PubPub user accounts but have not yet been invited.
	z.object({ status: z.literal(InviteStatus.options[1]) }).merge(EvaluatorWithPubPubUser),
	// Evaluators who have received invites. They have a user account and an `inviteTime`.
	z.object({ status: z.literal("invited") }).merge(EvaluatorWithInvite),
	z.object({ status: z.literal("accepted") }).merge(EvaluatorWithInvite),
	z.object({ status: z.literal("declined") }).merge(EvaluatorWithInvite),
	z.object({ status: z.literal("submitted") }).merge(EvaluatorWithInvite),
]);
export type Evaluator = z.infer<typeof Evaluator>;

export type InstanceConfig = {
	pubTypeId: string;
	evaluatorFieldSlug: string;
	titleFieldSlug: string;
	emailTemplate: EmailTemplate;
};

export type InstanceState = {
	[evaluatorPubPubUserId: string]: Evaluator;
};

export const defaultInstanceConfig = {
	pubTypeId: "",
	emailTemplate: { subject: "", message: "" },
	evaluatorFieldSlug: "",
	titleFieldSlug: "",
};

export const isInvited = (
	evaluator: Evaluator
): evaluator is Evaluator & { status: Exclude<InviteStatus, "listed" | "associated"> } => {
	return evaluator.status !== "listed" && evaluator.status !== "associated";
};

export function assertIsInvited(
	evaluator: Evaluator
): asserts evaluator is Evaluator & { status: Exclude<InviteStatus, "listed" | "associated"> } {
	if (!isInvited(evaluator)) {
		throw new Error("Invite is not invited");
	}
}
