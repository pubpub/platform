import type {
	DeleteQueryBuilder,
	ExpressionBuilder,
	InsertQueryBuilder,
	SelectQueryBuilder,
	UpdateQueryBuilder,
} from "kysely";

import type { CommunitiesId, FormsId, PubsId, StagesId, UsersId } from "db/public";
import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";

import type { XOR } from "../types";
import { db } from "~/kysely/database";

export const pubCapabilities = [
	Capabilities.movePub,
	Capabilities.viewPub,
	Capabilities.deletePub,
	Capabilities.updatePubValues,
	Capabilities.createRelatedPub,
	Capabilities.editPubWithForm,
	Capabilities.addPubMember,
	Capabilities.removePubMember,
	Capabilities.runAction,
] as const;

export const communityCapabilities = [
	Capabilities.createPub,
	Capabilities.createPubField,
	Capabilities.archivePubField,
	Capabilities.editPubField,
	Capabilities.createPubType,
	Capabilities.editPubType,
	Capabilities.deletePubType,
	Capabilities.createStage,
	Capabilities.addCommunityMember,
	Capabilities.removeCommunityMember,
	Capabilities.manageMemberGroups,
	Capabilities.editCommunity,
	Capabilities.createForm,
	Capabilities.createApiToken,
	Capabilities.revokeApiToken,
] as const;
export const stageCapabilities = [
	Capabilities.viewStage,
	Capabilities.manageStage,
	Capabilities.deleteStage,
	Capabilities.addStageMember,
	Capabilities.removeStageMember,
] as const;
export const formCapabilities = [
	Capabilities.createPubWithForm,
	Capabilities.editPubWithForm,
	Capabilities.addFormMember,
	Capabilities.removeFormMember,
	Capabilities.editForm,
	Capabilities.archiveForm,
] as const;

type CapabilitiesArg = {
	[MembershipType.pub]: typeof pubCapabilities;
	[MembershipType.stage]: typeof stageCapabilities;
	[MembershipType.community]: typeof communityCapabilities;
	[MembershipType.form]: typeof formCapabilities;
};

export type CapabilityTarget = PubTarget | StageTarget | CommunityTarget;

type PubTarget = {
	type: MembershipType.pub;
} & XOR<{ slug: string }, { pubId: PubsId }>;

type StageTarget = {
	type: MembershipType.stage;
	stageId: StagesId;
};

type CommunityTarget = {
	type: MembershipType.community;
	communityId: CommunitiesId;
};

type FormTarget = {
	type: MembershipType.form;
	formId: FormsId;
};
type IdLike = `${string}Id`;

export const whereIdOrSlug = <EB extends ExpressionBuilder<any, any>, T extends string>(
	eb: EB,
	table: string,
	idOrSlug: XOR<{ slug: string }, { [K in IdLike]: string }>
) => {
	if ("slug" in idOrSlug) {
		return eb(`${table}.slug`, "=", idOrSlug.slug);
	}
	const { slug, ...id } = idOrSlug;
	const value = Object.values(id)[0];

	return eb(`${table}.id`, "=", value);
};

export const userCan = async <T extends CapabilityTarget>(
	capability: CapabilitiesArg[T["type"]][number],
	target: T,
	userId: UsersId
) => {
	if (target.type === MembershipType.pub) {
		const { type, ...input } = target;

		const capabilitiesQuery = db
			.with("pub", (db) =>
				db
					.selectFrom("pubs")
					.innerJoin("PubsInStages", "pubs.id", "PubsInStages.pubId")
					.where((eb) => whereIdOrSlug(eb, "pubs", input))
					.selectAll("pubs")
					.select("PubsInStages.stageId as stageId")
			)
			.with("stage_ms", (db) =>
				db
					.selectFrom("stage_memberships")
					.where("stage_memberships.userId", "=", userId)
					.where((eb) =>
						eb(
							"stage_memberships.stageId",
							// We use "in" because the db structure allows a pub to be in more than
							// one stage. But we don't actually expect there to be multiple stageIds
							// returned (for now)
							"in",
							eb.selectFrom("pub").select("stageId")
						)
					)
					.select("role")
			)
			.with("pub_ms", (db) =>
				db
					.selectFrom("pub_memberships")
					.where("pub_memberships.userId", "=", userId)
					.where("pub_memberships.pubId", "=", db.selectFrom("pub").select("pub.id"))
					.select("role")
			)
			.with("community_ms", (db) =>
				db
					.selectFrom("community_memberships")
					.where("community_memberships.userId", "=", userId)
					.whereRef("communityId", "=", db.selectFrom("pub").select("communityId"))
					.select("role")
			)

			.selectFrom("membership_capabilities")
			.where((eb) =>
				eb.or([
					eb.and([
						eb(
							"membership_capabilities.role",
							"in",
							eb.selectFrom("stage_ms").select("role")
						),
						eb("membership_capabilities.type", "=", MembershipType.stage),
					]),
					eb.and([
						eb(
							"membership_capabilities.role",
							"in",
							eb.selectFrom("pub_ms").select("role")
						),
						eb("membership_capabilities.type", "=", MembershipType.pub),
					]),
					eb.and([
						eb(
							"membership_capabilities.role",
							"in",
							eb.selectFrom("community_ms").select("role")
						),
						eb("membership_capabilities.type", "=", MembershipType.community),
					]),
				])
			)
			.where("membership_capabilities.capability", "=", capability)
			.limit(1)
			.select("capability");

		return Boolean((await capabilitiesQuery.execute()).length);
	} else if (target.type === MembershipType.stage) {
		const capabilitiesQuery = db
			.with("community", (db) =>
				db
					.selectFrom("stages")
					.where("stages.id", "=", target.stageId)
					.select("stages.communityId")
			)
			.with("stage_ms", (db) =>
				db
					.selectFrom("stage_memberships")
					.where("stage_memberships.userId", "=", userId)
					.where("stage_memberships.stageId", "=", target.stageId)
					.select("role")
			)
			.with("community_ms", (db) =>
				db
					.selectFrom("community_memberships")
					.where("community_memberships.userId", "=", userId)
					.whereRef("communityId", "=", db.selectFrom("community").select("communityId"))
					.select("role")
			)
			.selectFrom("membership_capabilities")
			.where((eb) =>
				eb.or([
					eb.and([
						eb(
							"membership_capabilities.role",
							"in",
							eb.selectFrom("stage_ms").select("role")
						),
						eb("membership_capabilities.type", "=", MembershipType.stage),
					]),
					eb.and([
						eb(
							"membership_capabilities.role",
							"in",
							eb.selectFrom("community_ms").select("role")
						),
						eb("membership_capabilities.type", "=", MembershipType.community),
					]),
				])
			)
			.where("membership_capabilities.capability", "=", capability)
			.limit(1)
			.select("capability");

		return Boolean((await capabilitiesQuery.execute()).length);
	} else if (target.type === MembershipType.community) {
		const capabilitiesQuery = db
			.with("community_ms", (db) =>
				db
					.selectFrom("community_memberships")
					.where("community_memberships.userId", "=", userId)
					.where("community_memberships.communityId", "=", target.communityId)
					.select("role")
			)
			.selectFrom("membership_capabilities")
			.where((eb) =>
				eb.and([
					eb(
						"membership_capabilities.role",
						"in",
						eb.selectFrom("community_ms").select("role")
					),
					eb("membership_capabilities.type", "=", MembershipType.community),
				])
			)
			.where("membership_capabilities.capability", "=", capability)
			.limit(1)
			.select("capability");

		return Boolean((await capabilitiesQuery.execute()).length);
	}
	return false;
};
