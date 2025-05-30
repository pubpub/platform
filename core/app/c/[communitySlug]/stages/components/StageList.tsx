import { Suspense } from "react";
import Link from "next/link";

import type { ProcessedPub } from "contracts";
import type { CommunitiesId, UsersId } from "db/public";
import { Button } from "ui/button";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import type { CommunityStage } from "~/lib/server/stages";
import type { MemberWithUser } from "~/lib/types";
import { BasicPagination } from "~/app/components/Pagination";
import PubRow from "~/app/components/PubRow";
import { getStageActions } from "~/lib/db/queries";
import { getPubsWithRelatedValues } from "~/lib/server";
import { selectAllCommunityMemberships } from "~/lib/server/member";
import { getStages } from "~/lib/server/stages";
import { getOrderedStages } from "~/lib/stages";
import { PubListSkeleton } from "../../pubs/PubList";
import { StagePubActions } from "./StagePubActions";

type Props = {
	userId: UsersId;
	communityId: CommunitiesId;
	pageContext: PageContext;
};

export async function StageList(props: Props) {
	const { communityId, userId } = props;
	const [communityStages, communityMembers] = await Promise.all([
		getStages({ communityId, userId }).execute(),
		selectAllCommunityMemberships({ communityId }).execute(),
	]);

	const stages = getOrderedStages(communityStages);

	return (
		<div>
			{stages.map((stage) => (
				<StageCard
					userId={props.userId}
					key={stage.id}
					stage={stage}
					members={communityMembers}
					pageContext={props.pageContext}
				/>
			))}
		</div>
	);
}

async function StageCard({
	stage,
	pageContext,
	members,
	userId,
}: {
	stage: CommunityStage;
	members?: MemberWithUser[];
	pageContext: PageContext;
	userId: UsersId;
}) {
	return (
		<div key={stage.id} className="mb-20">
			<div className="flex flex-row justify-between">
				<h3 className="mb-2 text-lg font-semibold hover:underline">
					<Link href={`/c/${pageContext.params.communitySlug}/stages/${stage.id}`}>
						{stage.name} ({stage.pubsCount})
					</Link>
				</h3>
			</div>
			<Suspense
				fallback={<PubListSkeleton amount={stage.pubsCount ?? 3} className="gap-16" />}
			>
				<StagePubs
					userId={userId}
					stage={stage}
					pageContext={pageContext}
					members={members}
					totalPubLimit={3}
					basePath={`/c/${pageContext.params.communitySlug}/stages`}
				/>
			</Suspense>
		</div>
	);
}

export async function StagePubs({
	stage,
	pageContext,
	members,
	totalPubLimit,
	basePath,
	pagination,
	userId,
}: {
	stage: CommunityStage;
	pageContext: PageContext;
	members?: MemberWithUser[];
	totalPubLimit?: number;
	pagination?: { page: number; pubsPerPage: number };
	basePath: string;
	userId: UsersId;
}) {
	const [stagePubs, actionInstances] = await Promise.all([
		getPubsWithRelatedValues(
			{ stageId: [stage.id], communityId: stage.communityId },
			{
				// fetch one extra pub so we know whether or not to render a show more button
				limit: pagination?.pubsPerPage || (totalPubLimit && totalPubLimit + 1),
				offset: pagination && (pagination.page - 1) * pagination.pubsPerPage,
				orderBy: "updatedAt",
				withRelatedPubs: false,
				withValues: false,
				withStage: true,
				withPubType: true,
			}
		),
		getStageActions(stage.id).execute(),
	]);

	const totalPages =
		stage.pubsCount && pagination ? Math.ceil(stage.pubsCount / pagination.pubsPerPage) : 0;

	return (
		<div className="flex flex-col gap-8">
			{stagePubs.map((pub, index) => {
				if (totalPubLimit && index > totalPubLimit - 1) {
					return null;
				}
				// this way we don't pass unecessary data to the client
				return (
					<PubRow
						key={pub.id}
						userId={userId}
						pub={
							pub as ProcessedPub<{
								withStage: true;
								withPubType: true;
								withRelatedPubs: false;
							}>
						}
						actions={
							<StagePubActions
								key={stage.id}
								pub={pub}
								stage={stage}
								actionInstances={actionInstances}
								pageContext={pageContext}
								members={members}
							/>
						}
						searchParams={pageContext.searchParams}
					/>
				);
			})}
			{pagination && (
				<BasicPagination
					basePath={basePath}
					searchParams={pageContext.searchParams}
					page={pagination.page}
					totalPages={totalPages}
				/>
			)}
			{!pagination && totalPubLimit && stagePubs.length > totalPubLimit && (
				<Button
					variant="ghost"
					className="text-md inline-flex text-muted-foreground"
					size="lg"
					asChild
				>
					<Link href={`/c/${pageContext.params.communitySlug}/stages/${stage.id}`}>
						See all pubs in stage {stage.name}
					</Link>
				</Button>
			)}
		</div>
	);
}
