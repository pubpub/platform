import { Card, CardContent, Avatar, AvatarImage, AvatarFallback } from "ui";
import prisma from "~/prisma/db";
import { getLoginData } from "~/lib/auth/loginData";
import { RemoveMemberButton } from "./RemoveMemberButton";
import { notFound } from "next/navigation";
import { AddMemberDialog } from "./AddMemberDialog";

export default async function Page({
	params: { communitySlug, add },
}: {
	params: {
		communitySlug: string;
		add?: string[];
	};
}) {
	if (add && add[0] !== "add") {
		return notFound();
	}

	const community = await prisma.community.findUnique({
		where: { slug: communitySlug },
	});

	if (!community) {
		return null;
	}

	const loginData = await getLoginData();
	const currentCommunityMemberShip = loginData?.memberships?.find(
		(m) => m.community.slug === communitySlug
	);

	// we don't want to show the members page to non-admins
	if (!currentCommunityMemberShip?.canAdmin) {
		return null;
	}

	const existingMembers = await prisma.member.findMany({
		where: {
			community: {
				slug: communitySlug,
			},
		},
		include: {
			user: true,
		},
	});

	return (
		<>
			<div className="flex mb-16 justify-between items-center">
				<h1 className="font-bold text-xl">Members</h1>
				<AddMemberDialog community={community} open={Boolean(add)} />
			</div>
			<Card>
				<CardContent className="flex flex-col gap-y-10 py-4">
					{existingMembers.map((member) => {
						const { id, createdAt, user } = member;
						return (
							<div key={id} className="flex justify-between items-center">
								<div className="flex gap-x-4 items-center">
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
									<div className="flex flex-col gap-2">
										<span>
											{user.firstName} {user.lastName}
										</span>
										<span className="text-sm">
											Joined: {new Date(createdAt).toLocaleDateString()}
										</span>
									</div>
								</div>
								<RemoveMemberButton member={member} />
							</div>
						);
					})}
				</CardContent>
			</Card>
		</>
	);
}
