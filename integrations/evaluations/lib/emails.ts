import { client } from "~/lib/pubpub";
import {
	EvaluatorWhoAccepted,
	EvaluatorWhoEvaluated,
	EvaluatorWithInvite,
	InstanceConfig,
} from "~/lib/types";

const DAYS_TO_ACCEPT_INVITE = 10;
const DAYS_TO_REMIND_EVALUATOR = 5;

// Use the submission pub's assigned user if available, otherwise use the
// invitor's (person who clicked "Invite") name.
const evaluationManagerName =
	"{{pubs.submission.assignee?.firstName??users.invitor.firstName}} {{pubs.submission.assignee?.lastName??users.invitor.lastName}}";
const evaluationManagerEmail = "{{pubs.submission.assignee?.email??users.invitor.email}}";

/**
 * Reaturns a new date object with the deadline calculated based on the deadlineLength and deadlineUnit.
 * @param deadline
 * @param date
 * @returns Date
 */
export function calculateDeadline(
	deadline: Pick<InstanceConfig, "deadlineLength" | "deadlineUnit">,
	date: Date
): Date {
	switch (deadline.deadlineUnit) {
		case "days":
			return new Date(date.setMinutes(date.getMinutes() + deadline.deadlineLength * 24 * 60));
		case "months":
			return new Date(date.setMonth(date.getMonth() + deadline.deadlineLength));
		default:
			throw new Error('Invalid time unit. Use "days", "weeks", or "months".');
	}
}

export function getDeadline(instanceConfig: InstanceConfig, evaluator: EvaluatorWhoAccepted): Date {
	return evaluator.deadline
		? new Date(evaluator.deadline)
		: calculateDeadline(
				{
					deadlineLength: instanceConfig.deadlineLength,
					deadlineUnit: instanceConfig.deadlineUnit,
				},
				new Date(evaluator.acceptedAt)
		  );
}

const notificationFooter =
	'<p><em>This is an automated email sent from Unjournal. Please contact <a href="mailto:contact@unjournal.org">contact@unjournal.org</a> with any questions.</em></p>';

const makeReminderJobKey = (instanceId: string, pubId: string, evaluator: EvaluatorWithInvite) =>
	`send-email-${instanceId}-${pubId}-${evaluator.userId}-reminder`;

const makeNoReplyJobKey = (instanceId: string, pubId: string, evaluator: EvaluatorWithInvite) =>
	`send-email-${instanceId}-${pubId}-${evaluator.userId}-${evaluator.invitedBy}-no-reply`;

const makeNoSubmitJobKey = (instanceId: string, pubId: string, evaluator: EvaluatorWithInvite) =>
	`send-email-${instanceId}-${pubId}-${evaluator.userId}-no-submit`;

const makePromptEvalBonusReminderJobKey = (
	instanceId: string,
	pubId: string,
	evaluator: EvaluatorWhoAccepted
) => `send-email-${instanceId}-${pubId}-${evaluator.userId}-prompt-eval-bonus-reminder`;

const makeFinalPromptEvalBonusReminderJobKey = (
	instanceId: string,
	pubId: string,
	evaluator: EvaluatorWhoAccepted
) => `send-email-${instanceId}-${pubId}-${evaluator.userId}-final-prompt-eval-bonus-reminder`;

const makeEvalReminderJobKey = (
	instanceId: string,
	pubId: string,
	evaluator: EvaluatorWhoAccepted
) => `send-email-${instanceId}-${pubId}-${evaluator.userId}-eval-reminder`;

const makeFinalEvalReminderJobKey = (
	instanceId: string,
	pubId: string,
	evaluator: EvaluatorWhoAccepted
) => `send-email-${instanceId}-${pubId}-${evaluator.userId}-final-eval-reminder`;

const makeFollowUpToFinalEvalReminderJobKey = (
	instanceId: string,
	pubId: string,
	evaluator: EvaluatorWhoAccepted
) => `send-email-${instanceId}-${pubId}-${evaluator.userId}-follow-up-to-final-eval-reminder`;

const makeNoticeOfNoSubmitJobKey = (
	instanceId: string,
	pubId: string,
	evaluator: EvaluatorWhoAccepted
) => `send-email-${instanceId}-${pubId}-${evaluator.userId}-no-submit-notice`;

// emails sent to the evaluation manager
/**
 * Schedules an email to the evaluation manager to notify them that an invited evaluator has not responded to the invitation.
 * @param instanceId
 * @param instanceConfig
 * @param pubId
 * @param evaluator
 * @returns
 */
export const scheduleNoReplyNotificationEmail = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string,
	evaluator: EvaluatorWithInvite
) => {
	const jobKey = makeNoReplyJobKey(instanceId, pubId, evaluator);
	const runAt = new Date(evaluator.invitedAt);
	runAt.setMinutes(runAt.getMinutes() + DAYS_TO_ACCEPT_INVITE * 24 * 60);

	await client.scheduleEmail(
		instanceId,
		{
			to: {
				userId: evaluator.invitedBy,
			},
			subject: `[Unjournal] No reply from invited evaluator for "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}"`,
			message: `<p>An invited evaluator, {{users.evaluator.firstName}} {{users.evaluator.lastName}}, has not responded for {{extra.days}} days to our invitation to evaluate "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}". You may review the status of this and other invitations on the {{extra.manage_link}}.</p>
${notificationFooter}`,
			include: {
				pubs: {
					submission: pubId,
				},
				users: {
					evaluator: evaluator.userId,
				},
			},
			extra: {
				days: DAYS_TO_ACCEPT_INVITE.toString(),
				manage_link: `<a href="{{instance.actions.manage}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}">Invite Evaluators page</a>`,
			},
		},
		{ jobKey, runAt }
	);
};

/**
 * Unschedules the no reply notification email for the evaluation manager.
 * @param instanceId
 * @param pubId
 * @param evaluator
 * @returns
 */
export const unscheduleNoReplyNotificationEmail = (
	instanceId: string,
	pubId: string,
	evaluator: EvaluatorWithInvite
) => {
	const jobKey = makeNoReplyJobKey(instanceId, pubId, evaluator);
	return client.unscheduleEmail(instanceId, jobKey);
};

/**
 * Schedules an email to the evaluation manager to notify them that an evaluator has not submitted their evaluation.
 * @param instanceId
 * @param instanceConfig
 * @param pubId
 * @param evaluator
 * @returns
 */
export const scheduleNoSubmitNotificationEmail = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string,
	evaluator: EvaluatorWhoAccepted
) => {
	const jobKey = makeNoSubmitJobKey(instanceId, pubId, evaluator);
	const deadline = getDeadline(instanceConfig, evaluator);
	const runAt = deadline;

	await client.scheduleEmail(
		instanceId,
		{
			to: {
				userId: evaluator.invitedBy,
			},
			subject: `[Unjournal] Evaluation not submitted for "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}"`,
			message: `<p>An evaluator, {{users.evaluator.firstName}} {{users.evaluator.lastName}}, has not submitted an evaluation for "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}", which was due on {{extra.due_at}}. You may review the status of this and other invitations on the {{extra.manage_link}}.</p>
${notificationFooter}`,
			include: {
				pubs: {
					submission: pubId,
				},
				users: {
					evaluator: evaluator.userId,
				},
			},
			extra: {
				due_at: deadline.toLocaleDateString(),
				manage_link: `<a href="{{instance.actions.manage}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}">Invite Evaluators page</a>`,
			},
		},
		{ jobKey, runAt }
	);
};

/**
 * Unschedules the no submit notification email for the evaluation manager.
 * @param instanceId
 * @param pubId
 * @param evaluator
 * @returns
 */
export const unscheduleNoSubmitNotificationEmail = (
	instanceId: string,
	pubId: string,
	evaluator: EvaluatorWithInvite
) => {
	const jobKey = makeNoSubmitJobKey(instanceId, pubId, evaluator);
	return client.unscheduleEmail(instanceId, jobKey);
};

/**
 * Sends an email to the evaluation manager to notify them that an evaluator has accepted the invitation to evaluate the pub.
 * @param instanceId
 * @param instanceConfig
 * @param pubId
 * @param evaluator
 * @returns
 */
export const sendAcceptedNotificationEmail = (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string,
	evaluator: EvaluatorWithInvite
) => {
	return client.sendEmail(instanceId, {
		to: {
			userId: evaluator.invitedBy,
		},
		subject: `[Unjournal] Accepted evaluation for "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}"`,
		message: `<p>An invited evaluator, {{users.evaluator.firstName}} {{users.evaluator.lastName}}, has agreed to evaluate "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}". You may review the status of this and other invitations on the {{extra.manage_link}}.</p>
${notificationFooter}`,
		include: {
			pubs: {
				submission: pubId,
			},
			users: {
				evaluator: evaluator.userId,
			},
		},
		extra: {
			manage_link: `<a href="{{instance.actions.manage}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}">Invite Evaluators page</a>`,
		},
	});
};

/**
 * Sends an email to the evaluation manager to notify them that an evaluator has declined the invitation to evaluate the pub.
 * @param instanceId
 * @param instanceConfig
 * @param pubId
 * @param evaluator
 * @returns
 */
export const sendDeclinedNotificationEmail = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string,
	evaluator: EvaluatorWithInvite
) => {
	return client.sendEmail(instanceId, {
		to: {
			userId: evaluator.invitedBy,
		},
		subject: `[Unjournal] Invited evaluator declines to evaluate "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}"`,
		message: `<p>An invited evaluator, {{users.evaluator.firstName}} {{users.evaluator.lastName}}, has declined to evaluate "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}". You may review the status of this and other invitations on the {{extra.manage_link}}.</p>
${notificationFooter}`,
		include: {
			pubs: {
				submission: pubId,
			},
			users: {
				evaluator: evaluator.userId,
			},
		},
		extra: {
			manage_link: `<a href="{{instance.actions.manage}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}">Invite Evaluators page</a>`,
		},
	});
};

/**
 * Sends an email to the evaluation manager to notify them that an evaluator has submitted their evaluation.
 * @param instanceId
 * @param instanceConfig
 * @param pubId
 * @param evaluator
 * @returns
 */
export const sendSubmittedNotificationEmail = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string,
	evaluator: EvaluatorWhoEvaluated
) => {
	return client.sendEmail(instanceId, {
		to: {
			userId: evaluator.invitedBy,
		},
		subject: `[Unjournal] Evaluation submitted for "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}"`,
		message: `<p>An evaluator, {{users.evaluator.firstName}} {{users.evaluator.lastName}}, has submitted an evaluation for "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}". The submitted evaluation Pub can be viewed <a href="https://v7.pubpub.org/pubs/${evaluator.evaluationPubId}">here</a>.</p>
<p>You may review the status of this and other invitations on the {{extra.manage_link}}.</p>
${notificationFooter}`,
		include: {
			pubs: {
				submission: pubId,
			},
			users: {
				evaluator: evaluator.userId,
			},
		},
		extra: {
			manage_link: `<a href="{{instance.actions.manage}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}">Invite Evaluators page</a>`,
		},
	});
};

// emails sent to the evaluator
/**
 *
 * Sends an email to the evaluator with the invitation to evaluate the pub.
 * @param instanceId
 * @param pubId
 * @param evaluator
 * @returns Promise that resolves to the result of the email send operation.
 */
export const sendInviteEmail = async (
	instanceId: string,
	pubId: string,
	evaluator: EvaluatorWithInvite
) => {
	return client.sendEmail(instanceId, {
		to: {
			userId: evaluator.userId,
		},
		subject: evaluator.emailTemplate.subject,
		message: evaluator.emailTemplate.message,
		include: {
			pubs: {
				submission: pubId,
			},
			users: {
				invitor: evaluator.invitedBy,
			},
		},
		extra: {
			accept_link: `<a href="{{instance.actions.respond}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}&intent=accept">Accept</a>`,
			decline_link: `<a href="{{instance.actions.respond}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}&intent=decline">Decline</a>`,
			info_link: `<a href="{{instance.actions.respond}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}&intent=info">More Information</a>`,
		},
	});
};

/**
 * Schedules an email to the evaluator as a reminder to accept the invitation to evaluate the pub.
 * @param instanceId
 * @param instanceConfig
 * @param pubId
 * @param evaluator
 */
export const scheduleInvitationReminderEmail = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string,
	evaluator: EvaluatorWithInvite
) => {
	const jobKey = makeReminderJobKey(instanceId, pubId, evaluator);
	const runAt = new Date(evaluator.invitedAt);
	runAt.setMinutes(runAt.getMinutes() + DAYS_TO_REMIND_EVALUATOR * 24 * 60);

	await client.scheduleEmail(
		instanceId,
		{
			to: {
				userId: evaluator.userId,
			},
			subject: `Reminder: ${evaluationManagerName} invited you to evaluate "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}" for The Unjournal`,
			message: evaluator.emailTemplate.message,
			include: {
				users: {
					invitor: evaluator.invitedBy,
				},
				pubs: {
					submission: pubId,
				},
			},
			extra: {
				accept_link: `<a href="{{instance.actions.respond}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}&intent=accept">Accept</a>`,
				decline_link: `<a href="{{instance.actions.respond}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}&intent=decline">Decline</a>`,
				info_link: `<a href="{{instance.actions.respond}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}&intent=info">More Information</a>`,
			},
		},
		{ jobKey, runAt }
	);
};

/**
 * Cancels the scheduled reminder email for the evaluator to accept the invitation to evaluate the pub.
 * @param instanceId
 * @param pubId
 * @param evaluator
 * @returns
 */
export const unscheduleInvitationReminderEmail = (
	instanceId: string,
	pubId: string,
	evaluator: EvaluatorWithInvite
) => {
	const jobKey = makeReminderJobKey(instanceId, pubId, evaluator);
	return client.unscheduleEmail(instanceId, jobKey);
};

/**
 * Sends an email to the evaluator to inform them that their invitation to evaluate the pub has been accepted.
 * @param instanceId
 * @param instanceConfig
 * @param pubId
 * @param evaluator
 * @returns
 */
export const sendAcceptedEmail = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string,
	evaluator: EvaluatorWhoAccepted
) => {
	const deadline = getDeadline(instanceConfig, evaluator);
	await client.sendEmail(instanceId, {
		to: {
			userId: evaluator.userId,
		},
		subject: `[Unjournal] Thank you for agreeing to evaluate "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}"`,
		message: `<p>Hi {{user.firstName}} {{user.lastName}},</p>
		<p>Thank you for agreeing to evaluate "{{pubs.submission.values["${
			instanceConfig.titleFieldSlug
		}"]}}" for <a href="https://unjournal.org/">The Unjournal</a>. Please submit your evaluation and ratings using {{extra.evaluate_link}}. The form includes general instructions as well as (potentially) specific considerations for this research and particular issues and priorities for this evaluation.</p>
		<p>We strongly encourage evaluators to complete evaluations within three weeks; quick turnaround is an important part of The Unjournal model, for the benefit of authors, research-users, and the evaluation ecosystem. If you submit the evaluation within that window (by ${new Date(
			deadline.getTime() - 21 * (1000 * 60 * 60 * 24)
		).toLocaleDateString()}), you will receive a $100 “prompt evaluation bonus,” in addition to the baseline $300 honorarium, as well as other potential evaluator incentives and prizes. After ${new Date(
			deadline.getTime()
		).toLocaleDateString()}, we will consider re-assigning the evaluation, and later submissions may not be eligible for the full baseline compensation.</p>
		<p>If you have any questions, please contact me at <a href="mailto:${evaluationManagerEmail}">${evaluationManagerEmail}</a>.</p>
		<p>Once your evaluation has been submitted and reviewed, we will follow up with details about payment and next steps.</p>
		<p>Thank you again for your important contribution to the future of science.</p>
		<p>Thanks and best wishes,</p>
		<p>${evaluationManagerName}</p>
		<p><a href="https://unjournal.org/">Unjournal.org</a></p>`,
		include: {
			pubs: {
				submission: pubId,
			},
			users: {
				invitor: evaluator.invitedBy,
			},
		},
		extra: {
			evaluate_link: `<a href="{{instance.actions.evaluate}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}">this evaluation form</a>`,
			due_at: deadline.toLocaleDateString(),
		},
	});
};

/**
 * Schedules a reminder email to an evaluator for prompt evaluation bonus.
 * @param instanceId - The ID of the instance.
 * @param instanceConfig - The configuration of the instance.
 * @param pubId - The ID of the publication.
 * @param evaluator - The evaluator who accepted the evaluation.
 * @returns A promise that resolves when the email is sent.
 */
export const schedulePromptEvalBonusReminderEmail = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string,
	evaluator: EvaluatorWhoAccepted
) => {
	const deadline = getDeadline(instanceConfig, evaluator);
	const reminderDeadline = new Date(deadline.getTime() - 21 * (1000 * 60 * 60 * 24));
	const jobKey = makePromptEvalBonusReminderJobKey(instanceId, pubId, evaluator);
	const runAt = reminderDeadline;

	return client.scheduleEmail(
		instanceId,
		{
			to: {
				userId: evaluator.userId,
			},
			subject: `[Unjournal] Reminder to evaluate "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}" for prompt evaluation bonus`,
			message: `<p>Hi {{user.firstName}},</p>
	  <p>Thanks again for agreeing to evaluate "{{pubs.submission.values["${
			instanceConfig.titleFieldSlug
		}"]}}" for The Unjournal.</p>
	  <p>This note is a reminder to submit your evaluation by ${reminderDeadline.toLocaleDateString()} to receive a $100 “prompt evaluation bonus,” in addition to your baseline compensation. Please note that after ${new Date(
				deadline
			).toLocaleDateString()} we will consider re-assigning the evaluation, and later submissions may not be eligible for the full baseline compensation.</p>
	  <p>Please submit your evaluation and rating, as well as any specific considerations, using <a href="{{extra.evaluate_link}}">this evaluation form</a>. The form includes instructions and information about the paper/project.</p>
	  <p>If you have any questions, do not hesitate to reach out to me at <a href="mailto:${evaluationManagerEmail}">${evaluationManagerEmail}</a>.</p>
	  <p>Once your evaluation has been submitted and reviewed, we will follow up with details about payment and next steps.</p>
	  <p>Thanks and best wishes,</p>
	  <p>${evaluationManagerName}</p>
	  <p><a href="https://unjournal.org/">Unjournal.org</a></p>`,
			include: {
				pubs: {
					submission: pubId,
				},
				users: {
					invitor: evaluator.invitedBy,
				},
			},
			extra: {
				evaluate_link: `{{instance.actions.evaluate}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}`,
			},
		},
		{ jobKey, runAt }
	);
};

/**
 * Schedules a final reminder email to an evaluator for prompt evaluation bonus.
 * @param instanceId
 * @param instanceConfig
 * @param pubId
 * @param evaluator
 * @returns
 */
export const scheduleFinalPromptEvalBonusReminderEmail = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string,
	evaluator: EvaluatorWhoAccepted
) => {
	const deadline = getDeadline(instanceConfig, evaluator);
	const reminderDeadline = new Date(deadline.getTime() - 14 * (1000 * 60 * 60 * 24));
	const jobKey = makeFinalPromptEvalBonusReminderJobKey(instanceId, pubId, evaluator);
	const runAt = reminderDeadline;

	return client.scheduleEmail(
		instanceId,
		{
			to: {
				userId: evaluator.userId,
			},
			subject: `[Unjournal] Final Reminder: Submit evaluation for prompt bonus "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}"`,
			message: `<p>Hi {{user.firstName}},</p>
	  <p>This is a final reminder to submit your evaluation for "{{pubs.submission.values["${
			instanceConfig.titleFieldSlug
		}"]}}" by the deadline ${reminderDeadline.toLocaleDateString()} to receive the $100 “prompt evaluation bonus.”</p>
	  <p>If you haven't already, please submit your evaluation and rating, as well as any specific considerations, using <a href="{{extra.evaluate_link}}">this evaluation form</a>. The form includes instructions and information about the paper/project.</p>
	  <p>If you have any questions, do not hesitate to reach out to me at <a href="mailto:${evaluationManagerEmail}">${evaluationManagerEmail}</a>.</p>
	  <p>Once your evaluation has been submitted and reviewed, we will follow up with details about payment and next steps.</p>
	  <p>Thanks and best wishes,</p>
	  <p>${evaluationManagerName}</p>
	  <p><a href="https://unjournal.org/">Unjournal.org</a></p>`,
			include: {
				pubs: {
					submission: pubId,
				},
				users: {
					invitor: evaluator.invitedBy,
				},
			},
			extra: {
				evaluate_link: `{{instance.actions.evaluate}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}`,
			},
		},
		{ jobKey, runAt }
	);
};

/**
 * Schedules a reminder email to an evaluator to submit their evaluation.
 * @param instanceId
 * @param instanceConfig
 * @param pubId
 * @param evaluator
 * @returns
 */
export const scheduleEvaluationReminderEmail = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string,
	evaluator: EvaluatorWhoAccepted
) => {
	const deadline = getDeadline(instanceConfig, evaluator);
	const jobKey = makeEvalReminderJobKey(instanceId, pubId, evaluator);
	const runAt = new Date(deadline.getTime() - 7 * (1000 * 60 * 60 * 24));

	return client.scheduleEmail(
		instanceId,
		{
			to: {
				userId: evaluator.userId,
			},
			subject: `[Unjournal] Reminder to evaluate "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}" by next week`,
			message: `<p>Hi {{user.firstName}},</p>
	  <p>Thank you again for agreeing to evaluate "{{pubs.submission.values["${
			instanceConfig.titleFieldSlug
		}"]}}" for The Unjournal.</p>
	  <p>This note is a reminder that your evaluation should be submitted by ${new Date(
			deadline.getTime()
		).toLocaleDateString()} (next week). Please note that after that date we will consider re-assigning the evaluation, and later submissions may not be eligible for the full baseline compensation.</p>
	  <p>Please submit your evaluation and rating, as well as any specific considerations, using <a href="{{extra.evaluate_link}}">this evaluation form</a>. The form includes instructions and information about the paper/project.</p>
	  <p>If you have any questions, do not hesitate to reach out to me at <a href="mailto:${evaluationManagerEmail}">${evaluationManagerEmail}</a>.</p>
	  <p>Once your evaluation has been submitted and reviewed, we will follow up with details about payment and next steps.</p>
	  <p>Thanks and best wishes,</p>
	  <p>${evaluationManagerName}</p>
	  <p><a href="https://unjournal.org/">Unjournal.org</a></p>`,
			include: {
				pubs: {
					submission: pubId,
				},
				users: {
					invitor: evaluator.invitedBy,
				},
			},
			extra: {
				evaluate_link: `{{instance.actions.evaluate}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}`,
			},
		},
		{ jobKey, runAt }
	);
};

/**
 * Schedules a final reminder email to an evaluator to submit their evaluation.
 * @param instanceId
 * @param instanceConfig
 * @param pubId
 * @param evaluator
 * @returns
 */
export const scheduleFinalEvaluationReminderEmail = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string,
	evaluator: EvaluatorWhoAccepted
) => {
	const deadline = getDeadline(instanceConfig, evaluator);
	const jobKey = makeFinalEvalReminderJobKey(instanceId, pubId, evaluator);
	const runAt = new Date(deadline.getTime() - 1 * (1000 * 60 * 60 * 24));

	return client.scheduleEmail(
		instanceId,
		{
			to: {
				userId: evaluator.userId,
			},
			subject: `[Unjournal] Final Reminder: Evaluation due tomorrow`,
			message: `<p>Hi {{user.firstName}},</p>
	  <p>This note is a final reminder that your evaluation for "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}" is due tomorrow. Please make sure to submit your evaluation by the deadline.</p>
	  <p>If you haven't already, please submit your evaluation and rating, as well as any specific considerations, using <a href="{{extra.evaluate_link}}">this evaluation form</a>. The form includes instructions and information about the paper/project.</p>
	  <p>If you have any questions, do not hesitate to reach out to me at <a href="mailto:${evaluationManagerEmail}">${evaluationManagerEmail}</a>.</p>
	  <p>Once your evaluation has been submitted and reviewed, we will follow up with details about payment and next steps.</p>
	  <p>Thanks and best wishes,</p>
	  <p>${evaluationManagerName}</p>
	  <p><a href="https://unjournal.org/">Unjournal.org</a></p>`,
			include: {
				pubs: {
					submission: pubId,
				},
				users: {
					invitor: evaluator.invitedBy,
				},
			},
			extra: {
				evaluate_link: `{{instance.actions.evaluate}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}`,
			},
		},
		{ jobKey, runAt }
	);
};

/**
 * Schedules a follow-up to evaluation reminder email to an evaluator.
 * @param instanceId
 * @param instanceConfig
 * @param pubId
 * @param evaluator
 * @returns
 */
export const scheduleFollowUpToFinalEvaluationReminderEmail = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string,
	evaluator: EvaluatorWhoAccepted
) => {
	const deadline = getDeadline(instanceConfig, evaluator);
	const jobKey = makeFollowUpToFinalEvalReminderJobKey(instanceId, pubId, evaluator);
	const runAt = new Date(deadline.getTime() + 6 * (1000 * 60 * 60 * 24));

	return client.scheduleEmail(
		instanceId,
		{
			to: {
				userId: evaluator.userId,
			},
			subject: `[Unjournal] Follow-up: Evaluation overdue, to be reassigned`,
			message: `<p>Hi {{user.firstName}},</p>
	  <p>This note is a reminder that your evaluation for "{{pubs.submission.values["${
			instanceConfig.titleFieldSlug
		}"]}}" is overdue. We are now planning to reassign the evaluation to another evaluator.</p>
	  <p>If you have completed the evaluation but forgot to submit it, please submit your evaluation and rating today using <a href="{{extra.evaluate_link}}">this evaluation form</a>. If we don't hear from you by the end of ${new Date(
			deadline.getTime() + 7 * (1000 * 60 * 60 * 24)
		).toLocaleDateString()}, we will remove you from this assignment and you will no longer be eligible for compensation.</p>
	  <p>If you have any questions, do not hesitate to reach out to me at <a href="mailto:${evaluationManagerEmail}">${evaluationManagerEmail}</a>.</p>
	  <p>Thanks and best wishes,</p>
	  <p>${evaluationManagerName}</p>
	  <p><a href="https://unjournal.org/">Unjournal.org</a></p>`,
			include: {
				pubs: {
					submission: pubId,
				},
				users: {
					invitor: evaluator.invitedBy,
				},
			},
			extra: {
				evaluate_link: `{{instance.actions.evaluate}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}`,
			},
		},
		{ jobKey, runAt }
	);
};

/**
 * Schedules a notice of no submit email to an evaluator.
 * @param instanceId
 * @param instanceConfig
 * @param pubId
 * @param evaluator
 * @returns
 */
export const sendNoticeOfNoSubmitEmail = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string,
	evaluator: EvaluatorWhoAccepted
) => {
	const deadline = getDeadline(instanceConfig, evaluator);
	const jobKey = makeNoticeOfNoSubmitJobKey(instanceId, pubId, evaluator);
	const runAt = new Date(deadline.getTime() + 8 * (1000 * 60 * 60 * 24));

	return client.scheduleEmail(
		instanceId,
		{
			to: {
				userId: evaluator.userId,
			},
			subject: `[Unjournal] Evaluation not submitted for "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}"`,
			message: `<p>Hi {{user.firstName}},</p>
	  <p>This is to inform you that you have not submitted an evaluation for "{{pubs.submission.values["${
			instanceConfig.titleFieldSlug
		}"]}}", which was due on ${new Date(deadline.getTime()).toLocaleDateString()}.</p>
	  <p>If you have completed the evaluation but forgot to submit it, please submit your evaluation and rating today using <a href="{{extra.evaluate_link}}">this evaluation form</a>. If we don't hear from you by the end of ${new Date(
			deadline.getTime()
		).toLocaleDateString()}, we will remove you from this assignment and you will no longer be eligible for compensation.</p>
	  <p>If you have any questions, do not hesitate to reach out to me at <a href="mailto:${evaluationManagerEmail}">${evaluationManagerEmail}</a>.</p>
	  <p>Thanks and best wishes,</p>
	  <p>${evaluationManagerName}</p>
	  <p><a href="https://unjournal.org/">Unjournal.org</a></p>`,
			include: {
				pubs: {
					submission: pubId,
				},
				users: {
					invitor: evaluator.invitedBy,
				},
			},
			extra: {
				evaluate_link: `{{instance.actions.evaluate}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}`,
			},
		},
		{ jobKey, runAt }
	);
};

/**
 * Unschedules all the deadline reminder emails.
 * `client.unscheduleEmail()` returns no-op for emails that have been
 * sent, allowing us to call it without checking if an error
 * @param instanceId
 * @param pubId
 * @param evaluator
 * @returns
 */
export const unscheduleAllDeadlineReminderEmails = async (
	instanceId: string,
	pubId: string,
	evaluator: EvaluatorWhoAccepted
) => {
	const jobKeys = [
		makePromptEvalBonusReminderJobKey(instanceId, pubId, evaluator),
		makeFinalPromptEvalBonusReminderJobKey(instanceId, pubId, evaluator),
		makeEvalReminderJobKey(instanceId, pubId, evaluator),
		makeFinalEvalReminderJobKey(instanceId, pubId, evaluator),
		makeFollowUpToFinalEvalReminderJobKey(instanceId, pubId, evaluator),
		makeNoticeOfNoSubmitJobKey(instanceId, pubId, evaluator),
	];
	return Promise.all(jobKeys.map((jobKey) => client.unscheduleEmail(instanceId, jobKey)));
};

/**
 * Unschedules all emails.
 * @param instanceId
 * @param pubId
 * @param evaluator
 * @returns
 */
export const unscheduleAllManagerEmails = async (
	instanceId: string,
	pubId: string,
	evaluator: EvaluatorWithInvite
) => {
	const jobKeys = [
		makeReminderJobKey(instanceId, pubId, evaluator),
		makeNoReplyJobKey(instanceId, pubId, evaluator),
		makeNoSubmitJobKey(instanceId, pubId, evaluator),
	];
	return Promise.all(jobKeys.map((jobKey) => client.unscheduleEmail(instanceId, jobKey)));
};
