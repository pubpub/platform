import type { Communities, CommunitiesId } from "db/public";

import { getLoginData } from "~/lib/auth/loginData";
import { createCommunityCacheTags } from "~/lib/server/cache/cacheTags";
import { memoize } from "~/lib/server/cache/memoize";
import { getMember } from "~/lib/server/member";
import { getSuggestedUsers } from "~/lib/server/user";
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
	community: Communities;
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

			if (!email) {
				return {
					user: null,
					state: "initial" as const,
					error: "You must provide an email address",
				};
			}

			const [user] = await getSuggestedUsers({
				communityId: community.id as CommunitiesId,
				query: { email },
			}).execute();

			if (!user) {
				return { user: null, state: "user-not-found" as const, error: null };
			}

			const existingMember = await getMember({
				userId: user.id,
				communityId: community.id as CommunitiesId,
			}).executeTakeFirst();

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
			revalidateTags: createCommunityCacheTags(
				["community_memberships", "users"],
				community.slug
			),
		}
	);
};

export type MemberFormState = Awaited<ReturnType<ReturnType<typeof createCachedGetUser>>>;

export const AddMember = async ({
	email,
	community,
}: {
	email?: string;
	community: Communities;
}) => {
	const { user } = await getLoginData();

	const getUserAndMember = createCachedGetUser({
		email,
		currentEmail: user?.email,
		community,
	});

	const state = await getUserAndMember({
		email,
		currentEmail: user?.email,
	});

	return <MemberInviteForm state={state} email={email} isSuperAdmin={user?.isSuperAdmin} />;
};
