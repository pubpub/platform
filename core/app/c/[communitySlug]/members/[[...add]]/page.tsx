import type { Community } from "@prisma/client";

import { notFound } from "next/navigation";
import { jsonObjectFrom } from "kysely/helpers/postgres";

import type { CommunitiesId } from "db/public";

import type { TableMember } from "./getMemberTableColumns";
import { db } from "~/kysely/database";
import { getPageLoginData } from "~/lib/auth/loginData";
import { isCommunityAdmin } from "~/lib/auth/roles";
import { autoCache } from "~/lib/server/cache/autoCache";
import prisma from "~/prisma/db";
import { AddMember } from "./AddMember";
import { AddMemberDialog } from "./AddMemberDialog";
import { MemberTable } from "./MemberTable";

const getCachedMembers = (community: Community) =>
	autoCache(
		db
			.selectFrom("members")
			.select((eb) => [
				"members.id as id",
				"members.role",
				"members.communityId",
				"createdAt",
				jsonObjectFrom(
					eb
						.selectFrom("users")
						.select([
							"userId as id",
							"users.firstName as firstName",
							"users.lastName as lastName",
							"users.avatar as avatar",
							"users.email as email",
							"users.createdAt as createdAt",
							"users.isSuperAdmin as isSuperAdmin",
							"users.slug as slug",
						])
						.whereRef("users.id", "=", "members.userId")
				)
					.$notNull()
					.as("user"),
			])
			.where("communityId", "=", community.id as CommunitiesId)
	);

export default async function Page({
	params: { communitySlug, add },
	searchParams,
}: {
	params: {
		communitySlug: string;
		// this controls whether the add member dialog is open
		add?: string[];
	};
	searchParams: {
		page?: string;
		email?: string;
	};
}) {
	if (add && add[0] !== "add") {
		return notFound();
	}

	const community = await prisma.community.findUnique({
		where: { slug: communitySlug },
	});

	if (!community) {
		return notFound();
	}

	const { user } = await getPageLoginData();
	const isAdmin = isCommunityAdmin(user, community);

	// we don't want to show the members page to non-admins
	if (!isAdmin) {
		return null;
	}

	const page = parseInt(searchParams.page ?? "1", 10);

	const members = await getCachedMembers(community).execute();

	if (!members.length && page !== 1) {
		return notFound();
	}

	const tableMembers = members.map((member) => {
		const { id, createdAt, user, role } = member;
		return {
			id,
			avatar: user.avatar,
			firstName: user.firstName,
			lastName: user.lastName,
			role,
			email: user.email,
			joined: new Date(createdAt).toLocaleString(),
		} satisfies TableMember;
	});

	return (
		<>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="text-xl font-bold">Members</h1>
				<AddMemberDialog
					community={community}
					open={!!add}
					content={<AddMember community={community} email={searchParams.email} />}
				/>
			</div>
			<MemberTable members={tableMembers} />
		</>
	);
}
