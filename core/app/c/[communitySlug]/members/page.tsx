import { Card, CardContent } from "ui";
import prisma from "~/prisma/db";
import Image from "next/image";

export default async function Page({
	params: { communitySlug },
}: {
	params: {
		communitySlug: string;
	};
}) {
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
				{/* <Link href="stages/dashboard">Manage Stages</Link> */}
			</div>
			<Card>
				<CardContent className="flex flex-col gap-y-10 py-4">
					{existingMembers.map(({ user, id, canAdmin, createdAt }) => (
						<div key={id} className="flex gap-x-4 items-center">
							<Image src={user.avatar} width="50" height="50" />
							<div className="flex flex-col gap-2">
								<span>
									{user.firstName} {user.lastName}
								</span>
								<span className="text-sm">
									Joined: {new Date(createdAt).toLocaleDateString()}
								</span>
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</>
	);
}
