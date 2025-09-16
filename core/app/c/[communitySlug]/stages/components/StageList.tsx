import { Suspense } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";

import type { ProcessedPub } from "contracts";
import type { CommunitiesId, UsersId } from "db/public";
import { Pencil } from "ui/icon";
import { PubFieldProvider } from "ui/pubFields";
import { stagesDAO, StagesProvider } from "ui/stages";

import type { CommunityStage } from "~/lib/server/stages";
import type { MemberWithUser } from "~/lib/types";
import { EllipsisMenu, EllipsisMenuButton } from "~/app/components/EllipsisMenu";
import { BasicPagination } from "~/app/components/Pagination";
import { PubCard } from "~/app/components/pubs/PubCard/PubCard";
import {
	userCanArchiveAllPubs,
	userCanEditAllPubs,
	userCanMoveAllPubs,
	userCanRunActionsAllPubs,
	userCanViewAllStages,
} from "~/lib/authorization/capabilities";
import { getStageActions } from "~/lib/db/queries";
import { getPubsWithRelatedValues } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { selectAllCommunityMemberships } from "~/lib/server/member";
import { getPubFields } from "~/lib/server/pubFields";
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
	const [communityStages, communityMembers, pubFields] = await Promise.all([
		getStages({ communityId, userId }).execute(),
		selectAllCommunityMemberships({ communityId }).execute(),
		getPubFields({ communityId }).executeTakeFirstOrThrow(),
	]);

	const stages = getOrderedStages(communityStages);

	return (
		<div className="flex flex-col gap-8">
			<PubFieldProvider pubFields={pubFields.fields}>
				<StagesProvider stages={stagesDAO(stages)}>
					{stages.map((stage) => (
						<StageCard
							userId={props.userId}
							key={stage.id}
							stage={stage}
							members={communityMembers}
							searchParams={props.searchParams}
						/>
					))}
				</StagesProvider>
			</PubFieldProvider>
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
		<div key={stage.id} className="relative rounded-l-md border-l-2 border-gray-400 py-2 pl-4">
			<div className="flex flex-col justify-between gap-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Link
							href={`/c/${communitySlug}/stages/${stage.id}`}
							className="group underline"
						>
							<h3 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
								{stage.name}
							</h3>
						</Link>
						<p className="mt-1 text-xs text-gray-500">
							{stage.pubsCount === 0
								? "No Pubs in this stage"
								: `${stage.pubsCount} ${stage.pubsCount === 1 ? "Pub" : "Pubs"}`}
						</p>
					</div>
					<EllipsisMenu>
						<EllipsisMenuButton asChild>
							<Link
								href={`/c/${communitySlug}/stages/manage?editingStageId=${stage.id}`}
							>
								Edit Stage <Pencil size={10} strokeWidth={1.5} />
							</Link>
						</EllipsisMenuButton>
						<EllipsisMenuButton asChild>
							<Link href={`/c/${communitySlug}/stages/${stage.id}`}>
								View Stage <Eye size={10} strokeWidth={1.5} />
							</Link>
						</EllipsisMenuButton>
					</EllipsisMenu>
				</div>

				{!!stage.pubsCount && stage.pubsCount > 0 && (
					<div className="flex flex-col gap-4">
						<Suspense
							fallback={
								<PubListSkeleton amount={stage.pubsCount ?? 3} className="gap-4" />
							}
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
				)}
			</div>
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
	const [
		communitySlug,
		stagePubs,
		actionInstances,
		canEditAllPubs,
		canArchiveAllPubs,
		canRunActionsAllPubs,
		canMoveAllPubs,
		canViewAllStages,
	] = await Promise.all([
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
				withStageActionInstances: true,
			}
		),
		getStageActions({ stageId: stage.id }).execute(),
		userCanEditAllPubs(),
		userCanArchiveAllPubs(),
		userCanRunActionsAllPubs(),
		userCanMoveAllPubs(),
		userCanViewAllStages(),
	]);

	const totalPages =
		stage.pubsCount && pagination ? Math.ceil(stage.pubsCount / pagination.pubsPerPage) : 0;

	return (
		<div className="flex flex-col gap-3">
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
						canEditAllPubs={canEditAllPubs}
						canArchiveAllPubs={canArchiveAllPubs}
						canRunActionsAllPubs={canRunActionsAllPubs}
						canMoveAllPubs={canMoveAllPubs}
						canViewAllStages={canViewAllStages}
						canFilter={false}
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
			{!pagination &&
				stage.pubsCount &&
				totalPubLimit &&
				stagePubs.length > totalPubLimit && (
					<div className="flex items-center justify-center pt-4">
						<Link href={`/c/${communitySlug}/stages/${stage.id}`}>
							<div className="group flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 transition-all hover:bg-gray-200">
								<div className="flex gap-1">
									<div className="h-2 w-2 rounded-full bg-gray-500"></div>
									<div className="h-2 w-2 rounded-full bg-gray-500"></div>
									<div className="h-2 w-2 rounded-full bg-gray-500"></div>
								</div>
								<span className="text-sm text-gray-600 group-hover:text-gray-800">
									{stage.pubsCount - totalPubLimit} more
								</span>
							</div>
						</Link>
					</div>
				)}
		</div>
	);
}
