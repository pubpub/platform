import type { Community } from "@prisma/client";

import { getLoginData } from "~/lib/auth/loginData";
import { getSuggestedMembers } from "~/lib/server";
import { createCommunityCacheTags } from "~/lib/server/cache/cacheTags";
import { memoize } from "~/lib/server/cache/memoize";
import prisma from "~/prisma/db";
import { MemberInviteForm } from "./MemberInviteForm";
import { memberInviteFormSchema } from "./memberInviteFormSchema";

/**
 * Create a cached function to get a user by email
 *
 * @param email
 * @param currentEmail
 * @param community
 * @returns Error state and user state
 */
const createCachedGetUser = ({
	email,
	currentEmail,
	community,
}: {
	email?: string;
	currentEmail?: string;
	community: Community;
}) => {
	if (!email) {
		return () => ({
			user: null,
			state: "initial" as const,
			error: null,
		});
	}

	const parsedEmail = memberInviteFormSchema.shape.email.safeParse(email);
	if (!parsedEmail.success) {
		return () => ({
			user: null,
			state: "initial" as const,
			error: parsedEmail.error.issues[0]?.message,
		});
	}

	if (email === currentEmail) {
		return () => ({
			user: null,
			state: "initial" as const,
			error: "You cannot add yourself as a member",
		});
	}

	return memoize(
		async ({ email, currentEmail }: { email?: string; currentEmail?: string }) => {
			if (email === currentEmail) {
				return {
					user: null,
					state: "initial" as const,
					error: "You cannot add yourself as a member",
				};
			}

			const [user] = await getSuggestedMembers(email);

			if (!user) {
				return { user: null, state: "user-not-found" as const, error: null };
			}

			const existingMember = await prisma.member.findFirst({
				where: {
					userId: user.id,
					communityId: community.id,
				},
			});

			if (existingMember) {
				return {
					user: null,
					state: "initial" as const,
					error: "User is already a member of this community",
				};
			}

			return { user, state: "user-found" as const, error: null };
		},
		{
			revalidateTags: createCommunityCacheTags(["members", "users"], community.slug),
		}
	);
};

export type MemberFormState = Awaited<ReturnType<ReturnType<typeof createCachedGetUser>>>;

export const AddMember = async ({ email, community }: { email?: string; community: Community }) => {
	const loginData = await getLoginData();

	const getUserAndMember = createCachedGetUser({
		email,
		currentEmail: loginData?.email,
		community,
	});

	const state = await getUserAndMember({
		email,
		currentEmail: loginData?.email,
	});

	return (
		<MemberInviteForm
			state={state}
			community={community}
			email={email}
			isSuperAdmin={loginData?.isSuperAdmin}
		/>
	);
};
