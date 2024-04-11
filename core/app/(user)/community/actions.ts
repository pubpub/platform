import { defineServerAction } from "~/lib/server/defineServerAction";
import { isSuperAdmin } from "~/lib/server/user";
import prisma from "~/prisma/db";

export const createCommunity = defineServerAction(async function createCommunity({
	userId,
	name,
	slug,
	avatar,
}: {
	name: string;
	slug: string;
	avatar?: string;
	userId: string;
}) {
	try {
		const superAdmin = await isSuperAdmin(userId); // is this check necessery if hidden behind admin?

		// need to solve what assumptions we should make about our current user profiles.
		// if local the user may not exist in supabase
		// might wanna check if user exists in supabase and if not create them by default in the signup flow
		// for now i think it best to assume a dev can create a user profile
		if (typeof superAdmin === "boolean" && superAdmin) {
			const communityExists = await prisma.community.findFirst({
				where: {
					slug: {
						equals: slug,
					},
				},
			});

			if (communityExists) {
				return {
					title: "Failed to create community",
					error: "Community already exists",
				};
			}

			const c = await prisma.community.create({
				data: {
					name,
					slug,
					avatar,
				},
			}); // revalidate cache tags so update happens eventually

			// add the user as a member of the community
			await prisma.member.create({
				data: {
					userId,
					communityId: c.id,
					canAdmin: true,
				},
			});

			return c;
		}
		return superAdmin;
	} catch (error) {
		return {
			title: "Failed to create community",
			error: "An unexpected error occurred",
			cause: error,
		};
	}
});

export const removeCommunity = defineServerAction(async function removeCommunity({
	id,
}: {
	id: string;
}) {
	try {
		await prisma.community.delete({
			where: {
				id,
			},
		});
	} catch (error) {
		return {
			title: "Failed to remove community",
			error: "An unexpected error occurred",
			cause: error,
		};
	}
});
