import type { ProcessedPub } from "contracts"
import type { CommunitiesId, UsersId } from "db/public"
import type { AutoReturnType } from "~/lib/types"

import { Suspense } from "react"
import { BookOpen } from "lucide-react"

import { AutomationEvent } from "db/public"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "ui/empty"
import { PubFieldProvider } from "ui/pubFields"
import { Skeleton } from "ui/skeleton"
import { StagesProvider, stagesDAO } from "ui/stages"
import { cn } from "utils"

import { CreatePubButton } from "~/app/components/pubs/CreatePubButton"
import { PubCardServer } from "~/app/components/pubs/PubCard/PubCardServer"
import { SkeletonButton } from "~/app/components/skeletons/SkeletonButton"
import {
	userCanArchiveAllPubs,
	userCanEditAllPubs,
	userCanMoveAllPubs,
	userCanRunActionsAllPubs,
	userCanViewAllStages,
} from "~/lib/authorization/capabilities"
import { getPubsCount, getPubsWithRelatedValues, getPubTypesForCommunity } from "~/lib/server"
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug"
import { getPubFields } from "~/lib/server/pubFields"
import { getStages } from "~/lib/server/stages"
import { PubClearSearchButton } from "./PubClearSearchButton"
import { PubSearchFooter } from "./PubSearchFooter"
import { PubSearch } from "./PubSearchInput"
import { PubSearchProvider } from "./PubSearchProvider"
import { PubsSelectedProvider } from "./PubsSelectedContext"
import { PubsSelectedCounter } from "./PubsSelectedCounter"
import { getPubFilterParamsFromSearch, pubSearchParamsCache } from "./pubQuery"

type PaginatedPubListProps = {
	communityId: CommunitiesId
	searchParams: { [key: string]: string | string[] | undefined }
	/**
	 * Needs to be provided for the pagination to work
	 *
	 * @default `/c/${communitySlug}/pubs`
	 */
	basePath?: string
	userId: UsersId
}

type PubListProcessedPub = ProcessedPub<{
	withPubType: true
	withRelatedPubs: false
	withStage: true
	withRelatedCounts: true
}>

const PaginatedPubListInner = async (
	props: PaginatedPubListProps & {
		communitySlug: string
		pubsPromise: Promise<PubListProcessedPub[]>
		stagesPromise: Promise<AutoReturnType<typeof getStages>["execute"]>
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
	])

	const hasSearch =
		props.searchParams.query !== "" ||
		(props.searchParams.pubTypes?.length ?? 0) > 0 ||
		(props.searchParams.stages?.length ?? 0) > 0
	return (
		<div className="mr-auto flex flex-col gap-3 md:max-w-(--breakpoint-lg)">
			{pubs.length === 0 && (
				<Empty className="">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<BookOpen size={16} />
						</EmptyMedia>
						<EmptyTitle>No Pubs Found</EmptyTitle>
						{hasSearch && (
							<EmptyDescription>
								Try adjusting your filters or search query.
							</EmptyDescription>
						)}
					</EmptyHeader>
					<EmptyContent>
						{hasSearch ? (
							<PubClearSearchButton />
						) : (
							<Suspense fallback={<SkeletonButton className="w-20" />}>
								<CreatePubButton
									communityId={props.communityId}
									className="bg-emerald-500 text-white hover:bg-emerald-600"
									text="Create Pub"
								/>
							</Suspense>
						)}
					</EmptyContent>
				</Empty>
			)}

			{pubs.map((pub) => {
				const stageForPub = stages.find((stage) => stage.id === pub.stage?.id)

				return (
					<PubCardServer
						data-pulse={true}
						key={pub.id}
						pub={pub}
						communitySlug={props.communitySlug}
						moveFrom={stageForPub?.moveConstraintSources}
						moveTo={stageForPub?.moveConstraints}
						manualAutomations={stageForPub?.fullAutomations?.filter((automation) =>
							automation?.triggers.some(
								(trigger) => trigger.event === AutomationEvent.manual
							)
						)}
						userId={props.userId}
						canEditAllPubs={canEditAllPubs}
						canArchiveAllPubs={canArchiveAllPubs}
						canRunActionsAllPubs={canRunActionsAllPubs}
						canMoveAllPubs={canMoveAllPubs}
						canViewAllStages={canViewAllStages}
						canFilter={true}
					/>
				)
			})}
		</div>
	)
}

export const PubListSkeleton = ({
	amount = 10,
	className,
}: {
	amount?: number
	className?: string
}) => (
	<div className={cn(["flex flex-col gap-3", className])}>
		{Array.from({ length: amount }).map((_, index) => (
			<Skeleton
				key={index}
				className="flex h-[94px] w-full flex-col gap-2 px-4 py-3 md:max-w-(--breakpoint-lg)"
			>
				<div className="flex items-start gap-1">
					<Skeleton className="h-5 w-24" />
					<Skeleton className="h-5 w-12" />
				</div>
				<Skeleton className="h-6 w-3/4 md:w-1/2 lg:w-1/3" />
				<div className="flex items-start gap-1 opacity-50">
					<Skeleton className="h-4 w-30" />
				</div>
			</Skeleton>
		))}
	</div>
)

const PubListFooterPagination = async (props: {
	basePath: string
	searchParams: Record<string, unknown>
	page: number
	communityId: CommunitiesId
	children?: React.ReactNode
	pubsPromise: Promise<ProcessedPub[]>
	userId: UsersId
}) => {
	const search = pubSearchParamsCache.all()

	const filterParams = getPubFilterParamsFromSearch(search)

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
	)

	const paginationProps = {
		mode: "total" as const,
		totalPages: Math.ceil((count ?? 0) / search.perPage),
	}

	return (
		<PubSearchFooter {...props} {...paginationProps} className="z-20">
			{props.children}
			<PubsSelectedCounter pageSize={Math.min(search.perPage, count)} />
		</PubSearchFooter>
	)
}

export const PaginatedPubList: React.FC<PaginatedPubListProps> = async (props) => {
	const search = pubSearchParamsCache.parse(props.searchParams)
	const filterParams = getPubFilterParamsFromSearch(search)

	const communitySlug = await getCommunitySlug()

	const basePath = props.basePath ?? `/c/${communitySlug}/pubs`

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
	)

	const [pubTypes, stages, pubFields] = await Promise.all([
		getPubTypesForCommunity(props.communityId, {
			limit: 0,
		}),
		getStages(
			{ communityId: props.communityId, userId: props.userId },
			{ withAutomations: { detail: "full", filter: [AutomationEvent.manual] } }
		).execute(),
		getPubFields({ communityId: props.communityId }).executeTakeFirstOrThrow(),
	])

	return (
		<div className="relative flex h-full flex-col">
			{/* field and stage provider are necessary for the ActionDropDown used in the pubcard to work */}
			<PubFieldProvider pubFields={pubFields.fields}>
				<StagesProvider stages={stagesDAO(stages)}>
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
				</StagesProvider>
			</PubFieldProvider>
		</div>
	)
}
