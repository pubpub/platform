import { Suspense } from "react";

import type { CommunitiesId, UsersId } from "db/public";
import { Skeleton } from "ui/skeleton";
import { cn } from "utils";

import { BasicPagination } from "~/app/components/Pagination";
import { PubCard } from "~/app/components/PubCard";
import { getStageActions } from "~/lib/db/queries";
import { getPubsCount, getPubsWithRelatedValues } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { getStages } from "~/lib/server/stages";

const PAGE_SIZE = 10;

type PaginatedPubListProps = {
	communityId: CommunitiesId;
	page: number;
	searchParams: Record<string, unknown>;
	/**
	 * Needs to be provided for the pagination to work
	 *
	 * @default `/c/${communitySlug}/pubs`
	 */
	basePath?: string;
	userId: UsersId;
};

const PaginatedPubListInner = async (props: PaginatedPubListProps) => {
	const [count, pubs, stages, actions] = await Promise.all([
		getPubsCount({ communityId: props.communityId }),
		getPubsWithRelatedValues(
			{ communityId: props.communityId, userId: props.userId },
			{
				limit: PAGE_SIZE,
				offset: (props.page - 1) * PAGE_SIZE,
				orderBy: "updatedAt",
				withPubType: true,
				withRelatedPubs: false,
				withStage: true,
				withValues: false,
				withRelatedCounts: true,
			}
		),
		getStages({ communityId: props.communityId, userId: props.userId }).execute(),
		getStageActions({ communityId: props.communityId }).execute(),
	]);

	const totalPages = Math.ceil(count / PAGE_SIZE);

	const communitySlug = await getCommunitySlug();
	const basePath = props.basePath ?? `/c/${communitySlug}/pubs`;

	return (
		<div className={cn("flex flex-col gap-3")}>
			{pubs.map((pub) => {
				const actionsForThisStage = actions.filter((a) => a.stageId === pub.stageId);
				return (
					<PubCard
						key={pub.id}
						pub={pub}
						communitySlug={communitySlug}
						stages={stages}
						actionInstances={actionsForThisStage}
					/>
				);
			})}
			<BasicPagination
				basePath={basePath}
				searchParams={props.searchParams}
				page={props.page}
				totalPages={totalPages}
			/>
		</div>
	);
};

export const PubListSkeleton = ({
	amount = 10,
	className,
}: {
	amount?: number;
	className?: string;
}) => (
	<div className={cn(["flex flex-col gap-8", className])}>
		{Array.from({ length: amount }).map((_, index) => (
			<Skeleton key={index} className="flex h-[90px] w-full flex-col gap-2 px-4 py-3">
				<Skeleton className="mt-3 h-6 w-24 space-y-1.5" />
				<Skeleton className="h-8 w-1/2 space-y-1.5" />
			</Skeleton>
		))}
	</div>
);

export const PaginatedPubList: React.FC<PaginatedPubListProps> = async (props) => {
	return (
		<Suspense fallback={<PubListSkeleton />}>
			<PaginatedPubListInner {...props} />
		</Suspense>
	);
};
