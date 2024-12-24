import type { Metadata } from "next";

import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import type { PubsId } from "db/public";
import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";
import { Button } from "ui/button";
import { Pencil } from "ui/icon";

import Assign from "~/app/c/[communitySlug]/stages/components/Assign";
import Move from "~/app/c/[communitySlug]/stages/components/Move";
import { MembersList } from "~/app/components//Memberships/MembersList";
import { PubsRunActionDropDownMenu } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { AddMemberDialog } from "~/app/components/Memberships/AddMemberDialog";
import { CreatePubButton } from "~/app/components/pubs/CreatePubButton";
import SkeletonTable from "~/app/components/skeletons/SkeletonTable";
import { db } from "~/kysely/database";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { getStageActions } from "~/lib/db/queries";
import { getPubTitle } from "~/lib/pubs";
import { getPubsWithRelatedValuesAndChildren, pubValuesByVal } from "~/lib/server";
import { autoCache } from "~/lib/server/cache/autoCache";
import { findCommunityBySlug } from "~/lib/server/community";
import { selectCommunityMembers } from "~/lib/server/member";
import { getStages } from "~/lib/server/stages";
import {
	addPubMember,
	addUserWithPubMembership,
	removePubMember,
	setPubMemberRole,
} from "./actions";
import PubChildrenTableWrapper from "./components/PubChildrenTableWrapper";
import { PubValues } from "./components/PubValues";
import { RelatedPubsTable } from "./components/RelatedPubsTable";

export async function generateMetadata({
	params: { pubId },
}: {
	params: { pubId: PubsId; communitySlug: string };
}): Promise<Metadata> {
	// TODO: replace this with the same function as the one which is used in the page to take advantage of request deduplication using `React.cache`

	const pub = await autoCache(
		db
			.selectFrom("pubs")
			.selectAll("pubs")
			.select(pubValuesByVal(pubId))
			.where("id", "=", pubId)
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

	if (!pubId || !communitySlug) {
		return null;
	}

	const community = await findCommunityBySlug(communitySlug);

	if (!community) {
		notFound();
	}

	const canView = await userCan(
		Capabilities.viewPub,
		{ type: MembershipType.pub, pubId },
		user.id
	);

	if (!canView) {
		redirect(`/c/${params.communitySlug}/unauthorized`);
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

	const communityMembersPromise = selectCommunityMembers({ communityId: community.id }).execute();
	const communityStagesPromise = getStages({ communityId: community.id }).execute();

	const pub = await getPubsWithRelatedValuesAndChildren(
		{ pubId: params.pubId, communityId: community.id, userId: user.id },
		{
			withPubType: true,
			withChildren: true,
			withRelatedPubs: true,
			withStage: true,
			withMembers: true,
			depth: 3,
		}
	);

	const actionsPromise = pub.stage ? getStageActions(pub.stage.id).execute() : null;

	const [actions, communityMembers, communityStages] = await Promise.all([
		actionsPromise,
		communityMembersPromise,
		communityStagesPromise,
	]);
	if (!pub) {
		return null;
	}

	const { stage, children, ...slimPub } = pub;
	return (
		<div className="flex flex-col space-y-4">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<div className="text-lg font-semibold text-muted-foreground">
						{pub.pubType.name}
					</div>
					<h1 className="mb-2 text-xl font-bold">{getPubTitle(pub)} </h1>
				</div>
				<Button variant="outline" asChild className="flex items-center gap-1">
					<Link href={`/c/${communitySlug}/pubs/${pub.id}/edit`}>
						<Pencil size="14" />
						Update
					</Link>
				</Button>
			</div>

			<div className="flex flex-wrap space-x-4">
				<div className="flex-1">
					<PubValues pub={pub} />
				</div>
				<div className="flex w-96 flex-col gap-4 rounded-lg bg-gray-50 p-4 shadow-inner">
					{pub.stage ? (
						<div>
							<div className="mb-1 text-lg font-bold">Current Stage</div>
							<div className="ml-4 flex items-center gap-2 font-medium">
								<div data-testid="current-stage">{pub.stage.name}</div>
								<Move
									pubId={pub.id}
									stageId={pub.stage.id}
									communityStages={communityStages}
								/>
							</div>
						</div>
					) : null}

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
							<Assign members={communityMembers} pub={slimPub} />
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
				<CreatePubButton text="Add New Pub" communityId={community.id} parentId={pub.id} />
			</div>
			<Suspense fallback={<SkeletonTable /> /* does not exist yet */}>
				<PubChildrenTableWrapper
					communitySlug={params.communitySlug}
					pageContext={{ params, searchParams }}
					parentPubId={pub.id}
				/>
			</Suspense>
			<div>
				<h2 className="mb-2 text-xl font-bold">Related Pubs</h2>
				<RelatedPubsTable pub={pub} />
			</div>
		</div>
	);
}
