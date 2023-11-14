import { client } from "~/lib/pubpub";
import { InstanceConfig, InstanceState, assertHasAccepted } from "~/lib/types";

export const scheduleNoReplyNotificationEmail = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string,
	invitedUserId: string,
	invitorUserId: string
) => {
	// Invitors (and CC'd users) receive one notification after 10 days if the
	// evaluator has neither accepted nor declined the invitiation.
	const jobKey = `send-email-${instanceId}-${pubId}-${invitorUserId}-no-reply`;
	const delayDays = 10;
	const delayMs = delayDays * 24 * 60 * 60 * 1000;
	const runAt = new Date(Date.now() + delayMs);

	await client.scheduleEmail(
		instanceId,
		{
			to: {
				userId: invitorUserId,
			},
			subject: `[Unjournal] No reply from invited evaluator for "{{pubs.pub.values["${instanceConfig.titleFieldSlug}"]}}"`,
			message: `<p>An invited evaluator, {{users.invited.firstName}} {{users.invited.lastName}}, has not responded for {{extra.days}} days to our invitation to evaluate "{{pubs.pub.values["${instanceConfig.titleFieldSlug}"]}}". You may review the status of this and other invitations on the {{extra.manage_link}}.</p>
<p>This is an automated email sent from Unjournal. Please contact <a href="mailto:contact@unjournal.org">contact@unjournal.org</a> with any questions.</p>`,
			include: {
				pubs: {
					pub: pubId,
				},
				users: {
					invited: invitedUserId,
				},
			},
			extra: {
				days: delayDays.toString(),
				manage_link: `<a href="{{instance.actions.manage}}?instanceId={{instance.id}}&pubId={{pub.id}}&token={{user.token}}">Invite Evaluators page</a>`,
			},
		},
		{ jobKey, runAt }
	);
};

export const unscheduleNoReplyNotificationEmail = (
	instanceId: string,
	pubId: string,
	invitorUserId: string
) => {
	const jobKey = `send-email-${instanceId}-${pubId}-${invitorUserId}-no-reply`;
	return client.unscheduleEmail(instanceId, jobKey);
};

export const scheduleReminderEmail = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	instanceState: InstanceState,
	pubId: string,
	invitedUserId: string,
	invitorUserId: string
) => {
	// Inviteds receive a single reminder after 5 days.
	const jobKey = `send-email-${instanceId}-${pubId}-${invitedUserId}-reminder`;
	const delayDays = 5;
	const delayMs = delayDays * 24 * 60 * 60 * 1000;
	const runAt = new Date(Date.now() + delayMs);

	await client.scheduleEmail(
		instanceId,
		{
			to: {
				userId: invitedUserId,
			},
			subject: `Reminder: {{users.invitor.firstName}} {{users.invitor.lastName}} invited you to evaluate "{{pubs.pub.values["${instanceConfig.titleFieldSlug}"]}}" for The Unjournal`,
			message: instanceState[invitedUserId].emailTemplate.message,
			include: {
				users: {
					invitor: invitorUserId,
				},
				pubs: {
					pub: pubId,
				},
			},
		},
		{ jobKey, runAt }
	);
};

export const unscheduleReminderEmail = (
	instanceId: string,
	pubId: string,
	invitedUserId: string
) => {
	const jobKey = `send-email-${instanceId}-${pubId}-${invitedUserId}-reminder`;
	return client.unscheduleEmail(instanceId, jobKey);
};

export const sendAcceptedEmail = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	instanceState: InstanceState,
	pubId: string,
	invitedUserId: string,
	invitorUserId: string
) => {
	const evaluator = instanceState[invitedUserId];
	assertHasAccepted(evaluator);
	const deadlineAt = new Date(evaluator.acceptedAt);
	const deadlineDays = 21;
	const deadlineMs = deadlineDays * 24 * 60 * 60 * 1000;
	deadlineAt.setMinutes(deadlineAt.getMinutes() + deadlineMs);
	await client.sendEmail(instanceId, {
		to: {
			userId: invitedUserId,
		},
		subject: `[Unjournal] Thank you for agreeing to evaluate "{{pubs.pub.values["${instanceConfig.titleFieldSlug}"]}}"`,
		message: `<p>Hi {{users.invited.firstName}} {{users.invited.lastName}},</p>
<p>Thank you for agreeing to evaluate "{{pubs.pub.values["${instanceConfig.titleFieldSlug}"]}}" for <a href="https://unjournal.org/">The Unjournal</a>. Please submit your evaluation and ratings using this evaluation form. The form includes general instructions as well as (potentially) specific considerations for this research and particular issues and priorities for this evaluation.</p>
<p>Please aim to submit your completed evaluation by {{extra.deadline_at}}. If you have any questions, do not hesitate to reach out to me at <a href="mailto:{{users.invitor.email}}">{{users.invitor.email}}</a>.</p>
<p>Once your evaluation has been submitted and reviewed, we will follow up with details about payment and next steps.</p>
<p>Thank you again for your important contribution to the future of science.</p>
<p>Thanks and best wishes,</p>
<p>{{users.invitor.firstName}} {{users.invitor.lastName}}</p>
<p><a href="https://unjournal.org/">Unjournal.org</a></p>`,
		include: {
			pubs: {
				pub: pubId,
			},
			users: {
				invited: invitedUserId,
				invitor: invitorUserId,
			},
		},
		extra: {
			deadline_at: deadlineAt.toLocaleTimeString(),
		},
	});
};

export const sendAcceptedNotificationEmail = async () => {};

export const sendDeclinedNotificationEmail = async () => {};
