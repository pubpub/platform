import { cache } from "react";

import type {
	CommunitiesId,
	Forms,
	FormsId,
	PubsId,
	PubTypes,
	PubTypesId,
	StagesId,
	UsersId,
} from "db/public";
import { Capabilities, MemberRole, MembershipType } from "db/public";
import { logger } from "logger";

import type { XOR } from "../types";
import type {
	CommunityTargetCapabilities,
	PubTargetCapabilities,
	StageTargetCapabilities,
} from "./capabalities.definition";
import { db } from "~/kysely/database";
import { getLoginData } from "../authentication/loginData";
import { autoCache } from "../server/cache/autoCache";
import { findCommunityBySlug } from "../server/community";
import { getStagesViewableByUser } from "../server/stages";

type CapabilitiesArg = {
	[MembershipType.pub]: PubTargetCapabilities;
	[MembershipType.stage]: StageTargetCapabilities;
	[MembershipType.community]: CommunityTargetCapabilities;
};

export type CapabilityTarget = PubTarget | StageTarget | CommunityTarget;

type PubTarget = {
	type: MembershipType.pub;
	pubId: PubsId;
};

type StageTarget = {
	type: MembershipType.stage;
	stageId: StagesId;
};

type CommunityTarget = {
	type: MembershipType.community;
	communityId: CommunitiesId;
};

const pubMemberships = ({ userId, pubId }: { userId: UsersId; pubId: PubsId }) =>
	db
		.with("stage", (db) =>
			db
				.selectFrom("PubsInStages")
				.where("PubsInStages.pubId", "=", pubId)
				.select("PubsInStages.stageId")
		)
		.with("community", (db) =>
			db.selectFrom("pubs").where("pubs.id", "=", pubId).select("pubs.communityId")
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
						eb.selectFrom("stage").select("stageId")
					)
				)
				.select(["role", "formId"])
		)
		.with("pub_ms", (db) =>
			db
				.selectFrom("pub_memberships")
				.where("pub_memberships.userId", "=", userId)
				.where("pub_memberships.pubId", "=", pubId)
				.select(["role", "formId"])
		)
		.with("community_ms", (db) =>
			db
				.selectFrom("community_memberships")
				.where("community_memberships.userId", "=", userId)
				.whereRef("communityId", "=", db.selectFrom("community").select("communityId"))
				.select(["role", "formId"])
		);

const communityMemberships = ({
	userId,
	communityId,
}: {
	userId: UsersId;
	communityId: CommunitiesId;
}) =>
	db.with("community_ms", (db) =>
		db
			.selectFrom("community_memberships")
			.where("community_memberships.userId", "=", userId)
			.where("community_memberships.communityId", "=", communityId)
			.select(["role", "formId"])
	);

export const userCan = async <T extends CapabilityTarget>(
	capability: CapabilitiesArg[T["type"]],
	target: T,
	userId: UsersId
) => {
	const { user } = await getLoginData();
	if (user?.isSuperAdmin) {
		return true;
	}
	if (target.type === MembershipType.pub) {
		const capabilitiesQuery = pubMemberships({ userId, pubId: target.pubId })
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
		const capabilitiesQuery = communityMemberships({ userId, communityId: target.communityId })
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

export const userCanEditPub = async ({
	userId,
	pubId,
	formId,
	formSlug,
}: {
	userId: UsersId;
	pubId: PubsId;
	formId?: FormsId;
	formSlug?: string;
}) => {
	const forms = await getAuthorizedUpdateForms(userId, pubId).execute();
	logger.debug({
		msg: "Authorized update forms for user",
		userId,
		pubId,
		formId,
		formSlug,
	});
	if (formId) {
		return Boolean(forms.find((form) => form.id === formId));
	}
	if (formSlug) {
		return Boolean(forms.find((form) => form.slug === formSlug));
	}

	return forms.length !== 0;
};

export const userCanCreatePub = async ({
	userId,
	communityId,
	pubTypeId,
	formId,
	formSlug,
}: {
	userId: UsersId;
	communityId: CommunitiesId;
	pubTypeId: PubTypesId;
	formId?: FormsId;
	formSlug?: string;
}) => {
	const forms = await getAuthorizedCreateForms({ userId, communityId, pubTypeId }).execute();
	logger.debug({
		msg: "Authorized create forms for user",
		userId,
		communityId,
		pubTypeId,
		formId,
		formSlug,
		forms,
	});
	if (formId) {
		return Boolean(forms.find((form) => form.id === formId));
	}
	if (formSlug) {
		return Boolean(forms.find((form) => form.slug === formSlug));
	}

	return forms.length !== 0;
};

export const userCanCreateAnyPub = cache(async (userId: UsersId, communityId: CommunitiesId) => {
	const pubTypes = await getCreatablePubTypes(userId, communityId);
	return pubTypes.length !== 0;
});

const authorizedCreateFormsBase = ({
	userId,
	communityId,
}: {
	userId: UsersId;
	communityId: CommunitiesId;
}) =>
	communityMemberships({ userId, communityId })
		.with("capabilities", (db) =>
			db
				.selectFrom("membership_capabilities")
				.where((eb) =>
					eb.and([
						eb(
							"membership_capabilities.role",
							"in",
							eb.selectFrom("community_ms").select("role")
						),
						eb("membership_capabilities.type", "=", MembershipType.community),
						eb("membership_capabilities.capability", "in", [
							Capabilities.createPubWithAnyForm,
							Capabilities.createPubWithForm,
						]),
					])
				)
				.select("capability")
		)
		.selectFrom("forms")
		.where("forms.communityId", "=", communityId)
		.where((eb) =>
			eb.or([
				eb(
					eb.val(Capabilities.createPubWithAnyForm),
					"in",
					eb.selectFrom("capabilities").select("capability")
				),
				eb.and([
					eb(
						eb.val(Capabilities.createPubWithForm),
						"in",
						eb.selectFrom("capabilities").select("capability")
					),
					eb.or([eb("forms.id", "in", eb.selectFrom("community_ms").select("formId"))]),
				]),
			])
		)
		.select(["forms.name", "forms.isDefault", "forms.id", "forms.slug"])
		.orderBy("forms.isDefault desc")
		.orderBy("forms.updatedAt desc");

export const getAuthorizedCreateForms = ({
	userId,
	communityId,
	pubTypeId,
}: {
	userId: UsersId;
	communityId: CommunitiesId;
	pubTypeId: PubTypesId;
}) =>
	autoCache(
		authorizedCreateFormsBase({ userId, communityId }).where("forms.pubTypeId", "=", pubTypeId)
	);

export const getAuthorizedUpdateForms = (userId: UsersId, pubId: PubsId) =>
	autoCache(
		pubMemberships({ userId, pubId })
			.with("capabilities", (db) =>
				db
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
					.where("membership_capabilities.capability", "in", [
						Capabilities.editPubWithAnyForm,
						Capabilities.editPubWithDefaultForm,
						Capabilities.editPubWithForm,
					])
					.select("capability")
			)
			.with("pubtype", (db) =>
				db.selectFrom("pubs").where("pubs.id", "=", pubId).select("pubs.pubTypeId as id")
			)
			.selectFrom("forms")
			.innerJoin("community", "community.communityId", "forms.communityId")
			.whereRef("forms.pubTypeId", "=", (eb) => eb.selectFrom("pubtype").select("id"))
			.where((eb) =>
				eb.or([
					eb(
						eb.val(Capabilities.editPubWithAnyForm),
						"in",
						eb.selectFrom("capabilities").select("capability")
					),
					eb.and([
						eb(
							eb.val(Capabilities.editPubWithForm),
							"in",
							eb.selectFrom("capabilities").select("capability")
						),
						eb.or([
							eb("forms.id", "in", eb.selectFrom("pub_ms").select("formId")),
							eb("forms.id", "in", eb.selectFrom("stage_ms").select("formId")),
						]),
					]),
					eb.and([
						eb(
							eb.val(Capabilities.editPubWithDefaultForm),
							"in",
							eb.selectFrom("capabilities").select("capability")
						),
						eb("forms.isDefault", "is", true),
					]),
				])
			)
			.select(["forms.name", "forms.isDefault", "forms.id", "forms.slug"])
			.orderBy("forms.isDefault desc")
			.orderBy("forms.updatedAt desc")
	);

export const getAuthorizedViewForms = (userId: UsersId, pubId: PubsId) =>
	autoCache(
		getAuthorizedUpdateForms(userId, pubId)
			.qb.clearWhere()
			.where((eb) =>
				eb.or([
					eb(
						eb.val(Capabilities.editPubWithAnyForm),
						"in",
						eb.selectFrom("capabilities").select("capability")
					),
					eb.and([
						eb(
							eb.val(Capabilities.editPubWithForm),
							"in",
							eb.selectFrom("capabilities").select("capability")
						),
						eb.or([
							eb("forms.id", "in", eb.selectFrom("pub_ms").select("formId")),
							eb("forms.id", "in", eb.selectFrom("stage_ms").select("formId")),
						]),
					]),
				])
			)
			.whereRef("forms.pubTypeId", "=", (eb) => eb.selectFrom("pubtype").select("id"))
	);

export type PubTypeWithForm = (Pick<PubTypes, "id" | "name"> & Pick<Forms, "slug" | "isDefault">)[];

export const getCreatablePubTypes = cache(async (userId: UsersId, communityId: CommunitiesId) => {
	return autoCache(
		authorizedCreateFormsBase({ userId, communityId })
			.innerJoin("pub_types", "forms.pubTypeId", "pub_types.id")
			.clearSelect()
			.clearOrderBy()
			.select(["pub_types.id", "pub_types.name", "forms.slug", "forms.isDefault"])
			.distinctOn(["pub_types.id"])
			.orderBy(["pub_types.id", "forms.isDefault desc"])
	).execute();
});

export const userIsCommunityRole = async (role: MemberRole[], communitySlug?: string) => {
	const [{ user }, community] = await Promise.all([
		getLoginData(),
		!communitySlug ? findCommunityBySlug() : findCommunityBySlug(communitySlug),
	]);
	if (!user || !community) {
		return false;
	}
	if (user.isSuperAdmin) {
		return true;
	}

	return user.memberships.some((membership) => role.includes(membership.role));
};

export const userHasAccessToForm = async (
	props: { userId: UsersId; pubId?: PubsId; communityId: CommunitiesId } & XOR<
		{ formId: FormsId },
		{ formSlug: string }
	>
) => {
	if (props.pubId) {
		return userCanEditPub({
			userId: props.userId,
			pubId: props.pubId!,
			formId: props.formId,
			formSlug: props.formSlug,
		});
	}

	const x = await authorizedCreateFormsBase({
		userId: props.userId,
		communityId: props.communityId,
	})
		.$if(!!props.formId, (eb) => eb.where("forms.id", "=", props.formId!))
		.$if(!!props.formSlug, (eb) => eb.where("forms.slug", "=", props.formSlug!))
		.executeTakeFirst();

	return !!x;
};

const userIsCommunityAdminOrEditor = cache(
	async (communitySlug: string | undefined = undefined) => {
		return userIsCommunityRole([MemberRole.admin, MemberRole.editor], communitySlug);
	}
);

export const userCanEditAllPubs = cache(async (communitySlug: string | undefined = undefined) => {
	return userIsCommunityAdminOrEditor(communitySlug);
});

export const userCanArchiveAllPubs = cache(
	async (communitySlug: string | undefined = undefined) => {
		return userIsCommunityAdminOrEditor(communitySlug);
	}
);

export const userCanMoveAllPubs = cache(async (communitySlug: string | undefined = undefined) => {
	return userIsCommunityAdminOrEditor(communitySlug);
});

export const userCanRunActionsAllPubs = cache(
	async (communitySlug: string | undefined = undefined) => {
		return userIsCommunityAdminOrEditor(communitySlug);
	}
);

export const userCanViewAllStages = cache(async (communitySlug: string | undefined = undefined) => {
	return userIsCommunityAdminOrEditor(communitySlug);
});

export const userCanViewStagePage = cache(
	async (
		userId: UsersId,
		communityId: CommunitiesId,
		communitySlug: string | undefined = undefined
	) => {
		const userCanViewAnyStage = await Promise.all([
			getStagesViewableByUser(userId, communityId, communitySlug),
			userIsCommunityAdminOrEditor(communitySlug),
		]);

		return userCanViewAnyStage.some((x) => !!x);
	}
);
