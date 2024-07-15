import { Suspense } from "react";
import { notFound } from "next/navigation";

import { CommunitiesId, PubsId } from "db/public";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import type { PubsId } from "~/kysely/types/public/Pubs";
import Assign from "~/app/c/[communitySlug]/stages/components/Assign";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import IntegrationActions from "~/app/components/IntegrationActions";
import MembersAvatars from "~/app/components/MemberAvatar";
import { PubCreateButton } from "~/app/components/PubCRUD/PubCreateButton";
import { PubTitle } from "~/app/components/PubTitle";
import SkeletonTable from "~/app/components/skeletons/SkeletonTable";
import { getLoginData } from "~/lib/auth/loginData";
import { getCommunityBySlug, getStage, getStageActions } from "~/lib/db/queries";
import { getPubUsers } from "~/lib/permissions";
import { createToken } from "~/lib/server/token";
import { pubInclude } from "~/lib/types";
import prisma from "~/prisma/db";
import { renderField } from "./components/JsonSchemaHelpers";
import PubChildrenTableWrapper from "./components/PubChldrenTableWrapper";
import { getPubOnTheIndividualPubPage } from "./queries";





export default async function Page({
	params,
	searchParams,
}: {
	params: { pubId: string; communitySlug: string };
	searchParams: Record<string, string>;
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
	// TODO: use unstable_cache without chidren not rendereing
	const getPub = (pubId: string) =>
		prisma.pub.findUnique({
			where: { id: pubId },
			include: {
				...pubInclude,
			},
		});

	const pub = await getPub(params.pubId);
	const alsoPubs = await getPubOnTheIndividualPubPage(params.pubId as PubsId);

	console.log("\n\n");
	console.log("PUB is here prisma", pub);
	console.log("\n\n");
	console.log("PUB here is the kysely", alsoPubs);
	console.log("\n\n");

	if (!pub) {
		return null;
	}
	const users = getPubUsers(pub.permissions);
	const community = await getCommunityBySlug(params.communitySlug);

	if (community === null) {
		notFound();
	}

	const [actionsPromise, stagePromise] =
		alsoPubs.stages.length > 0
			? [getStageActions(alsoPubs.stages[0].stageId), getStage(alsoPubs.stages[0].stageId)]
			: [null, null];

	const [actions, stage] = await Promise.all([actionsPromise, stagePromise]);

	return (
		<>
			<div className="mb-8">
				<h3 className="mb-2 text-xl font-bold">{alsoPubs.pubType?.name}</h3>
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
									<div>{renderField(value)}</div>
								</div>
							);
						})}
				</div>
				<div className="w-64 rounded-lg bg-gray-50 p-4 font-semibold shadow-inner">
					<div className="mb-4">
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
						{actions && actions.length > 0 && stage ? (
							<div>
								<PubsRunActionDropDownMenu
									actionInstances={actions}
									pub={pub}
									stage={stage!}
									pageContext={{
										params: params,
										searchParams,
									}}
								/>
							</div>
						) : (
							<div className="ml-4 font-medium">
								Configure actions to run for this Pub in the stage management
								settings
							</div>
						)}
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
					<div className="mb-4">
						<div className="mb-1 text-lg font-bold">Assignee</div>
						<div className="ml-4">
							<Assign members={community.members} pub={pub} />
						</div>
					</div>
				</div>
			</div>
			<PubCreateButton
				communityId={community.id as CommunitiesId}
				parentId={pub.id as PubsId}
			/>
			<Suspense fallback={<SkeletonTable /> /* does not exist yet */}>
				<PubChildrenTableWrapper pub={pub} members={community.members} />
			</Suspense>
		</>
	);
}