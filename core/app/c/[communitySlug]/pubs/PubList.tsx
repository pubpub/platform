import { Suspense } from "react";

import type { ProcessedPub } from "contracts";
import type { CommunitiesId, UsersId } from "db/public";
import { Skeleton } from "ui/skeleton";
import { cn } from "utils";

import type { AutoReturnType } from "~/lib/types";
import { FooterPagination } from "~/app/components/Pagination";
import { PubCard } from "~/app/components/pubs/PubCard/PubCard";
import {
	userCanArchiveAllPubs,
	userCanEditAllPubs,
	userCanMoveAllPubs,
	userCanRunActionsAllPubs,
	userCanViewAllStages,
} from "~/lib/authorization/capabilities";
import { getPubsCount, getPubsWithRelatedValues, getPubTypesForCommunity } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { getStages } from "~/lib/server/stages";
import { getPubFilterParamsFromSearch, pubSearchParamsCache } from "./pubQuery";
import { PubSearch } from "./PubSearchInput";
import { PubSearchProvider } from "./PubSearchProvider";
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

type PubListProcessedPub = ProcessedPub<{
	withPubType: true;
	withRelatedPubs: false;
	withStage: true;
	withRelatedCounts: true;
}>;

const PaginatedPubListInner = async (
	props: PaginatedPubListProps & {
		communitySlug: string;
		pubsPromise: Promise<PubListProcessedPub[]>;
		stagesPromise: Promise<AutoReturnType<typeof getStages>["execute"]>;
	}
) => {
	const [
		pubs,
		stages,
		canEditAllPubs,
		canArchiveAllPubs,
		canRunActionsAllPubs,
		canMoveAllPubs,
		canViewAllStages,
	] = await Promise.all([
		props.pubsPromise,
		props.stagesPromise,
		userCanEditAllPubs(),
		userCanArchiveAllPubs(),
		userCanRunActionsAllPubs(),
		userCanMoveAllPubs(),
		userCanViewAllStages(),
	]);

	return (
		<div className="mr-auto flex flex-col gap-3 md:max-w-screen-lg">
			{pubs.map((pub) => {
				const stageForPub = stages.find((stage) => stage.id === pub.stage?.id);

				return (
					<PubCard
						key={pub.id}
						pub={pub}
						communitySlug={props.communitySlug}
						moveFrom={stageForPub?.moveConstraintSources}
						moveTo={stageForPub?.moveConstraints}
						actionInstances={stageForPub?.actionInstances}
						userId={props.userId}
						canEditAllPubs={canEditAllPubs}
						canArchiveAllPubs={canArchiveAllPubs}
						canRunActionsAllPubs={canRunActionsAllPubs}
						canMoveAllPubs={canMoveAllPubs}
						canViewAllStages={canViewAllStages}
						canFilter={true}
					/>
				);
			})}
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
	<div className={cn(["flex flex-col gap-3", className])}>
		{Array.from({ length: amount }).map((_, index) => (
			<Skeleton key={index} className="flex h-[90px] w-full flex-col gap-2 px-4 py-3">
				<Skeleton className="mt-3 h-6 w-24 space-y-1.5" />
				<Skeleton className="h-8 w-1/2 space-y-1.5" />
			</Skeleton>
		))}
	</div>
);

const PubListFooterPagination = async (props: {
	basePath: string;
	searchParams: Record<string, unknown>;
	page: number;
	communityId: CommunitiesId;
	children?: React.ReactNode;
	pubsPromise: Promise<ProcessedPub[]>;
	userId: UsersId;
}) => {
	const search = pubSearchParamsCache.all();

	const filterParams = getPubFilterParamsFromSearch(search);

	const count = await getPubsCount(
		{
			communityId: props.communityId,
			userId: props.userId,

			pubTypeId: filterParams.pubTypes,
			stageId: filterParams.stages,
		},
		{
			search: search.query,
			filters: filterParams.filters,
		}
	);

	const paginationProps = {
		mode: "total" as const,
		totalPages: Math.ceil((count ?? 0) / search.perPage),
	};

	return (
		<FooterPagination {...props} {...paginationProps} className="z-20">
			{props.children}
			<PubsSelectedCounter pageSize={Math.min(search.perPage, count)} />
		</FooterPagination>
	);
};

export const PaginatedPubList: React.FC<PaginatedPubListProps> = async (props) => {
	const search = pubSearchParamsCache.parse(props.searchParams);
	const filterParams = getPubFilterParamsFromSearch(search);

	const communitySlug = await getCommunitySlug();

	const basePath = props.basePath ?? `/c/${communitySlug}/pubs`;

	// we do one more than the total amount of pubs to know if there is a next page
	// const limit = search.query ? filterParams.perPage + 1 : filterParams.perPage;

	const pubsPromise = getPubsWithRelatedValues(
		{
			communityId: props.communityId,
			userId: props.userId,
			pubTypeId: filterParams.pubTypes,
			stageId: filterParams.stages,
		},
		{
			limit: filterParams.limit,
			offset: filterParams.offset,
			orderBy: filterParams.orderBy,
			withPubType: true,
			withRelatedPubs: false,
			withStage: true,
			withValues: false,
			withRelatedCounts: true,
			search: search.query,
			orderDirection: filterParams.orderDirection,
			filters: filterParams.filters,
		}
	);

	const [pubTypes, stages] = await Promise.all([
		getPubTypesForCommunity(props.communityId, {
			limit: 0,
		}),
		getStages(
			{ communityId: props.communityId, userId: props.userId },
			{ withActionInstances: "full" }
		).execute(),
	]);
	// const stagesPromise = getStages(
	// 	{ communityId: props.communityId, userId: props.userId },
	// 	{ withActionInstances: "full" }
	// ).execute();

	// const pubTypesPromise = getPubTypesForCommunity(props.communityId, {
	// 	limit: 0,
	// });

	return (
		<div className="relative flex h-full flex-col">
			<PubSearchProvider availablePubTypes={pubTypes} availableStages={stages}>
				<PubsSelectedProvider pubIds={[]}>
					<div
						className={cn(
							"mb-4 flex h-full w-full flex-col gap-3 overflow-y-scroll pb-16"
						)}
					>
						<PubSearch>
							<Suspense fallback={<PubListSkeleton />}>
								<PaginatedPubListInner
									{...props}
									communitySlug={communitySlug}
									pubsPromise={pubsPromise}
									stagesPromise={Promise.resolve(stages)}
								/>
							</Suspense>
						</PubSearch>
					</div>
					<Suspense fallback={null}>
						<PubListFooterPagination
							basePath={basePath}
							searchParams={props.searchParams}
							userId={props.userId}
							page={search.page}
							communityId={props.communityId}
							pubsPromise={pubsPromise}
						></PubListFooterPagination>
					</Suspense>
				</PubsSelectedProvider>
			</PubSearchProvider>
		</div>
	);
};
