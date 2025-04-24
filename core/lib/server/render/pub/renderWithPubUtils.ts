import type { CommunitiesId, CommunityMembershipsId, PubsId, UsersId } from "db/public";
import { AuthTokenType, CoreSchemaType, MemberRole, MembershipType } from "db/public";
import { expect } from "utils";

import type { XOR } from "~/lib/types";
import { db } from "~/kysely/database";
import { env } from "~/lib/env/env";
import { autoCache } from "~/lib/server/cache/autoCache";
import { createFormInviteLink, getForm, grantFormAccess } from "../../form";
import { insertCommunityMemberships } from "../../member";
import { createUserWithMemberships, getUser } from "../../user";

export type RenderWithPubRel = "self";

export type RenderWithPubPub = {
	id: string;
	values: {
		fieldName: string;
		fieldSlug: string;
		value: unknown;
		schemaName: CoreSchemaType;
	}[];
	createdAt: Date;
	title: string | null;
	pubType: {
		name: string;
	};
};

export type RenderWithPubContext = {
	recipient?:
		| {
				id: CommunityMembershipsId;
				user: {
					id: UsersId;
					firstName: string;
					lastName: string | null;
					email: string;
				};
				email?: never;
		  }
		| { id?: never; email: string; user?: never };
	communityId: CommunitiesId;
	communitySlug: string;
	pub: RenderWithPubPub;
};

export const ALLOWED_MEMBER_ATTRIBUTES = ["firstName", "lastName", "email"] as const;

const getPub = (context: RenderWithPubContext, rel?: string) => {
	return context.pub;
};

const getPubValue = (context: RenderWithPubContext, fieldSlug: string, rel?: string) => {
	const pub = getPub(context, rel);
	const pubValue = pub.values.find((value) => value.fieldSlug === fieldSlug);
	return expect(pubValue, `Expected pub to have value for field "${fieldSlug}"`);
};

export const renderFormInviteLink = async (
	{
		formSlug,
		communityId,
		pubId,
		...props
	}: {
		formSlug: string;
		communityId: CommunitiesId;
		pubId: PubsId;
	} & XOR<{ userId: UsersId }, { email: string }>,
	trx = db
) => {
	if (props.userId) {
		await grantFormAccess({ userId: props.userId, communityId, pubId, slug: formSlug }, trx);

		return createFormInviteLink(
			{
				userId: props.userId,
				formSlug,
				communityId,
				pubId,
			},
			trx
		);
	}

	const [form, existingUser] = await Promise.all([
		getForm({ slug: formSlug, communityId }, trx).executeTakeFirstOrThrow(),
		// create new member
		getUser({ email: props.email! }, trx).executeTakeFirst(),
	]);

	let userId = existingUser?.id;

	if (!userId) {
		const newUserCreation = await createUserWithMemberships(
			{
				email: props.email!,
				firstName: "",
				membership: {
					type: MembershipType.pub,
					pubId,
					role: MemberRole.contributor,
					forms: [form.id],
				},
				sendEmail: false,
			},
			trx
		);

		const newUser = await getUser({ email: props.email! }, trx).executeTakeFirstOrThrow(
			() => new Error(`Failed to find newly created user with email ${props.email}`)
		);

		userId = newUser.id;
	}

	await grantFormAccess({ userId, communityId, pubId, slug: formSlug }, trx);

	return createFormInviteLink(
		{
			userId,
			formSlug,
			communityId,
			pubId,
			sessionType: existingUser ? AuthTokenType.generic : AuthTokenType.signup,
		},
		trx
	);
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
	email: string;
	rel?: string;
	text?: string;
};

type LinkFormOptions = {
	form: string;
	text?: string;
};

type LinkUrlOptions = {
	to: string;
	text?: string;
};

type LinkFieldOptions = {
	field: string;
	rel?: string;
	text?: string;
};

type LinkPageOptions = {
	page: string;
	text?: string;
};

export type LinkOptions =
	| LinkEmailOptions
	| LinkFormOptions
	| LinkUrlOptions
	| LinkFieldOptions
	| LinkPageOptions;

const isLinkEmailOptions = (options: LinkOptions): options is LinkEmailOptions => {
	return "email" in options;
};

const isLinkFormOptions = (options: LinkOptions): options is LinkFormOptions => {
	return "form" in options;
};

const isLinkUrlOptions = (options: LinkOptions): options is LinkUrlOptions => {
	return "to" in options;
};

const isLinkFieldOptions = (options: LinkOptions): options is LinkFieldOptions => {
	return "field" in options;
};

const isLinkPageOptions = (options: LinkOptions): options is LinkPageOptions => {
	return "page" in options;
};

const pageLinkHref = {
	pubs: () => `/pubs`,
	currentPub: (context) => `/pubs/${context.pub.id}`,
	stages: () => `/stages`,
} as const satisfies Record<string, (context: RenderWithPubContext) => string>;

export const renderLink = (context: RenderWithPubContext, options: LinkOptions) => {
	let href: string;
	if (isLinkEmailOptions(options)) {
		let to = options.email;
		href = `mailto:${to}`;
	} else if (isLinkFormOptions(options)) {
		// Form hrefs are handled by `ensureFormMembershipAndCreateInviteLink`
		href = "";
	} else if (isLinkUrlOptions(options)) {
		href = options.to;
	} else if (isLinkFieldOptions(options)) {
		href = getPubValue(context, options.field, options.rel).value as string;
	} else if (isLinkPageOptions(options)) {
		const baseUrl = `${env.PUBPUB_URL}/c/${context.communitySlug}`;

		let tempHref = baseUrl;

		if (options.page in pageLinkHref) {
			tempHref = `${baseUrl}${pageLinkHref[options.page as keyof typeof pageLinkHref](context)}`;
		} else {
			tempHref = `${baseUrl}/${options.page}`;
		}

		href = tempHref;
	} else {
		throw new Error("Unexpected link variant");
	}
	return href;
};

export const renderRecipientFirstName = (context: RenderWithPubContext) => {
	return expect(
		context.recipient?.user,
		"Used a recipient token without specifying a recipient user"
	).firstName;
};

export const renderRecipientLastName = (context: RenderWithPubContext) => {
	return (
		expect(
			context.recipient?.user,
			"Used a recipient token without specifying a recipient user"
		).lastName ?? ""
	);
};

export const renderRecipientFullName = (context: RenderWithPubContext) => {
	const lastName = renderRecipientLastName(context);
	return `${renderRecipientFirstName(context)}${lastName && ` ${lastName}`}`;
};
