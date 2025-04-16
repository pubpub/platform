"use server";

import type { PubsId, StagesId } from "db/public";
import { Capabilities, MembershipType } from "db/public";

import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { ApiError } from "~/lib/server";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { movePub } from "~/lib/server/stages";

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
		await movePub(pubId, destinationStageId).execute();
	} catch {
		return { error: "The Pub was not successully moved" };
	}
});
