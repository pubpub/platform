import type { Metadata } from "next";

import { Suspense } from "react";
import { notFound } from "next/navigation";

import type { CommunitiesId, PubsId, PubTypesId, StagesId, UsersId } from "db/public";
import { AuthTokenType } from "db/public";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";

import type { PubValueWithFieldAndSchema } from "./components/JsonSchemaHelpers";
import Assign from "~/app/c/[communitySlug]/stages/components/Assign";
import Move from "~/app/c/[communitySlug]/stages/components/Move";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import IntegrationActions from "~/app/components/IntegrationActions";
import MembersAvatars from "~/app/components/MemberAvatar";
import { PubCreateButton } from "~/app/components/PubCRUD/PubCreateButton";
import { PubTitle } from "~/app/components/PubTitle";
import SkeletonTable from "~/app/components/skeletons/SkeletonTable";
import { db } from "~/kysely/database";
import { getPageLoginData } from "~/lib/auth/loginData";
import { getCommunityBySlug, getStage, getStageActions } from "~/lib/db/queries";
import { getPubUsers } from "~/lib/permissions";
import { pubValuesByVal } from "~/lib/server";
import { pubInclude } from "~/lib/server/_legacy-integration-queries";
import { autoCache } from "~/lib/server/cache/autoCache";
import { createToken } from "~/lib/server/token";
import { MemberWithUser, PubWithValues } from "~/lib/types";
import prisma from "~/prisma/db";
import { renderField } from "./components/JsonSchemaHelpers";
import PubChildrenTableWrapper from "./components/PubChildrenTableWrapper";

export async function generateMetadata({
	params: { pubId },
}: {
	params: { pubId: string; communitySlug: string };
}): Promise<Metadata> {
	// TODO: replace this with the same function as the one which is used in the page to take advantage of request deduplication using `React.cache`

	const pub = await autoCache(
		db
			.selectFrom("pubs")
			.selectAll("pubs")
			.select(pubValuesByVal(pubId as PubsId))
			.where("id", "=", pubId as PubsId)
	).executeTakeFirst();

	if (!pub) {
		return { title: "Pub Not Found" };
	}

	const title = Object.entries(pub.values).find(([key]) => /title/.test(key))?.[1];

	if (!title) {
		return { title: `Pub ${pub.id}` };
	}

	return { title: title as string };
}

export default async function Page({
	params,
	searchParams,
}: {
	params: { pubId: string; communitySlug: string };
	searchParams: Record<string, string>;
}) {
	const { user } = await getPageLoginData();

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
			? [
					getStageActions(pub.stages[0].stageId as StagesId).execute(),
					getStage(pub.stages[0].stageId as StagesId).executeTakeFirst(),
				]
			: [null, null];

	const [actions, stage] = await Promise.all([actionsPromise, stagePromise]);

	const { stages, children, ...slimPub } = pub;
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
									<div>
										{renderField(
											value as unknown as PubValueWithFieldAndSchema
										)}
									</div>
								</div>
							);
						})}
				</div>
				<div className="flex w-64 flex-col gap-4 rounded-lg bg-gray-50 p-4 font-semibold shadow-inner">
					<div>
						<div className="mb-1 text-lg font-bold">Current Stage</div>
						<div className="ml-4 flex items-center gap-2 font-medium">
							<div>
								{pub.stages.map(({ stage }) => {
									return (
										<div key={stage.id} data-testid="current-stage">
											{stage.name}
										</div>
									);
								})}
							</div>
							<Move
								pub={pub}
								stage={pub.stages[0].stage}
								communityStages={community.stages}
							/>
						</div>
					</div>
					<div>
						<MembersAvatars pub={pub} />
					</div>
					<div>
						<div className="mb-1 text-lg font-bold">Integrations</div>
						<div>
							<Suspense>
								<IntegrationActions pubId={pub.id as PubsId} token={token} />
							</Suspense>
						</div>
					</div>
					<div>
						<div className="mb-1 text-lg font-bold">Actions</div>
						{actions && actions.length > 0 && stage ? (
							<div className="ml-4">
								<PubsRunActionDropDownMenu
									actionInstances={actions}
									pubId={pub.id as PubsId}
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

					<div>
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
					<div>
						<div className="mb-1 text-lg font-bold">Assignee</div>
						<div className="ml-4">
							<Assign
								// TODO: Remove this cast
								members={community.members as unknown as MemberWithUser[]}
								// TODO: Remove this cast
								pub={slimPub as unknown as PubWithValues}
							/>
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
			<Suspense fallback={<SkeletonTable /> /* does not exist yet */}>
				<PubChildrenTableWrapper
					communitySlug={params.communitySlug}
					pageContext={{ params, searchParams }}
					parentPubId={pub.id as PubsId}
				/>
			</Suspense>
		</div>
	);
}
