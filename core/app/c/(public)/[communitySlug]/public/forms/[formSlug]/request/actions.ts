"use server";

import type { FormsId, Users, UsersId } from "db/public";
import { MemberRole } from "db/public";
import { logger } from "logger";
import { assert } from "utils";

import type { XOR } from "~/lib/types";
import { createUserWithMembership } from "~/app/c/[communitySlug]/members/[[...add]]/actions";
import { createMagicLink } from "~/lib/auth/createMagicLink";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { addUserToForm, getForm, userHasPermissionToForm } from "~/lib/server/form";
import { smtpclient } from "~/lib/server/mailgun";
import { getUser } from "~/lib/server/user";

/**
 * @throws Error if only userId is supplied and user not found
 */
const resolveUser = async (
	props: XOR<{ userId: UsersId }, { email: string; firstName: string; lastName: string }>
) => {
	const existingUser = await getUser(
		props.userId !== undefined ? { id: props.userId } : { email: props.email }
	).executeTakeFirst();

	if (existingUser) {
		return existingUser;
	}

	if (props.userId !== undefined) {
		logger.error(`No user found with id ${props.userId}`);
		throw new Error(`No user found with id ${props.userId}`);
	}

	const community = await findCommunityBySlug();
	assert(community, "Community not found");

	const newUser = await createUserWithMembership({
		email: props.email,
		firstName: props.firstName,
		lastName: props.lastName,
		community,
		role: MemberRole.contributor,
		isSuperAdmin: false,
	});

	if (!("user" in newUser)) {
		throw new Error("Failed to create user");
	}

	assert(newUser.user);

	return newUser.user as Users;
};

export const inviteUserToForm = defineServerAction(async function inviteUserToForm({
	email,
	...formSlugOrId
}: {
	email: string;
} & XOR<{ slug: string }, { id: FormsId }>) {
	const form = await getForm(formSlugOrId).executeTakeFirst();

	if (!form) {
		return { error: `No form found with ${formSlugOrId}` };
	}

	const user = await resolveUser({ email, firstName: "test", lastName: "test" });

	const canAccessForm = await userHasPermissionToForm({
		userId: user.id,
		formId: form.id,
	});

	if (!canAccessForm) {
		try {
			await addUserToForm({ userId: user.id, slug: form.slug }).executeTakeFirstOrThrow();
		} catch (error) {
			logger.error({ msg: "error adding user to form", error });
			return { error: `You do not have permission to access form ${form.slug}` };
		}
	}

	const communitySlug = getCommunitySlug();

	const link = await createMagicLink({
		email,
		path: `/c/${communitySlug}/public/forms/${form.slug}?email=${email}`,
	});

	await smtpclient.sendMail({
		from: "hello@pubpub.org",
		to: email,
		subject: "Link to form",
		text: link,
	});
});
