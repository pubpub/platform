import { client } from "~/lib/pubpub";
import {
	EvaluatorWhoAccepted,
	EvaluatorWhoEvaluated,
	EvaluatorWithInvite,
	InstanceConfig,
} from "~/lib/types";

const DAYS_TO_ACCEPT_INVITE = 10;
const DAYS_TO_REMIND_EVALUATOR = 5;

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

const notificationFooter =
	'<p><em>This is an automated email sent from Unjournal. Please contact <a href="mailto:contact@unjournal.org">contact@unjournal.org</a> with any questions.</em></p>';

const makeReminderJobKey = (instanceId: string, pubId: string, evaluator: EvaluatorWithInvite) =>
	`send-email-${instanceId}-${pubId}-${evaluator.userId}-reminder`;

const makeNoReplyJobKey = (instanceId: string, pubId: string, evaluator: EvaluatorWithInvite) =>
	`send-email-${instanceId}-${pubId}-${evaluator.userId}-${evaluator.invitedBy}-no-reply`;

const makeNoSubmitJobKey = (instanceId: string, pubId: string, evaluator: EvaluatorWithInvite) =>
	`send-email-${instanceId}-${pubId}-${evaluator.userId}-no-submit`;

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

export const unscheduleNoReplyNotificationEmail = (
	instanceId: string,
	pubId: string,
	evaluator: EvaluatorWithInvite
) => {
	const jobKey = makeNoReplyJobKey(instanceId, pubId, evaluator);
	return client.unscheduleEmail(instanceId, jobKey);
};

export const scheduleNoSubmitNotificationEmail = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string,
	evaluator: EvaluatorWhoAccepted
) => {
	const jobKey = makeNoSubmitJobKey(instanceId, pubId, evaluator);
	const runAt = evaluator.deadline;

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
				due_at: evaluator.deadline.toLocaleDateString(),
				manage_link: `<a href="{{instance.actions.manage}}?instanceId={{instance.id}}&pubId={{pubs.submission.id}}&token={{user.token}}">Invite Evaluators page</a>`,
			},
		},
		{ jobKey, runAt }
	);
};

export const unscheduleNoSubmitNotificationEmail = (
	instanceId: string,
	pubId: string,
	evaluator: EvaluatorWithInvite
) => {
	const jobKey = makeNoSubmitJobKey(instanceId, pubId, evaluator);
	return client.unscheduleEmail(instanceId, jobKey);
};

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

export const scheduleReminderEmail = async (
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
			subject: `Reminder: {{users.invitor.firstName}} {{users.invitor.lastName}} invited you to evaluate "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}" for The Unjournal`,
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

export const unscheduleReminderEmail = (
	instanceId: string,
	pubId: string,
	evaluator: EvaluatorWithInvite
) => {
	const jobKey = makeReminderJobKey(instanceId, pubId, evaluator);
	return client.unscheduleEmail(instanceId, jobKey);
};

export const sendAcceptedEmail = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string,
	evaluator: EvaluatorWhoAccepted
) => {
	await client.sendEmail(instanceId, {
		to: {
			userId: evaluator.userId,
		},
		subject: `[Unjournal] Thank you for agreeing to evaluate "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}"`,
		message: `<p>Hi {{user.firstName}} {{user.lastName}},</p>
		<p>Thank you for agreeing to evaluate "{{pubs.submission.values["${
			instanceConfig.titleFieldSlug
		}"]}}" for <a href="https://unjournal.org/">The Unjournal</a>. Please submit your evaluation and ratings using {{extra.evaluate_link}}. The form includes general instructions as well as (potentially) specific considerations for this research and particular issues and priorities for this evaluation.</p>
		<p>We strongly encourage evaluators to complete evaluations within three weeks; relatively quick turnaround is an important part of The Unjournal model, for the benefit of authors, research-users, and the evaluation ecosystem. If you submit the evaluation within that window (by ${new Date(
			evaluator.deadline.getTime() - 21 * (1000 * 60 * 60 * 24)
		).toLocaleDateString()}), you will receive a $100 “prompt evaluation bonus.” After five ${new Date(
			evaluator.deadline.getTime()
		).toLocaleDateString()}, we will consider re-assigning the evaluation, and later submissions may not be eligible for the full baseline compensation.</p>
		<p>If you have any questions, do not hesitate to reach out to me at <a href="mailto:{{users.invitor.email}}">{{users.invitor.email}}</a>.</p>
		<p>Once your evaluation has been submitted and reviewed, we will follow up with details about payment and next steps.</p>
		<p>Thank you again for your important contribution to the future of science.</p>
		<p>Thanks and best wishes,</p>
		<p>{{users.invitor.firstName}} {{users.invitor.lastName}}</p>
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
			due_at: evaluator.deadline.toLocaleDateString(),
		},
	});
};

export const sendRequestedInfoNotification = (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string,
	evaluator: EvaluatorWithInvite
) => {
	return client.sendEmail(instanceId, {
		to: {
			userId: evaluator.invitedBy,
		},
		subject: `[Unjournal] More Information Request for "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}"`,
		message: `<p>An invited evaluator, {{users.evaluator.firstName}} {{users.evaluator.lastName}}, for "{{pubs.submission.values["${instanceConfig.titleFieldSlug}"]}}", has requested more information. You may contact them at <a href="mailto:{{users.evaluator.email}}">{{users.evaluator.email}}</a>.</p>
${notificationFooter}`,
		include: {
			pubs: {
				submission: pubId,
			},
			users: {
				evaluator: evaluator.userId,
			},
		},
	});
};

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
