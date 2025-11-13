import type { Kysely } from "kysely";

import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { Database } from "db/Database";
import type { PubsId } from "db/public";
import { CoreSchemaType } from "db/public";

import { getLoginData } from "~/lib/authentication/loginData";
import { getPubsWithRelatedValues, getPubTypesForCommunity } from "~/lib/server";
import { selectAllCommunityMemberships } from "~/lib/server/member";
import { getPubFields } from "~/lib/server/pubFields";
import { getStages } from "~/lib/server/stages";
import { createSeed } from "../seed/createSeed";

export const exportCommunity = async (slug: string, trx?: Kysely<Database>) => {
	const community = await trx
		?.selectFrom("communities")
		.selectAll("communities")
		.where("slug", "=", slug)
		.executeTakeFirstOrThrow();
	const user = await getLoginData();
	if (!community || !user?.user) {
		throw new Error("Community not found");
	}

	const { fields } = await getPubFields(
		{
			communityId: community.id,
		},
		trx
	).executeTakeFirstOrThrow();

	const pubTypes = await getPubTypesForCommunity(community.id, { limit: 1000_000, trx });
	const users = await selectAllCommunityMemberships({ communityId: community.id }, trx).execute();
	const pubs = await getPubsWithRelatedValues(
		{ communityId: community.id },
		{
			limit: 1000_000,
			withValues: true,
			withPubType: true,
			withStage: true,
			withRelatedPubs: true,
			trx,
		}
	);
	const stages = await getStages(
		{ communityId: community.id, userId: user.user.id },
		{
			withActionInstances: "full",
			trx,
		}
	)
		.qb.select((eb) =>
			jsonArrayFrom(
				eb
					.selectFrom("stage_memberships")
					.selectAll("stage_memberships")
					.whereRef("stage_memberships.stageId", "=", "stages.id")
					.select((eb) =>
						jsonObjectFrom(
							eb
								.selectFrom("users")
								.selectAll("users")
								.whereRef("users.id", "=", "stage_memberships.userId")
						)
							.$notNull()
							.as("user")
					)
			).as("members")
		)
		.execute();

	return createSeed({
		community: {
			id: community.id,
			name: community.name,
			slug: community.slug,
			avatar: community.avatar ?? undefined,
		},
		pubFields: Object.fromEntries(
			Object.entries(fields).map(([id, field]) => [
				field.name,
				{
					schemaName: field.schemaName ?? CoreSchemaType.Null,
					...(field.isRelation ? { relation: true } : {}),
				},
			])
		),
		pubTypes: Object.fromEntries(
			pubTypes.map((pubType) => [
				pubType.name,
				{
					id: pubType.id,
					description: pubType.description,
					fields: Object.fromEntries(
						pubType.fields.map((field) => [
							field.name,
							{
								isTitle: field.isTitle,
							},
						])
					),
				},
			])
		),
		users: Object.fromEntries(
			users.map((user) => [
				user.user.slug,
				{
					firstName: user.user.firstName,
					lastName: user.user.lastName ?? undefined,
					email: user.user.email,
					avatar: user.user.avatar ?? undefined,
					role: user.role,
				},
			])
		),
		stages: Object.fromEntries(
			stages.map((stage) => [
				stage.name,
				{
					id: stage.id,
					members: Object.fromEntries(
						stage.members.map((member) => [member.user.slug, member.role])
					),
					...(stage.actionInstances
						? {
								actions: Object.fromEntries(
									stage.actionInstances.map((actionInstance) => [
										actionInstance.action,
										{
											id: actionInstance.id,
											action: actionInstance.action,
											config: actionInstance.config,
										},
									])
								),
							}
						: {}),
				},
			])
		),

		stageConnections: Object.fromEntries(
			stages.map((stage) => [
				stage.name,
				{
					to: stage.moveConstraints.map((moveConstraint) => moveConstraint.name),
					from: stage.moveConstraintSources.map((moveConstraint) => moveConstraint.name),
				},
			])
		),
		pubs: pubs.map((pub) => ({
			id: pub.id,
			pubType: pub.pubType.name,

			...(pub.stage ? { stage: pub.stage.name } : {}),
			values: pub.values.reduce(
				(acc, value) => {
					if (!value.relatedPubId) {
						acc[value.fieldName] = value.value;
						return acc;
					}

					acc[value.fieldName] = [
						...(acc[value.fieldName] ?? []),
						{ value: value.value, relatedPubId: value.relatedPubId },
					];
					return acc;
				},
				{} as Record<string, unknown | { value: unknown; relatedPubId: PubsId }>
			),
		})),
	});
};
