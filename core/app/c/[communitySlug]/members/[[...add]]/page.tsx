import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { Community } from "@prisma/client";

import { getLoginData } from "~/lib/auth/loginData";
import prisma from "~/prisma/db";
import { AddMember } from "./AddMember";
import { AddMemberDialog } from "./AddMemberDialog";
import { TableMember } from "./getMemberTableColumns";
import { MemberTable } from "./MemberTable";

const getCachedMembers = async (community: Community) =>
	await unstable_cache(
		async () => {
			const members = await prisma.member.findMany({
				where: { community: { id: community.id } },
				include: { user: true },
			});
			return members;
		},
		[community.id],
		{ tags: [`members_${community.id}`] }
	)();

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

	const loginData = await getLoginData();
	const currentCommunityMemberShip = loginData?.memberships?.find(
		(m) => m.community.slug === communitySlug
	);

	// we don't want to show the members page to non-admins
	if (!currentCommunityMemberShip?.canAdmin) {
		return null;
	}

	const page = parseInt(searchParams.page ?? "1", 10);

	const members = await getCachedMembers(community);
	if (!members.length && page !== 1) {
		return notFound();
	}

	const tableMembers = members.map((member) => {
		const { id, createdAt, user, canAdmin } = member;
		return {
			id,
			avatar: user.avatar,
			firstName: user.firstName,
			lastName: user.lastName,
			admin: canAdmin,
			email: user.email,
			joined: new Date(createdAt),
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
			<MemberTable members={tableMembers} community={community} />
		</>
	);
}
