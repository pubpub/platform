import type { Metadata } from "next";

import { Suspense } from "react";
import { notFound } from "next/navigation";

import type { JsonValue } from "contracts";
import type { CommunitiesId, PubsId, StagesId, UsersId } from "db/public";
import { AuthTokenType } from "db/public";
import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";

import type { CommunityStage } from "~/lib/server/stages";
import type { MemberWithUser, PubWithValues } from "~/lib/types";
import Assign from "~/app/c/[communitySlug]/stages/components/Assign";
import Move from "~/app/c/[communitySlug]/stages/components/Move";
import { MembersList } from "~/app/components//Memberships/MembersList";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import IntegrationActions from "~/app/components/IntegrationActions";
import { AddMemberDialog } from "~/app/components/Memberships/AddMemberDialog";
import { CreatePubButton } from "~/app/components/pubs/CreatePubButton";
import { PubTitle } from "~/app/components/PubTitle";
import SkeletonTable from "~/app/components/skeletons/SkeletonTable";
import { db } from "~/kysely/database";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { getCommunityBySlug, getStageActions } from "~/lib/db/queries";
import { getPubsWithRelatedValuesAndChildren, pubValuesByVal } from "~/lib/server";
import { autoCache } from "~/lib/server/cache/autoCache";
import { createToken } from "~/lib/server/token";
import {
	addPubMember,
	addUserWithPubMembership,
	removePubMember,
	setPubMemberRole,
} from "./actions";
import { renderPubValue } from "./components/jsonSchemaHelpers";
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

	const community = await getCommunityBySlug(communitySlug);

	if (community === null) {
		notFound();
	}

	const pub = await getPubsWithRelatedValuesAndChildren(
		{ pubId: params.pubId as PubsId, communityId: community.id as CommunitiesId },
		{
			withPubType: true,
			withChildren: true,
			withRelatedPubs: true,
			withStage: true,
			withMembers: true,
		}
	);

	if (!pub) {
		return null;
	}

	const actions = pub.stage ? await getStageActions(pub.stage.id as StagesId).execute() : null;

	const { stage, children, ...slimPub } = pub;

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
							return value.fieldSlug.split(":")[1] !== "title";
						})
						.map((value) => {
							return (
								<div className="mb-4" key={value.id}>
									<div>
										{renderPubValue({
											fieldName: value.fieldName,
											value: value.value as JsonValue,
										})}
									</div>
								</div>
							);
						})}
				</div>
				<div className="flex w-96 flex-col gap-4 rounded-lg bg-gray-50 p-4 shadow-inner">
					<div>
						<div className="mb-1 text-lg font-bold">Current Stage</div>
						<div className="ml-4 flex items-center gap-2 font-medium">
							{pub.stage ? (
								<>
									<div key={pub.stage.id} data-testid="current-stage">
										{pub.stage.name}
									</div>
									<Move
										pubId={pub.id}
										stageId={pub.stage.id as StagesId}
										communityStages={
											community.stages as unknown as CommunityStage[]
										}
									/>
								</>
							) : null}
						</div>
					</div>
					<div>
						<div className="mb-1 text-lg font-bold">Integrations</div>
						<div>
							<Suspense>
								{pub.stage?.id && (
									<IntegrationActions
										pubId={pubId}
										token={token}
										stageId={pub.stage.id as StagesId}
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

					<div className="flex flex-col gap-y-4">
						<div className="mb-2 flex justify-between">
							<span className="text-lg font-bold">Members</span>
							{canAddMember && (
								<AddMemberDialog
									addMember={addPubMember.bind(null, pubId)}
									addUserMember={addUserWithPubMembership.bind(null, pubId)}
									existingMembers={pub.members.map((member) => member.id)}
									isSuperAdmin={user.isSuperAdmin}
								/>
							)}
						</div>
						<MembersList
							members={pub.members}
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
			</div>
			<div>
				<h2 className="text-xl font-bold">Pub Contents</h2>
				<p className="text-muted-foreground">
					Use the "Add New Pub" button below to create a new pub and add it to this pub's
					contents.
				</p>
			</div>
			<div className="mb-2">
				<CreatePubButton
					text="Add New Pub"
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
