import { Suspense } from "react";

import type { ProcessedPub } from "contracts";
import type { CommunitiesId, UsersId } from "db/public";
import { Skeleton } from "ui/skeleton";
import { cn } from "utils";

import { searchParamsCache } from "~/app/components/DataTable/PubsDataTable/validations";
import { FooterPagination } from "~/app/components/Pagination";
import { PubCard } from "~/app/components/PubCard";
import { getPubsCount, getPubsWithRelatedValues } from "~/lib/server";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { getStages } from "~/lib/server/stages";
import { PubSearch } from "./PubSearchInput";
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
	}
) => {
	const [pubs, stages] = await Promise.all([
		props.pubsPromise,
		getStages(
			{ communityId: props.communityId, userId: props.userId },
			{ withActionInstances: "full" }
		).execute(),
	]);

	return (
		<PubsSelectedProvider pubIds={[]}>
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
						/>
					);
				})}
			</div>
		</PubsSelectedProvider>
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
	children: React.ReactNode;
	pubsPromise: Promise<ProcessedPub[]>;
	userId: UsersId;
}) => {
	const perPage = searchParamsCache.get("perPage");
	const query = searchParamsCache.get("query");

	const count = await getPubsCount(
		{ communityId: props.communityId, userId: props.userId },
		{
			search: query,
		}
	);

	const paginationProps = {
		mode: "total" as const,
		totalPages: Math.ceil((count ?? 0) / perPage),
	};

	return (
		<FooterPagination {...props} {...paginationProps} className="z-20">
			{props.children}
		</FooterPagination>
	);
};

export const PaginatedPubList: React.FC<PaginatedPubListProps> = async (props) => {
	const search = searchParamsCache.parse(props.searchParams);

	const communitySlug = await getCommunitySlug();

	const basePath = props.basePath ?? `/c/${communitySlug}/pubs`;

	// we do one more than the total amount of pubs to know if there is a next page
	const limit = search.query ? search.perPage + 1 : search.perPage;

	const pubsPromise = getPubsWithRelatedValues(
		{ communityId: props.communityId, userId: props.userId },
		{
			limit,
			offset: (search.page - 1) * search.perPage,
			orderBy: "updatedAt",
			withPubType: true,
			withRelatedPubs: false,
			withStage: true,
			withValues: false,
			withRelatedCounts: true,
			search: search.query,
		}
	);

	return (
		<div className="relative flex h-full flex-col">
			<div
				className={cn("mb-4 flex h-full w-full flex-col gap-3 overflow-y-scroll p-4 pb-16")}
			>
				<PubSearch>
					<Suspense fallback={<PubListSkeleton />}>
						<PaginatedPubListInner
							{...props}
							communitySlug={communitySlug}
							pubsPromise={pubsPromise}
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
				>
					<PubsSelectedCounter pageSize={search.perPage} />
				</PubListFooterPagination>
			</Suspense>
		</div>
	);
};
