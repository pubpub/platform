"use server";

import type { PubsId, StagesId, UsersId } from "db/public";
import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";

import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { ApiError } from "~/lib/server";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";

export const move = defineServerAction(async function move(
	pubId: PubsId,
	sourceStageId: StagesId,
	destinationStageId: StagesId
) {
	const loginData = await getLoginData();
	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const { user } = loginData;

	const authorized = await userCan(
		Capabilities.movePub,
		{ type: MembershipType.pub, pubId },
		user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}

	try {
		await autoRevalidate(
			db
				.with("removed_pubsInStages", (db) =>
					db
						.deleteFrom("PubsInStages")
						.where("pubId", "=", pubId)
						.where("stageId", "=", sourceStageId)
				)
				.insertInto("PubsInStages")
				.values([{ pubId: pubId, stageId: destinationStageId }])
		).executeTakeFirstOrThrow();
	} catch {
		return { error: "The Pub was not successully moved" };
	}
});

export const assign = defineServerAction(async function assign(pubId: PubsId, userId?: UsersId) {
	const loginData = await getLoginData();
	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN;
	}

	const { user } = loginData;

	const authorized = await userCan(
		Capabilities.addPubMember,
		{ type: MembershipType.pub, pubId },
		user.id
	);

	if (!authorized) {
		return ApiError.UNAUTHORIZED;
	}

	try {
		await autoRevalidate(
			db
				.updateTable("pubs")
				.where("id", "=", pubId as PubsId)
				.set({
					assigneeId: userId ? (userId as UsersId) : null,
				})
		).executeTakeFirstOrThrow();
	} catch {
		return { error: "The Pub was not successully assigned" };
	}
});
