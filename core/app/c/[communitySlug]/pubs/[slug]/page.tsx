import Link from "next/link";
import { Button, Avatar, AvatarFallback, AvatarImage } from "ui";
import IntegrationActions from "~/app/components/IntegrationActions";
import { PubTitle } from "~/app/components/PubTitle";
import { getLoginData } from "~/lib/auth/loginData";
import { getPubUsers } from "~/lib/permissions";
import { createToken } from "~/lib/server/token";
import { pubInclude } from "~/lib/types";
import prisma from "~/prisma/db";

const getPubForSlug = async (slug: string) => {
	return await prisma.pub.findUnique({
		where: { slug },
		include: {
			...pubInclude,
		},
	});
};

export default async function Page({
	params,
}: {
	params: { slug: string; communitySlug: string };
}) {
	const loginData = await getLoginData();
	if (!loginData) {
		return null;
	}
	let token;
	token = await createToken(loginData.id);
	if (!params.slug || !params.communitySlug) {
		return null;
	}
	const pub = await getPubForSlug(params.slug);
	if (!pub) {
		return null;
	}
	const users = getPubUsers(pub.permissions);

	return (
		<div>
			<div className="pb-6">
				<Link href={`/c/${params.communitySlug}/pubs`}>
					<Button>View all pubs</Button>
				</Link>
			</div>
			<div className="flex flex-col pb-8">
				<h3>{pub.pubType.name}</h3>
				<PubTitle pub={pub} />
			</div>
			<div className="flex flex-row">
				<div className="w-[900px]">
					{pub.values
						.filter((value) => {
							return value.field.name !== "Title";
						})
						.map((value) => {
							return (
								<div className="" key={value.id}>
									<div className="font-semibold">{value.field.name}</div>
									{/* What does this div actually look like if a value could be a PDF? */}
									<div>{value.value as string}</div>
								</div>
							);
						})}
				</div>
				<div className="h-100% bg-gray-50 w-[250px] p-4 shadow-inner flex flex-col font-semibold">
					<div className="pb-3">
						{/* TODO: build workflow as series of move constraints? */}
						<div>Current Stage</div>
						<div className="indent-4 font-medium">
							{pub.stages.map((stage) => {
								return <div key={stage.id}>{stage.name}</div>;
							})}
						</div>
					</div>
					<div className="pb-3">
						<div>Integrations</div>
						<div>
							<IntegrationActions pub={pub} token={token} />
						</div>
					</div>

					<div className="pb-3">
						<div>Members</div>
						<div className="flex flex-row">
							{users.map((user) => {
								return (
									<div key={user.id}>
										<Avatar className="w-8 h-8 mr-2">
											<AvatarImage src={user.avatar || undefined} />
											<AvatarFallback>{user.name[0]}</AvatarFallback>
										</Avatar>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
