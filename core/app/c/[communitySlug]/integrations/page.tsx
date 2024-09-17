import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { UsersId } from "db/public";
import { AuthTokenType } from "db/public";

import { db } from "~/kysely/database";
import { getPageLoginData } from "~/lib/auth/loginData";
import { pubValuesByRef } from "~/lib/server";
import { autoCache } from "~/lib/server/cache/autoCache";
import { findCommunityBySlug } from "~/lib/server/community";
import { createToken } from "~/lib/server/token";
import IntegrationsList from "./IntegrationsList";

export type IntegrationData = Awaited<ReturnType<typeof getCommunityIntegrations>>;

const getCommunityIntegrations = async (communitySlug: string) => {
	const community = await findCommunityBySlug(communitySlug);
	if (!community) {
		return null;
	}

	return autoCache(
		db
			.selectFrom("integration_instances")
			.selectAll("integration_instances")

			.select((eb) => [
				jsonObjectFrom(
					eb
						.selectFrom("integrations")
						.selectAll("integrations")
						.whereRef("integrations.id", "=", "integration_instances.integrationId")
				)
					.$notNull()
					.as("integration"),
				jsonArrayFrom(
					eb
						.selectFrom("pubs")
						.selectAll("pubs")
						.innerJoin(
							"_IntegrationInstanceToPub",
							"_IntegrationInstanceToPub.B",
							"pubs.id"
						)
						.select(pubValuesByRef("pubs.id"))
						.whereRef("_IntegrationInstanceToPub.A", "=", "integration_instances.id")
				).as("pubs"),
				jsonObjectFrom(
					eb
						.selectFrom("stages")
						.selectAll("stages")
						.whereRef("stages.id", "=", "integration_instances.stageId")
				).as("stage"),
			])
			.where("communityId", "=", community.id)
	).execute();
};

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const { user } = await getPageLoginData();

	const integrations = await getCommunityIntegrations(params.communitySlug);
	if (!integrations) {
		return null;
	}

	const token = await createToken({ userId: user.id as UsersId, type: AuthTokenType.generic });

	return (
		<>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="text-xl font-bold">Integrations</h1>
			</div>
			<IntegrationsList instances={integrations} token={token} />
		</>
	);
}
