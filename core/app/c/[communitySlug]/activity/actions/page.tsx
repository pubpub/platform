import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { jsonObjectFrom } from "kysely/helpers/postgres";

import { logger } from "logger";

import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { pubValuesByRef } from "~/lib/server";
import { autoCache } from "~/lib/server/cache/autoCache";
import { findCommunityBySlug } from "~/lib/server/community";
import { ActionRunsTable } from "./ActionRunsTable";
import { ActionRun } from "./getActionRunsTableColumns";

export default async function Page({
	params: { communitySlug },
}: {
	params: {
		communitySlug: string;
	};
}) {
	const community = await findCommunityBySlug(communitySlug);

	if (!community) {
		return notFound();
	}

	const loginData = await getLoginData();
	const currentCommunityMembership = loginData?.memberships?.find(
		(m) => m.community.slug === communitySlug
	);

	if (!currentCommunityMembership?.canAdmin) {
		return null;
	}

	const actionRuns = (await autoCache(
		db
			.selectFrom("stages")
			.where("stages.communityId", "=", community.id)
			.innerJoin("action_instances", "stages.id", "action_instances.stageId")
			.innerJoin("action_runs", "action_instances.id", "action_runs.actionInstanceId")
			.leftJoin("users", "action_runs.userId", "users.id")
			.select((eb) => [
				"action_runs.id",
				"action_runs.config",
				"action_runs.event",
				"action_runs.params",
				"action_runs.status",
				"action_runs.result",
				"action_runs.createdAt",
				jsonObjectFrom(
					eb
						.selectFrom("action_instances")
						.whereRef("action_instances.id", "=", "action_runs.actionInstanceId")
						.select(["action_instances.name", "action_instances.action"])
				).as("actionInstance"),
				jsonObjectFrom(
					eb
						.selectFrom("stages")
						.whereRef("stages.id", "=", "action_instances.stageId")
						.select(["stages.id", "stages.name"])
				).as("stage"),
				jsonObjectFrom(
					eb
						.selectFrom("pubs")
						.whereRef("pubs.id", "=", "action_runs.pubId")
						.select(["pubs.id", "pubs.createdAt"])
						.select(pubValuesByRef("action_runs.pubId"))
				).as("pub"),
				jsonObjectFrom(
					eb
						.selectFrom("users")
						.whereRef("users.id", "=", "action_runs.userId")
						.select(["id", "firstName", "lastName"])
				).as("user"),
			])
			.orderBy("action_runs.createdAt", "desc")
	).execute()) as ActionRun[];

	return (
		<>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="text-xl font-bold">Action Activity</h1>
			</div>
			<ActionRunsTable actionRuns={actionRuns} />
		</>
	);
}
