import {
	Button,
	Card,
	CardContent,
	Icon,
	Dialog,
	DialogTrigger,
	DialogContent,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	Avatar,
	AvatarImage,
	AvatarFallback,
} from "ui";
import prisma from "~/prisma/db";
import { MemberInviteForm } from "./MemberInviteForm";
import { getLoginData } from "~/lib/auth/loginData";
import { RemoveMemberButton } from "./RemoveMemberButton";
import { UserFetch } from "./UserFetch";
import { notFound, redirect } from "next/navigation";

export default async function Page({
	params: { communitySlug, add },
	searchParams,
}: {
	params: {
		communitySlug: string;
		add?: string[];
	};
	searchParams;
}) {
	if (add && add[0] !== "add") {
		notFound();
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
				<Dialog
					open={Boolean(add)}
					onOpenChange={async (open) => {
						"use server";
						redirect(`/c/${communitySlug}/members${open ? "/add" : ""}`);
					}}
				>
					<TooltipProvider>
						<Tooltip>
							<TooltipContent> Add a user to your community</TooltipContent>
							<TooltipTrigger asChild>
								<DialogTrigger asChild>
									<Button variant="outline" className="flex items-center gap-x-2">
										<Icon.UserPlus size="16" /> Add Member
									</Button>
								</DialogTrigger>
							</TooltipTrigger>
						</Tooltip>
					</TooltipProvider>
					<DialogContent>
						<MemberInviteForm community={community}>
							<UserFetch email={searchParams.email} />
						</MemberInviteForm>
					</DialogContent>
				</Dialog>
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
											src={user.avatar}
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
