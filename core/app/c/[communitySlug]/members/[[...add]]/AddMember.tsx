import { Community } from "@prisma/client";
import { AddMemberDialog } from "./AddMemberDialog";
import { getSuggestedMembers } from "~/lib/server";
import prisma from "~/prisma/db";
import { getLoginData } from "~/lib/auth/loginData";
import { unstable_cache } from "next/cache";

const getUserAndMember = unstable_cache(
	async ({
		email,
		community,
		currentEmail,
	}: {
		email?: string;
		community: Community;
		currentEmail?: string;
	}) => {
		if (email === currentEmail) {
			return {
				user: "you" as const,
				error: "You cannot add yourself as a member",
			};
		}

		const [user] = await getSuggestedMembers(email);

		if (!user) {
			return { user: null };
		}

		const existingMember = await prisma.member.findFirst({
			where: {
				userId: user.id,
				communityId: community.id,
			},
		});

		if (existingMember) {
			return {
				user: "existing-member" as const,
				error: "User is already a member of this community",
			};
		}

		return { user };
	}
);

export const AddMember = async ({
	email,
	community,
	open,
}: {
	email?: string;
	community: Community;
	open: boolean;
}) => {
	const loginData = await getLoginData();

	const { user, error } = await getUserAndMember({
		email,
		community,
		currentEmail: loginData?.email,
	});

	return (
		<AddMemberDialog
			user={user}
			error={error}
			open={open}
			community={community}
			email={email}
		/>
	);
};
