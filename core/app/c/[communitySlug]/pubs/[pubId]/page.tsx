import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { CommunitiesId, PubsId, UsersId } from "db/public";
import { AuthTokenType } from "db/public";
import { PubTypes } from "db/src/public";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { buttonVariants } from "ui/button";

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
import PubChildrenTableWrapper from "./components/PubChildrenTableWrapper";

export default async function Page({
	params,
	searchParams,
}: {
	params: { pubId: string; communitySlug: string };
	searchParams: Record<string, string>;
}) {
	const { user } = await getLoginData();
	if (!user) {
		return null;
	}

	const token = await createToken({
		userId: user.id as UsersId,
		type: AuthTokenType.generic,
	});

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
	if (!pub) {
		return null;
	}
	const users = getPubUsers(pub.permissions);
	const community = await getCommunityBySlug(params.communitySlug);

	if (community === null) {
		notFound();
	}

	const [actionsPromise, stagePromise] =
		pub.stages.length > 0
			? [getStageActions(pub.stages[0].stageId), getStage(pub.stages[0].stageId)]
			: [null, null];

	const [actions, stage] = await Promise.all([actionsPromise, stagePromise]);
	const pubChildrenPubTypesById = pub.children
		.map((child) => child.pubType)
		.reduce((acc, pubType) => {
			const record = acc.get(pubType.id);
			if (record) {
				record.pubCount++;
			} else {
				acc.set(pubType.id, { pubType: pubType as PubTypes, pubCount: 1 });
			}
			return acc;
		}, new Map<string, { pubType: PubTypes; pubCount: number }>());
	const pubChildrenPubTypes = Array.from(pubChildrenPubTypesById.values());

	const selectedChildPubType = searchParams.selectedPubType ?? pubChildrenPubTypes[0]?.pubType.id;

	return (
		<div className="flex flex-col space-y-4">
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
			<div>
				<h2 className="text-xl font-bold">Pub Contents</h2>
				<p className="text-muted-foreground">
					Use the "Add New Pub" button below to create a new pub and add it to this pub's
					contents.
				</p>
			</div>
			<div className="mb-2">
				<PubCreateButton
					label="Add New Pub"
					communityId={community.id as CommunitiesId}
					parentId={pub.id as PubsId}
					searchParams={searchParams}
				/>
			</div>
			<div className="mb-2 flex gap-2">
				<div className="border-color-muted flex flex-col border-r-[1px]">
					<nav className="grid w-48 gap-1 px-2">
						{pubChildrenPubTypes.map((record) => {
							const linkSearchParams = new URLSearchParams(searchParams);
							linkSearchParams.append("selectedPubType", record.pubType.id);
							return (
								<Link
									key={record.pubType.id}
									href={`/c/${params.communitySlug}/pubs/${params.pubId}?${linkSearchParams}`}
									className={buttonVariants({
										variant:
											selectedChildPubType === record.pubType.id
												? "default"
												: "ghost",
										size: "default",
									})}
									scroll={false}
								>
									{record.pubType.name}
									<span className="ml-auto text-muted-foreground">
										{record.pubCount}
									</span>
								</Link>
							);
						})}
					</nav>
				</div>
				<div className="flex-1">
					<Suspense fallback={<SkeletonTable /> /* does not exist yet */}>
						<PubChildrenTableWrapper pub={pub} members={community.members} />
					</Suspense>
				</div>
			</div>
		</div>
	);
}
