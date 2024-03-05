"use server";

import { PubValues } from "@pubpub/sdk";
import { revalidatePath } from "next/cache";
import { expect } from "utils";
import {
	sendSubmittedNotificationEmail,
	unscheduleAllDeadlineReminderEmails,
	unscheduleNoSubmitNotificationEmail,
} from "~/lib/emails";
import { getInstanceConfig, getInstanceState, setInstanceState } from "~/lib/instance";
import { client } from "~/lib/pubpub";
import { cookie } from "~/lib/request";
import { assertHasAccepted } from "~/lib/types";

export const submit = async (instanceId: string, pubId: string, values: PubValues) => {
	try {
		const user = JSON.parse(expect(cookie("user")));
		const instanceConfig = expect(
			await getInstanceConfig(instanceId),
			"Instance not configured"
		);
		const instanceState = (await getInstanceState(instanceId, pubId)) ?? {};
		if (instanceConfig === undefined) {
			return { error: "Instance not configured" };
		}
		let evaluator = expect(
			instanceState[user.id],
			`User was not invited to evaluate pub ${pubId}`
		);
		assertHasAccepted(evaluator);
		const pub = await client.createPub(instanceId, {
			pubTypeId: instanceConfig.pubTypeId,
			parentId: pubId,
			values: values,
		});
		evaluator = instanceState[user.id] = {
			...evaluator,
			status: "received",
			evaluatedAt: new Date().toString(),
			evaluationPubId: pub.id,
		};
		await setInstanceState(instanceId, pubId, instanceState);
		// Unschedule no-submit notification email for manager.
		await unscheduleNoSubmitNotificationEmail(instanceId, pubId, evaluator);
		// unschedule dealine reminder emails.
		await unscheduleAllDeadlineReminderEmails(instanceId, pubId, evaluator);
		// Immediately send submitted notification email.
		await sendSubmittedNotificationEmail(instanceId, instanceConfig, pubId, evaluator);
		revalidatePath("/");
		return { success: true };
	} catch (error) {
		return { error: error.message };
	}
};

export const upload = async (instanceId: string, pubId: string, fileName: string) => {
	try {
		return await client.generateSignedAssetUploadUrl(instanceId, pubId, fileName);
	} catch (error) {
		return { error: error.message };
	}
};
