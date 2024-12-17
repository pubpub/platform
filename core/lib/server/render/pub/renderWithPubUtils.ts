import type { CommunitiesId, CommunityMembershipsId, PubsId, UsersId } from "db/public";
import { CoreSchemaType } from "db/public";
import { assert, expect } from "utils";

import { db } from "~/kysely/database";
import { autoCache } from "~/lib/server/cache/autoCache";
import { addMemberToForm, createFormInviteLink } from "../../form";

export type RenderWithPubRel = "parent" | "self";

export type RenderWithPubPub = {
	id: string;
	values: Record<string, any>;
	createdAt: Date;
	assignee?: {
		firstName: string;
		lastName: string | null;
		email: string;
	} | null;
	title: string | null;
	pubType: {
		name: string;
	};
};

export type RenderWithPubContext = {
	recipient: {
		id: CommunityMembershipsId;
		user: {
			id: UsersId;
			firstName: string;
			lastName: string | null;
			email: string;
		};
	};
	communityId: CommunitiesId;
	communitySlug: string;
	pub: RenderWithPubPub;
	parentPub?: RenderWithPubPub | null;
};

export const ALLOWED_MEMBER_ATTRIBUTES = ["firstName", "lastName", "email"] as const;

const parseRel = (rel: string | undefined): RenderWithPubRel => {
	if (rel === undefined) {
		return "self";
	}
	assert(rel === "parent" || rel === "self", 'Invalid value for "rel" attribute');
	return rel;
};

const getPub = (context: RenderWithPubContext, rel?: string) => {
	const parsedRel = parseRel(rel);
	if (parsedRel === "parent") {
		return expect(context.parentPub, 'Expected pub to have parent when rel is "parent"');
	} else {
		return context.pub;
	}
};

const getAssignee = (context: RenderWithPubContext, rel?: string) => {
	const pub = getPub(context, rel);
	return expect(pub.assignee, `Expected pub to have assignee`);
};

const getPubValue = (context: RenderWithPubContext, fieldSlug: string, rel?: string) => {
	const pub = getPub(context, rel);
	const pubValue = pub.values[fieldSlug];
	return expect(pubValue, `Expected pub to have value for field "${fieldSlug}"`);
};

export const renderFormInviteLink = async ({
	formSlug,
	userId,
	communityId,
	pubId,
}: {
	formSlug: string;
	userId: UsersId;
	communityId: CommunitiesId;
	pubId: PubsId;
}) => {
	await addMemberToForm({ userId, communityId, pubId, slug: formSlug });
	return createFormInviteLink({ userId, formSlug, communityId, pubId });
};

export const renderMemberFields = async ({
	fieldSlug,
	attributes,
	memberId,
	communitySlug,
}: {
	fieldSlug: string;
	communitySlug: string;
	attributes: string[];
	memberId: CommunityMembershipsId;
}) => {
	// Make sure this field is a member type
	const fieldIsMemberTypeQuery = autoCache(
		db
			.selectFrom("pub_fields")
			.innerJoin("communities", "pub_fields.communityId", "communities.id")
			.where("pub_fields.slug", "=", fieldSlug)
			.where("communities.slug", "=", communitySlug)
			.where("pub_fields.schemaName", "=", CoreSchemaType.MemberId)
	);

	const userQuery = autoCache(
		db
			.selectFrom("community_memberships")
			.innerJoin("users", "users.id", "community_memberships.userId")
			.select(ALLOWED_MEMBER_ATTRIBUTES)
			.where("community_memberships.id", "=", memberId)
	);

	const [, user] = await Promise.all([
		fieldIsMemberTypeQuery.executeTakeFirstOrThrow(
			() => new Error(`Field ${fieldSlug} is not a member type`)
		),
		userQuery.executeTakeFirstOrThrow(
			() => new Error(`Did not find user with member ID "${memberId}"`)
		),
	]);

	const relevantAttrs = attributes.filter(
		(attr): attr is (typeof ALLOWED_MEMBER_ATTRIBUTES)[number] =>
			(ALLOWED_MEMBER_ATTRIBUTES as ReadonlyArray<string>).includes(attr)
	);
	if (relevantAttrs.length) {
		return relevantAttrs.map((attr) => user[attr]).join(" ");
	}

	return memberId;
};

type LinkEmailOptions = {
	address: string;
	rel?: string;
};

type LinkFormOptions = {
	form: string;
};

type LinkUrlOptions = {
	url: string;
};

type LinkFieldOptions = {
	field: string;
	rel?: string;
};

type LinkOptions = LinkEmailOptions | LinkFormOptions | LinkUrlOptions | LinkFieldOptions;

const isLinkEmailOptions = (options: LinkOptions): options is LinkEmailOptions => {
	return "address" in options;
};

const isLinkFormOptions = (options: LinkOptions): options is LinkFormOptions => {
	return "form" in options;
};

const isLinkUrlOptions = (options: LinkOptions): options is LinkUrlOptions => {
	return "url" in options;
};

const isLinkFieldOptions = (options: LinkOptions): options is LinkFieldOptions => {
	return "field" in options;
};

export const renderLink = (context: RenderWithPubContext, options: LinkOptions) => {
	let href: string;
	if (isLinkEmailOptions(options)) {
		let to = options.address;
		// If the user defines the recipient as `"assignee"`, the pub must have an
		// assignee for the email to be sent.
		if (to === "assignee") {
			const assignee = getAssignee(context, options.rel);
			to = assignee.email;
		}
		href = `mailto:${to}`;
	} else if (isLinkFormOptions(options)) {
		// Form hrefs are handled by `ensureFormMembershipAndCreateInviteLink`
		href = "";
	} else if (isLinkUrlOptions(options)) {
		href = options.url;
	} else if (isLinkFieldOptions(options)) {
		href = getPubValue(context, options.field, options.rel);
	} else {
		throw new Error("Unexpected link variant");
	}
	return href;
};

export const renderRecipientFirstName = (context: RenderWithPubContext) => {
	return context.recipient.user.firstName;
};

export const renderRecipientLastName = (context: RenderWithPubContext) => {
	return context.recipient.user.lastName ?? "";
};

export const renderRecipientFullName = (context: RenderWithPubContext) => {
	const lastName = renderRecipientLastName(context);
	return `${renderRecipientFirstName(context)}${lastName && ` ${lastName}`}`;
};

export const renderAssigneeFirstName = (context: RenderWithPubContext, rel?: string) => {
	const assignee = getAssignee(context, rel);
	return assignee.firstName;
};

export const renderAssigneeLastName = (context: RenderWithPubContext, rel?: string) => {
	const assignee = getAssignee(context, rel);
	return assignee.lastName ?? "";
};

export const renderAssigneeFullName = (context: RenderWithPubContext, rel?: string) => {
	const lastName = renderAssigneeLastName(context);
	return `${renderAssigneeFirstName(context)}${lastName && ` ${lastName}`}`;
};
