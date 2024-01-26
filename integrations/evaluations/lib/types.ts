import * as z from "zod";

export type EmailTemplate = { subject: string; message: string };

export const InviteStatus = z.enum([
	// Unsaved evaluators, i.e. evaluators in the form that have not been
	// persisted yet. These evaluators do not yet have user ids associated with
	// them.
	"unsaved",
	// Unsaved evaluators with PubPub user accounts. These evaluators have user
	// ids associated with them but have not yet been persisted.
	"unsaved-with-user",
	// Saved evaluators, i.e. evaluators in the form that have been persisted.
	// These evaluators have PubPub user accounts but have not yet been invited.
	"saved",
	// Evaluators who have received an invitation. They have a user account and
	// an `invitedAt` timestamp.
	"invited",
	// Evaluators who have accepted an invitation.
	"accepted",
	// Evaluators who have declined an invitation.
	"declined",
	// Evaluators who have submitted an evaluation.
	"received",
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
		invitedBy: z.string(),
	})
);
export type EvaluatorWithInvite = z.infer<typeof EvaluatorWithInvite>;

export const EvaluatorWhoAccepted = EvaluatorWithInvite.merge(
	z.object({
		acceptedAt: z.string(),
		deadline: z.date(),
	})
);
export type EvaluatorWhoAccepted = z.infer<typeof EvaluatorWhoAccepted>;

export const EvaluatorWhoEvaluated = EvaluatorWhoAccepted.merge(
	z.object({
		evaluatedAt: z.string(),
		evaluationPubId: z.string(),
	})
);
export type EvaluatorWhoEvaluated = z.infer<typeof EvaluatorWhoEvaluated>;

export const Evaluator = z.discriminatedUnion("status", [
	// "unsaved"
	z.object({ status: z.literal(InviteStatus.options[0]) }).merge(EvaluatorWithEmail),
	// "unsaved-with-user"
	z.object({ status: z.literal(InviteStatus.options[1]) }).merge(EvaluatorWithPubPubUser),
	// "saved"
	z.object({ status: z.literal(InviteStatus.options[2]) }).merge(EvaluatorWithPubPubUser),
	// "invited"
	z.object({ status: z.literal(InviteStatus.options[3]) }).merge(EvaluatorWithInvite),
	// "accepted"
	z.object({ status: z.literal(InviteStatus.options[4]) }).merge(EvaluatorWhoAccepted),
	// "declined"
	z.object({ status: z.literal(InviteStatus.options[5]) }).merge(EvaluatorWithInvite),
	// "received"
	z.object({ status: z.literal(InviteStatus.options[6]) }).merge(EvaluatorWhoEvaluated),
]);
export type Evaluator = z.infer<typeof Evaluator>;

export type InstanceConfig = {
	pubTypeId: string;
	evaluatorFieldSlug: string;
	titleFieldSlug: string;
	emailTemplate: EmailTemplate;
	deadlineLength: number;
	deadlineUnit: "days" | "months";
};

export type InstanceState = {
	[evaluatorPubPubUserId: string]: Evaluator;
};

export const isSaved = (
	evaluator: Evaluator
): evaluator is Exclude<Evaluator, { status: "unsaved" | "unsaved-with-user" }> => {
	return evaluator.status !== "unsaved" && evaluator.status !== "unsaved-with-user";
};

export const hasUser = (
	evaluator: Evaluator
): evaluator is Exclude<Evaluator, { status: "unsaved" }> => {
	return evaluator.status !== "unsaved";
};

export const isInvited = (
	evaluator: Evaluator
): evaluator is Extract<
	Evaluator,
	{ status: "invited" | "accepted" | "declined" | "received" }
> => {
	return (
		evaluator.status !== "unsaved" &&
		evaluator.status !== "unsaved-with-user" &&
		evaluator.status !== "saved"
	);
};

export function assertIsInvited(
	evaluator: Evaluator
): asserts evaluator is Exclude<Evaluator, { status: "unsaved" | "unsaved-with-user" | "saved" }> {
	if (!isInvited(evaluator)) {
		throw new Error("User is not invited to evaluate this pub");
	}
}

export function assertHasAccepted(
	evaluator: Evaluator
): asserts evaluator is Extract<Evaluator, { status: "accepted" }> {
	assertIsInvited(evaluator);
	if (evaluator.status === "declined") {
		throw new Error("User has not accepted the invite to evaluate this pub");
	}
}
