import * as z from "zod";

export type EmailTemplate = { subject: string; message: string };

export const InviteStatus = z.enum([
	"unsaved",
	"unsaved-with-user",
	"saved",
	"invited",
	"accepted",
	"declined",
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
	})
);

export type EvaluatorWithInvite = z.infer<typeof EvaluatorWithPubPubUser>;

export const Evaluator = z.discriminatedUnion("status", [
	// Unsaved evaluators, i.e. evaluators in the form that have not been
	// persisted yet. These evaluators do not yet have user ids associated with
	// them.
	z.object({ status: z.literal(InviteStatus.options[0]) }).merge(EvaluatorWithEmail),
	// Unsaved evaluators with PubPub user accounts. These evaluators have user
	// ids associated with them but have not yet been persisted.
	z.object({ status: z.literal(InviteStatus.options[1]) }).merge(EvaluatorWithPubPubUser),
	// Saved evaluators, i.e. evaluators in the form that have been persisted.
	// These evaluators have PubPub user accounts but have not yet been invited.
	z.object({ status: z.literal(InviteStatus.options[2]) }).merge(EvaluatorWithPubPubUser),
	// Evaluators who have received invites. They have a user account and an
	// `invitedAt` timestamp.
	z.object({ status: z.literal("invited") }).merge(EvaluatorWithInvite),
	z.object({ status: z.literal("accepted") }).merge(EvaluatorWithInvite),
	z.object({ status: z.literal("declined") }).merge(EvaluatorWithInvite),
	z.object({ status: z.literal("received") }).merge(EvaluatorWithInvite),
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

export const isSaved = (
	evaluator: Evaluator
): evaluator is Evaluator & { status: Exclude<InviteStatus, "unsaved" | "unsaved-with-user"> } => {
	return evaluator.status !== "unsaved" && evaluator.status !== "unsaved-with-user";
};

export const hasUser = (
	evaluator: Evaluator
): evaluator is Evaluator & {
	status: Exclude<InviteStatus, "unsaved">;
} => {
	return evaluator.status !== "unsaved";
};

export const hasInvite = (
	evaluator: Evaluator
): evaluator is Evaluator & {
	status: Exclude<InviteStatus, "unsaved" | "unsaved-with-user" | "saved">;
} => {
	return (
		evaluator.status !== "unsaved" &&
		evaluator.status !== "unsaved-with-user" &&
		evaluator.status !== "saved"
	);
};

export function assertIsInvited(evaluator: Evaluator): asserts evaluator is Evaluator & {
	status: Exclude<InviteStatus, "unsaved" | "unsaved-with-user" | "saved">;
} {
	if (!hasInvite(evaluator)) {
		throw new Error("Evaluator is not invited");
	}
}
