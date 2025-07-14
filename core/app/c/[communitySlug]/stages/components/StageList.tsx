import { Suspense } from "react";
import Link from "next/link";

import type { ProcessedPub } from "contracts";
import type { CommunitiesId, UsersId } from "db/public";
import { Button } from "ui/button";

import type { CommunityStage } from "~/lib/server/stages";
import type { MemberWithUser } from "~/lib/types";
import { BasicPagination } from "~/app/components/Pagination";
import { PubCard } from "~/app/components/PubCard";
import { getStageActions } from "~/lib/db/queries";
import { getPubsWithRelatedValues } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { selectAllCommunityMemberships } from "~/lib/server/member";
import { getStages } from "~/lib/server/stages";
import { getOrderedStages } from "~/lib/stages";
import { PubListSkeleton } from "../../pubs/PubList";

type Props = {
	userId: UsersId;
	communityId: CommunitiesId;
	searchParams: Record<string, unknown>;
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
					searchParams={props.searchParams}
				/>
			))}
		</div>
	);
}

async function StageCard({
	stage,
	searchParams,
	members,
	userId,
}: {
	stage: CommunityStage;
	members?: MemberWithUser[];
	searchParams: Record<string, unknown>;
	userId: UsersId;
}) {
	const communitySlug = await getCommunitySlug();
	return (
		<div key={stage.id} className="mb-20">
			<div className="flex flex-row justify-between">
				<h3 className="mb-2 text-lg font-semibold hover:underline">
					<Link href={`/c/${communitySlug}/stages/${stage.id}`}>
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
					searchParams={searchParams}
					members={members}
					totalPubLimit={3}
					basePath={`/c/${communitySlug}/stages`}
				/>
			</Suspense>
		</div>
	);
}

export async function StagePubs({
	stage,
	searchParams,
	totalPubLimit,
	basePath,
	pagination,
	userId,
}: {
	stage: CommunityStage;
	searchParams: Record<string, unknown>;
	members?: MemberWithUser[];
	totalPubLimit?: number;
	pagination?: { page: number; pubsPerPage: number };
	basePath: string;
	userId: UsersId;
}) {
	const [communitySlug, stagePubs, actionInstances] = await Promise.all([
		getCommunitySlug(),
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
		getStageActions({ stageId: stage.id }).execute(),
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
					<PubCard
						key={pub.id}
						pub={
							pub as ProcessedPub<{
								withStage: true;
								withPubType: true;
								withRelatedPubs: false;
							}>
						}
						moveFrom={stage.moveConstraintSources}
						moveTo={stage.moveConstraints}
						actionInstances={actionInstances}
						communitySlug={communitySlug}
						withSelection={false}
						userId={userId}
					/>
				);
			})}
			{pagination && (
				<BasicPagination
					basePath={basePath}
					searchParams={searchParams}
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
					<Link href={`/c/${communitySlug}/stages/${stage.id}`}>
						See all pubs in stage {stage.name}
					</Link>
				</Button>
			)}
		</div>
	);
}
