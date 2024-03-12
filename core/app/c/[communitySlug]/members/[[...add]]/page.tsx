import { Avatar, AvatarImage, AvatarFallback } from "ui/avatar";
import { Card, CardContent } from "ui/card";
import prisma from "~/prisma/db";
import { getLoginData } from "~/lib/auth/loginData";
import { RemoveMemberButton } from "./RemoveMemberButton";
import { notFound } from "next/navigation";
import { AddMemberDialog } from "./AddMemberDialog";
import { Badge } from "ui/badge";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "ui/pagination";
import { AddMember } from "./AddMember";
import { unstable_cache } from "next/cache";
import { Community } from "@prisma/client";
import { MemberTable } from "./MemberTable";
import { TableMember, getMemberTableColumns } from "./getMemberTableColumns";

const PAGE_SIZE = 10 as const;

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
				{/* <AddMember community={community} open={!!add} email={searchParams.email} /> */}
				<AddMemberDialog
					community={community}
					open={!!add}
					content={<AddMember community={community} email={searchParams.email} />}
				/>
			</div>
			<MemberTable members={tableMembers} community={community} />
			{/*	<Card>
				 <CardContent className="flex flex-col gap-y-10 py-4">
					{members.slice(0, PAGE_SIZE).map((member) => {
						const { id, createdAt, user, canAdmin } = member;
						return (
							<div key={id} className="flex justify-between items-center gap-x-4">
								<Avatar>
									<AvatarImage
										src={user.avatar ?? undefined}
										alt={`${user.firstName} ${user.lastName}`}
									/>
									<AvatarFallback>
										{user.firstName[0]}
										{user?.lastName?.[0] ?? ""}
									</AvatarFallback>
								</Avatar>
								<div className="flex flex-col gap-y-1 flex-grow">
									<div>
										<span>
											{user.firstName} {user.lastName}
										</span>
									</div>
									<span className="text-xs">
										Joined on {new Date(createdAt).toLocaleDateString()}
									</span>
								</div>

								{canAdmin && <Badge>admin</Badge>}
								<RemoveMemberButton member={member} community={community} />
							</div>
						);
					})}
				</CardContent> 
			</Card>*/}
			{/* {needsPagination && (
				<Pagination>
					<PaginationContent className="my-4">
						{page > 1 && (
							<>
								<PaginationItem>
									<PaginationPrevious
										href={`/c/${communitySlug}/members?page=${page - 1}}`}
									/>
								</PaginationItem>
								<PaginationItem>
									<PaginationLink
										href={`/c/${communitySlug}/members?page=${page - 1}`}
									>
										{page - 1}
									</PaginationLink>
								</PaginationItem>
							</>
						)}
						<PaginationItem>
							<PaginationLink
								href={`/c/${communitySlug}/members?page=${page}`}
								isActive
							>
								{page}
							</PaginationLink>
						</PaginationItem>
						{hasMore && (
							<>
								<PaginationItem>
									<PaginationLink
										href={`/c/${communitySlug}/members?page=${page + 1}`}
									>
										{page + 1}
									</PaginationLink>
								</PaginationItem>
								<PaginationItem>
									<PaginationNext
										href={`/c/${communitySlug}/members?page=${page + 1}`}
									/>
								</PaginationItem>
							</>
						)}
					</PaginationContent>
				</Pagination>
			)} */}
		</>
	);
}
