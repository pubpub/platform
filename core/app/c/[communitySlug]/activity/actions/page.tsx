import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";

import type { ActionRun } from "./getActionRunsTableColumns";
import { db } from "~/kysely/database";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { pubType, pubValuesByRef } from "~/lib/server";
import { autoCache } from "~/lib/server/cache/autoCache";
import { findCommunityBySlug } from "~/lib/server/community";
import { ActionRunsTable } from "./ActionRunsTable";

export const metadata: Metadata = {
	title: "Action Log",
};

export default async function Page({
	params: { communitySlug },
}: {
	params: {
		communitySlug: string;
	};
}) {
	const { user } = await getPageLoginData();

	const community = await findCommunityBySlug(communitySlug);
	if (!community) {
		notFound();
	}

	if (
		!(await userCan(
			Capabilities.editCommunity,
			{ type: MembershipType.community, communityId: community.id },
			user.id
		))
	) {
		redirect(`/c/${communitySlug}/unauthorized`);
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
						.select(["pubs.id", "pubs.createdAt", "pubs.title"])
						.whereRef("pubs.id", "=", "action_runs.pubId")
						.select((eb) =>
							jsonArrayFrom(
								eb
									.selectFrom("pub_values")
									.leftJoin("pub_fields", "pub_values.fieldId", "pub_fields.id")
									.select([
										"pub_values.value",
										"pub_fields.name as fieldName",
										"pub_fields.schemaName as schemaName",
										"pub_fields.slug as fieldSlug",
									])
									.whereRef("pub_values.pubId", "=", "pubs.id")
							).as("values")
						)
						.select((eb) => pubType({ eb, pubTypeIdRef: "pubs.pubTypeId" }))
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
