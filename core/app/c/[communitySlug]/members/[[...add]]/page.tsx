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
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "ui/pagination";

const PAGE_SIZE = 1 as const;

export default async function Page({
	params: { communitySlug, add },
	searchParams,
}: {
	params: {
		communitySlug: string;
		add?: string[];
	};
	searchParams: {
		page?: string;
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

	const existingMembers = await prisma.member.findMany({
		where: {
			community: {
				slug: communitySlug,
			},
		},
		include: {
			user: true,
		},
		skip: (page - 1) * PAGE_SIZE,
		take: PAGE_SIZE + 1,
	});

	if (!existingMembers.length && page !== 1) {
		return notFound();
	}

	const hasMore = existingMembers.length > PAGE_SIZE;
	const needsPagination = page > 1 || hasMore;
	console.log(page);

	return (
		<>
			<div className="flex mb-16 justify-between items-center">
				<h1 className="font-bold text-xl">Members</h1>
				<AddMemberDialog community={community} open={Boolean(add)} />
			</div>
			<Card>
				<CardContent className="flex flex-col gap-y-10 py-4">
					{existingMembers.slice(0, PAGE_SIZE).map((member) => {
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
								<RemoveMemberButton member={member} />
							</div>
						);
					})}
				</CardContent>
			</Card>
			{needsPagination && (
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
			)}
		</>
	);
}
