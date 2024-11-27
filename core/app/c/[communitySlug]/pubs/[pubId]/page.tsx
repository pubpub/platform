import type { Metadata } from "next";

import { Suspense } from "react";
import { notFound } from "next/navigation";

import type { CommunitiesId, MemberRole, PubsId, StagesId, UsersId } from "db/public";
import { AuthTokenType } from "db/public";
import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";

import type { PubValueWithFieldAndSchema } from "./components/jsonSchemaHelpers";
import type { CommunityStage } from "~/lib/server/stages";
import type { SafeUser } from "~/lib/server/user";
import type { MemberWithUser, PubWithValues } from "~/lib/types";
import Assign from "~/app/c/[communitySlug]/stages/components/Assign";
import Move from "~/app/c/[communitySlug]/stages/components/Move";
import { MembersList } from "~/app/components//Memberships/MembersList";
import { ActionRunDialog } from "~/app/components/ActionUI/ActionRunDialog";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import IntegrationActions from "~/app/components/IntegrationActions";
import { AddMemberDialog } from "~/app/components/Memberships/AddMemberDialog";
import { CreatePubButton } from "~/app/components/pubs/CreatePubButton";
import { PubDropDown } from "~/app/components/pubs/PubDropDown";
import { PubEditorDialog } from "~/app/components/pubs/PubEditor/PubEditorDialog";
import { UpdatePubButton } from "~/app/components/pubs/UpdatePubButton";
import { PubTitle } from "~/app/components/PubTitle";
import SkeletonTable from "~/app/components/skeletons/SkeletonTable";
import { db } from "~/kysely/database";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { getCommunityBySlug, getStage, getStageActions } from "~/lib/db/queries";
import { pubValuesByVal } from "~/lib/server";
import { pubInclude } from "~/lib/server/_legacy-integration-queries";
import { autoCache } from "~/lib/server/cache/autoCache";
import { createToken } from "~/lib/server/token";
import prisma from "~/prisma/db";
import {
	addPubMember,
	addUserWithPubMembership,
	removePubMember,
	setPubMemberRole,
} from "./actions";
import { renderField } from "./components/jsonSchemaHelpers";
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
	params: { pubId: PubsId; communitySlug: string };
	searchParams: Record<string, string>;
}) {
	const { pubId, communitySlug } = params;

	const { user } = await getPageLoginData();

	const token = await createToken({
		userId: user.id as UsersId,
		type: AuthTokenType.generic,
	});

	if (!pubId || !communitySlug) {
		return null;
	}

	const canAddMember = await userCan(
		Capabilities.addPubMember,
		{
			type: MembershipType.pub,
			pubId,
		},
		user.id
	);
	const canRemoveMember = await userCan(
		Capabilities.removePubMember,
		{
			type: MembershipType.pub,
			pubId,
		},
		user.id
	);

	// TODO: use unstable_cache without chidren not rendereing
	const getPub = (pubId: string) =>
		prisma.pub.findUnique({
			where: { id: pubId },
			include: {
				...pubInclude,
			},
		});

	const pub = await getPub(pubId);
	if (!pub) {
		return null;
	}

	const community = await getCommunityBySlug(communitySlug);

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

	const members = pub.members
		.filter((member) => member.user !== null)
		.map((member) => {
			// TODO: rewrite the getPubs query in kysely so we don't have to do this dangerous cast
			return {
				...member.user,
				role: member.role,
			} as unknown as SafeUser & { role: MemberRole };
		});

	return (
		<>
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
					<div className="flex w-96 flex-col gap-4 rounded-lg bg-gray-50 p-4 shadow-inner">
						<div>
							<h3 className="mb-2 text-xl font-bold">{pub.pubType.name}</h3>
							<PubTitle pub={pub} />
						</div>
						<PubDropDown pubId={pub.id as PubsId} />
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
									{pub.stages[0] ? (
										<Move
											pubId={pub.id as PubsId}
											stageId={pub.stages[0].stageId as StagesId}
											communityStages={
												community.stages as unknown as CommunityStage[]
											}
										/>
									) : null}
								</div>
							</div>
							<div>
								<div className="mb-1 text-lg font-bold">Integrations</div>
								<div>
									<Suspense>
										{pub.stages[0]?.stageId && (
											<IntegrationActions
												pubId={pub.id as PubsId}
												token={token}
												stageId={pub.stages[0].stageId as StagesId}
												type="pub"
											/>
										)}
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
										/>
									</div>
								) : (
									<div className="ml-4 font-medium">
										Configure actions to run for this Pub in the stage
										management settings
									</div>
								)}
							</div>

							<div>
								<div className="mb-1 text-lg font-bold">Members</div>
								<div className="flex flex-row flex-wrap">
									{pub.members.map((member) => {
										return (
											member.user && (
												<div key={member.user.id}>
													<Avatar className="mr-2 h-8 w-8">
														<AvatarImage
															src={member.user.avatar || undefined}
														/>
														<AvatarFallback>
															{member.user.firstName[0]}
														</AvatarFallback>
													</Avatar>
												</div>
											)
										);
									})}
								</div>
								{pub.stages[0] ? (
									<Move
										pubId={pubId}
										stageId={pub.stages[0].stageId as StagesId}
										communityStages={
											community.stages as unknown as CommunityStage[]
										}
									/>
								) : null}
							</div>
							<div>
								<Suspense>
									{pub.stages[0]?.stageId && (
										<IntegrationActions
											pubId={pubId}
											token={token}
											stageId={pub.stages[0].stageId as StagesId}
											type="pub"
										/>
									)}
								</Suspense>
							</div>
						</div>
						<div>
							<div className="mb-1 text-lg font-bold">Actions</div>
							{actions && actions.length > 0 && stage ? (
								<div className="ml-4">
									<PubsRunActionDropDownMenu
										actionInstances={actions}
										pubId={pubId}
									/>
								</div>
							) : (
								<div className="ml-4 font-medium">
									Configure actions to run for this Pub in the stage management
									settings
								</div>
							)}
						</div>

						<div className="flex flex-col gap-y-4">
							<div className="mb-2 flex justify-between">
								<span className="text-lg font-bold">Members</span>
								{canAddMember && (
									<AddMemberDialog
										addMember={addPubMember.bind(null, pubId)}
										addUserMember={addUserWithPubMembership.bind(null, pubId)}
										existingMembers={members.map((member) => member.id)}
										isSuperAdmin={user.isSuperAdmin}
									/>
								)}
							</div>
							<MembersList
								members={members}
								setRole={setPubMemberRole}
								removeMember={removePubMember}
								targetId={pubId}
								readOnly={!canRemoveMember}
							/>
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
					<div>
						<h2 className="text-xl font-bold">Pub Contents</h2>
						<p className="text-muted-foreground">
							Use the "Add New Pub" button below to create a new pub and add it to
							this pub's contents.
						</p>
					</div>
					<div className="mb-2">
						<CreatePubButton text="Add New Pub" parentId={pub.id as PubsId} />
					</div>
					<Suspense fallback={<SkeletonTable /> /* does not exist yet */}>
						<PubChildrenTableWrapper
							communitySlug={params.communitySlug}
							pageContext={{ params, searchParams }}
							parentPubId={pub.id as PubsId}
						/>
					</Suspense>
				</div>
			</div>
			<PubEditorDialog searchParams={searchParams} />
			<ActionRunDialog pageContext={{ params, searchParams }} />
		</>
	);
}
