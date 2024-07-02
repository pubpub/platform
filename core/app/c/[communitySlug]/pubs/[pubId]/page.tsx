import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Button } from "ui/button";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import type { PubsId } from "~/kysely/types/public/Pubs";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import IntegrationActions from "~/app/components/IntegrationActions";
import MembersAvatars from "~/app/components/MemberAvatar";
import { PubTitle } from "~/app/components/PubTitle";
import SkeletonTable from "~/app/components/skeletons/SkeletonTable";
import { getLoginData } from "~/lib/auth/loginData";
import { getStage, getStageActions } from "~/lib/db/queries";
import { getPubUsers } from "~/lib/permissions";
import { getPubCached } from "~/lib/server";
import { createToken } from "~/lib/server/token";
import { pubInclude } from "~/lib/types";
import prisma from "~/prisma/db";
import { renderField } from "./components/JsonSchemaHelpers";
import PubChildrenTableWrapper from "./components/PubChldrenTableWrapper";

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
	// TODO: use unstable_cache without chidren not rendereing
	const getPub = (pubId: string) =>
		prisma.pub.findUnique({
			where: { id: pubId },
			include: {
				...pubInclude,
			},
		});
	const pub = await getPub(params.pubId);
	const pub2 = await getPubCached(params.pubId as PubsId);
	if (!pub) {
		return null;
	}
	if (!pub2) {
		return null;
	}
	// console.log("\n\n");
	// console.log("PUB is here with the pubinclude type", pub);
	// console.log("\n\n");
	// console.log("PUB here is the kysely query", pub2);
	// console.log("\n\n");
	// console.log("Valulesa", pub2.values);
	const users = getPubUsers([]);

	const [actionsPromise, stagePromise] =
		pub.stages.length > 0
			? [getStageActions(pub2.stages[0].stageId), getStage(pub2.stages[0].stageId)]
			: [null, null];

	const [actions, stage] = await Promise.all([actionsPromise, stagePromise]);

	return (
		<div className="container mx-auto p-4">
			<div className="pb-6">
				<Link href={`/c/${params.communitySlug}/pubs`}>
					<Button>View all pubs</Button>
				</Link>
			</div>
			<div className="mb-8">
				<h3 className="mb-2 text-xl font-bold">{pub2.pubType.name}</h3>
				<PubTitle pub={pub2} />
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
									pageContext={
										{
											params: params,
											searchParams: undefined,
										} as unknown as PageContext // still need to figure this out
									}
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
				</div>
			</div>
			<Suspense fallback={<SkeletonTable />}>
				<PubChildrenTableWrapper pub={pub} />
			</Suspense>
		</div>
	);
}
