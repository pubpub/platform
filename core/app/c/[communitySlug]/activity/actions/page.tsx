import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { jsonObjectFrom } from "kysely/helpers/postgres";

import { logger } from "logger";

import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { pubValuesByRef } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { ActionRunsTable } from "./ActionRunsTable";
import { ActionRun } from "./getActionRunsTableColumns";

export default async function Page({
	params: { communitySlug },
	searchParams,
}: {
	params: {
		communitySlug: string;
	};
	searchParams: {
		page?: string;
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

	const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
	const limit = 20;
	const actionRuns = (await unstable_cache(
		() =>
			db
				.selectFrom("stages")
				.where("stages.community_id", "=", community.id)
				.innerJoin("action_instances", "stages.id", "action_instances.stage_id")
				.innerJoin("action_runs", "action_instances.id", "action_runs.action_instance_id")
				.innerJoin("users", "action_runs.user_id", "users.id")
				.select((eb) => [
					"action_runs.id",
					"action_runs.config",
					"action_runs.event",
					"action_runs.params",
					"action_runs.status",
					"action_runs.created_at as createdAt",
					jsonObjectFrom(
						eb
							.selectFrom("action_instances")
							.whereRef("action_instances.id", "=", "action_runs.action_instance_id")
							.select(["name", "action"])
					).as("actionInstance"),
					jsonObjectFrom(
						eb
							.selectFrom("stages")
							.whereRef("stages.id", "=", "action_instances.stage_id")
							.select(["id", "name"])
					).as("stage"),
					jsonObjectFrom(
						eb
							.selectFrom("pubs")
							.whereRef("pubs.id", "=", "action_runs.pub_id")
							.select(["id", "created_at as createdAt"])
							.select(pubValuesByRef("action_runs.pub_id"))
					).as("pub"),
					jsonObjectFrom(
						eb
							.selectFrom("users")
							.whereRef("users.id", "=", "action_runs.user_id")
							.select(["id", "firstName", "lastName"])
					).as("user"),
				])
				.orderBy("action_runs.created_at", "desc")
				.limit(limit)
				.offset(page * limit - limit)
				.execute(),
		[community.id],
		{ tags: [`action_runs_${community.id}`] }
	)()) as ActionRun[];

	logger.info("Action runs", actionRuns);

	return <ActionRunsTable actionRuns={actionRuns} />;
}
