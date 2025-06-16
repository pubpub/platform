import { Suspense } from "react";

import type { CommunitiesId, UsersId } from "db/public";
import { Skeleton } from "ui/skeleton";
import { cn } from "utils";

import { searchParamsCache } from "~/app/components/DataTable/PubsDataTable/validations";
import { FooterPagination } from "~/app/components/Pagination";
import { PubCard } from "~/app/components/PubCard";
import { getStageActions } from "~/lib/db/queries";
import { getPubsCount, getPubsWithRelatedValues } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { getStages } from "~/lib/server/stages";
import { PubSelector } from "./PubSelector";
import { PubsSelectedProvider } from "./PubsSelectedContext";
import { PubsSelectedCounter } from "./PubsSelectedCounter";

type PaginatedPubListProps = {
	communityId: CommunitiesId;
	searchParams: { [key: string]: string | string[] | undefined };
	/**
	 * Needs to be provided for the pagination to work
	 *
	 * @default `/c/${communitySlug}/pubs`
	 */
	basePath?: string;
	userId: UsersId;
};

const PaginatedPubListInner = async (props: PaginatedPubListProps) => {
	const search = searchParamsCache.parse(props.searchParams);
	const [count, pubs, stages, actions] = await Promise.all([
		getPubsCount({ communityId: props.communityId }),
		getPubsWithRelatedValues(
			{ communityId: props.communityId, userId: props.userId },
			{
				limit: search.perPage,
				offset: (search.page - 1) * search.perPage,
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

	const totalPages = Math.ceil(count / search.perPage);

	const communitySlug = await getCommunitySlug();
	const basePath = props.basePath ?? `/c/${communitySlug}/pubs`;

	return (
		<div className={cn("flex flex-col gap-8")}>
			<PubsSelectedProvider pubIds={[]}>
				{pubs.map((pub) => {
					return (
						<PubCard
							key={pub.id}
							pub={pub}
							communitySlug={communitySlug}
							stages={stages}
							actionInstances={actions}
						/>
					);
				})}
				<FooterPagination
					basePath={basePath}
					searchParams={props.searchParams}
					page={search.page}
					totalPages={totalPages}
				>
					<PubsSelectedCounter pageSize={search.perPage} />
				</FooterPagination>
			</PubsSelectedProvider>
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
