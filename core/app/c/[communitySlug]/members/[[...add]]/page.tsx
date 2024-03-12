import prisma from "~/prisma/db";
import { getLoginData } from "~/lib/auth/loginData";
import { notFound } from "next/navigation";
import { AddMemberDialog } from "./AddMemberDialog";
import { AddMember } from "./AddMember";
import { unstable_cache } from "next/cache";
import { Community } from "@prisma/client";
import { MemberTable } from "./MemberTable";
import { TableMember } from "./getMemberTableColumns";

const getCachedMembers = (community: Community) =>
	unstable_cache(
		async () => {
			const members = await prisma.member.findMany({
				where: { community: { id: community.id } },
				include: { user: true },
			});

			return members;
		},
		undefined,
		{ tags: [`members_${community.id}`] }
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

	const loginData = await getLoginData();
	const currentCommunityMemberShip = loginData?.memberships?.find(
		(m) => m.community.slug === communitySlug
	);

	// we don't want to show the members page to non-admins
	if (!currentCommunityMemberShip?.canAdmin) {
		return null;
	}

	const page = parseInt(searchParams.page ?? "1", 10);

	const getMembers = getCachedMembers(community);
	const members = await getMembers();
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
			<div className="flex mb-16 justify-between items-center">
				<h1 className="font-bold text-xl">Members</h1>
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
