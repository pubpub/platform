import type { MembersId, UsersId } from "db/public";
import { assert, expect } from "utils";

import { addMemberToForm, createFormInviteLink } from "../../form";

const validateRel = (rel: string) => {
	assert(rel === "parent", 'Invalid value for "rel" attribute');
};

export type RenderWithPubPub = {
	id: string;
	values: Record<string, any>;
	assignee?: {
		firstName: string;
		lastName: string | null;
		email: string;
	} | null;
};

export type RenderWithPubContext = {
	recipient: {
		id: MembersId;
		user: {
			id: UsersId;
			firstName: string;
			lastName: string | null;
			email: string;
		};
	};
	communitySlug: string;
	pub: RenderWithPubPub;
	parentPub?: RenderWithPubPub | null;
};

export const renderFormInviteLink = async (
	formSlug: string,
	memberId: MembersId,
	userId: UsersId,
	pubId?: string
) => {
	await addMemberToForm({ memberId, slug: formSlug });
	return createFormInviteLink({ userId, formSlug, pubId });
};

export const buildHrefFromPubValue = (
	context: RenderWithPubContext,
	fieldSlug: string,
	rel?: string
) => {
	let href: string;
	if (typeof rel === "string") {
		validateRel(rel);
		const parentPub = expect(context.parentPub, "Missing parent pub");
		href = parentPub.values[fieldSlug];
	} else {
		href = context.pub.values[fieldSlug];
	}
	assert(href !== undefined, `Missing value for ${fieldSlug}`);
	return href;
};

export const deriveAssigneeFromDirective = (context: RenderWithPubContext, rel?: string) => {
	if (typeof rel === "string") {
		validateRel(rel);
		if (rel === "parent") {
			const parentPub = expect(context.parentPub, "Missing parent pub");
			return expect(parentPub.assignee, "Parent pub has no assignee");
		}
	}
	return expect(context.pub.assignee, "Pub has no assignee");
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
			const assignee = deriveAssigneeFromDirective(context, options.rel);
			to = assignee.email;
		}
		href = `mailto:${to}`;
	} else if (isLinkFormOptions(options)) {
		// Form hrefs are handled by `ensureFormMembershipAndCreateInviteLink`
		href = "";
	} else if (isLinkUrlOptions(options)) {
		href = options.url;
	} else if (isLinkFieldOptions(options)) {
		href = buildHrefFromPubValue(context, options.field, options.rel);
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
	const assignee = deriveAssigneeFromDirective(context, rel);
	return assignee.firstName;
};

export const renderAssigneeLastName = (context: RenderWithPubContext, rel?: string) => {
	const assignee = deriveAssigneeFromDirective(context, rel);
	return assignee.lastName ?? "";
};

export const renderAssigneeFullName = (context: RenderWithPubContext, rel?: string) => {
	const lastName = renderAssigneeLastName(context);
	return `${renderAssigneeFirstName(context)}${lastName && ` ${lastName}`}`;
};
