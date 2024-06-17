import { unstable_cache } from "next/cache";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Button } from "ui/button";

import IntegrationActions from "~/app/components/IntegrationActions";
import MembersAvatars from "~/app/components/MemberAvatar";
import { PubTitle } from "~/app/components/PubTitle";
import { getLoginData } from "~/lib/auth/loginData";
import { getPubUsers } from "~/lib/permissions";
import { getStageActions } from "~/lib/queries/pub";
import { createToken } from "~/lib/server/token";
import { pubInclude } from "~/lib/types";
import prisma from "~/prisma/db";
import { StagePanelPubsRunActionDropDownMenu } from "../../stages/manage/components/panel/StagePanelPubsRunActionDropDownMenu";
import { renderField } from "./components/Helpers";
import { PubChildrenTable } from "./PubChildrenTable";

export default async function Page({
	params,
}: {
	params: { pubId: string; communitySlug: string };
}) {
	const loginData = await getLoginData();
	if (!loginData) {
		return null;
	}
	let token;
	token = await createToken(loginData.id);
	if (!params.pubId || !params.communitySlug) {
		return null;
	}
	const getPub = unstable_cache(
		(pubId: string) =>
			prisma.pub.findUnique({
				where: { id: pubId },
				include: {
					...pubInclude,
				},
			}),
		undefined,
		{ tags: [`pubs_${params.pubId}`] }
	);
	const pub = await getPub(params.pubId);
	if (!pub) {
		return null;
	}
	const users = getPubUsers(pub.permissions);

	const pubChildren = pub.children.map(async (child) => {
		const actions = child.stages[0] ? await getStageActions(child.stages[0].stageId) : null;
		return {
			id: child.id,
			title:
				(child.values.find((value) => value.field.name === "Title")?.value as string) ||
				"Evaluation",
			stage: child.stages[0]?.stageId,
			assignee: child.assigneeId,
			created: new Date(child.createdAt),
			actions: actions ? (
				<StagePanelPubsRunActionDropDownMenu actionInstances={actions} pub={child} />
			) : (
				<div>No actions exist on the pub</div>
			),
		};
	});
	const children = await Promise.all(pubChildren);
	const actions = pub.stages[0] ? await getStageActions(pub.stages[0].stageId) : null;
	return (
		<div className="container mx-auto p-4">
			<div className="pb-6">
				<Link href={`/c/${params.communitySlug}/pubs`}>
					<Button>View all pubs</Button>
				</Link>
			</div>
			<div className="mb-8">
				<h3 className="mb-2 text-xl font-bold">{pub.pubType.name}</h3>
				<PubTitle pub={pub} />
			</div>
			<div className="flex flex-wrap space-x-4">
				<div className="flex-1">
					{pub.values
						.filter((value) => {
							return value.field.name !== "Title";
						})
						.map((value) => {
							return (
								<div className="mb-4" key={value.id}>
									{/* What does this div actually look like if a value could be a PDF? */}
									<div>{renderField(value)}</div>
								</div>
							);
						})}
				</div>
				<div className="w-64 rounded-lg bg-gray-50 p-4 font-semibold shadow-inner">
					<div className="mb-4">
						{/* TODO: build workflow as series of move constraints? */}
						<div className="mb-1 text-lg font-bold">Current Stage</div>
						<div className="ml-4 font-medium">
							{pub.stages.map(({ stage }) => {
								return <div key={stage.id}>{stage.name}</div>;
							})}
						</div>
					</div>
					<div className="mb-4">
						<MembersAvatars pub={pub} />
					</div>
					<div className="mb-4">
						<div className="mb-1 text-lg font-bold">Integrations</div>
						<div>
							<IntegrationActions pub={pub} token={token} />
						</div>
					</div>
					<div className="mb-4">
						<div className="mb-1 text-lg font-bold">Actions</div>
						<div>
							{actions ? (
								<StagePanelPubsRunActionDropDownMenu
									actionInstances={actions}
									pub={pub}
								/>
							) : (
								<div>No actions exist on the pub</div>
							)}
						</div>
					</div>

					<div className="mb-4">
						<div className="mb-1 text-lg font-bold">Members</div>
						<div className="flex flex-row flex-wrap">
							{users.map((user) => {
								return (
									<div key={user.id}>
										<Avatar className="mr-2 h-8 w-8">
											<AvatarImage src={user.avatar || undefined} />
											<AvatarFallback>{user.firstName[0]}</AvatarFallback>
										</Avatar>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
			<PubChildrenTable children={children} />
		</div>
	);
}
