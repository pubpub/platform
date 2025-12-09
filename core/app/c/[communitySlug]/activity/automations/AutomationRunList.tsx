import type { AutoReturnType } from "~/lib/types"

import { Suspense } from "react"
import { Activity } from "lucide-react"

import { Action, type CommunitiesId } from "db/public"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "ui/empty"
import { cn } from "utils"

import { getAutomationRunStatus } from "~/actions/results"
import { db } from "~/kysely/database"
import {
	type FullAutomationRun,
	getAutomationRuns,
	getAutomationRunsCount,
} from "~/lib/server/actions"
import { autoCache } from "~/lib/server/cache/autoCache"
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug"
import { getStages } from "~/lib/server/stages"
import { AutomationRunCard } from "./AutomationRunCard"
import { AutomationRunListSkeleton } from "./AutomationRunListSkeleton"
import { AutomationRunSearchFooter } from "./AutomationRunSearchFooter"
import { AutomationRunSearch } from "./AutomationRunSearchInput"
import { AutomationRunSearchProvider } from "./AutomationRunSearchProvider"
import {
	automationRunSearchParamsCache,
	getAutomationRunFilterParamsFromSearch,
} from "./automationRunQuery"

type PaginatedAutomationRunListProps = {
	communityId: CommunitiesId
	searchParams: { [key: string]: string | string[] | undefined }
	basePath?: string
}

const PaginatedAutomationRunListInner = async (
	props: PaginatedAutomationRunListProps & {
		communitySlug: string
		automationRunsPromise: Promise<FullAutomationRun[]>
		filterParams: {
			statuses?: string[]
			actions?: string[]
		}
	}
) => {
	let automationRuns = await props.automationRunsPromise

	// client-side filtering for status (since we need to compute it from actionRuns)
	if (props.filterParams.statuses && props.filterParams.statuses.length > 0) {
		automationRuns = automationRuns.filter((run) => {
			const status = getAutomationRunStatus(run)
			return props.filterParams.statuses?.includes(status)
		})
	}

	// client-side filtering for actions
	if (props.filterParams.actions && props.filterParams.actions.length > 0) {
		automationRuns = automationRuns.filter((run) => {
			return run.actionRuns.some((actionRun) =>
				props.filterParams.actions?.includes(actionRun.action ?? "")
			)
		})
	}

	const hasSearch =
		props.searchParams.query !== "" ||
		(props.searchParams.automations?.length ?? 0) > 0 ||
		(props.searchParams.statuses?.length ?? 0) > 0 ||
		(props.searchParams.stages?.length ?? 0) > 0 ||
		(props.searchParams.actions?.length ?? 0) > 0

	return (
		<div className="mr-auto flex w-full flex-col gap-3">
			{automationRuns.length === 0 && (
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Activity size={16} />
						</EmptyMedia>
						<EmptyTitle>No Automation Runs Found</EmptyTitle>
						{hasSearch && (
							<EmptyDescription>
								Try adjusting your filters or search query.
							</EmptyDescription>
						)}
					</EmptyHeader>
					<EmptyContent></EmptyContent>
				</Empty>
			)}

			{automationRuns.map((automationRun) => {
				return (
					<AutomationRunCard
						key={automationRun.id}
						automationRun={automationRun}
						communitySlug={props.communitySlug}
					/>
				)
			})}
		</div>
	)
}

const AutomationRunListFooterPagination = async (props: {
	basePath: string
	searchParams: Record<string, unknown>
	page: number
	communityId: CommunitiesId
	children?: React.ReactNode
	automationRunsPromise: Promise<AutoReturnType<typeof getAutomationRuns>["execute"]>
}) => {
	const search = automationRunSearchParamsCache.all()

	const filterParams = getAutomationRunFilterParamsFromSearch(search)

	const count = await getAutomationRunsCount(props.communityId, {
		automations: filterParams.automations,
		stages: filterParams.stages,
		query: filterParams.query,
	})

	const paginationProps = {
		mode: "total" as const,
		totalPages: Math.ceil(count / search.perPage),
	}

	return (
		<AutomationRunSearchFooter {...props} {...paginationProps} className="z-20">
			{props.children}
		</AutomationRunSearchFooter>
	)
}

export const PaginatedAutomationRunList: React.FC<PaginatedAutomationRunListProps> = async (
	props
) => {
	const search = automationRunSearchParamsCache.parse(props.searchParams)
	const filterParams = getAutomationRunFilterParamsFromSearch(search)

	const communitySlug = await getCommunitySlug()

	const basePath = props.basePath ?? `/c/${communitySlug}/activity/automations`

	const automationRunsPromise = getAutomationRuns(props.communityId, {
		limit: filterParams.limit,
		offset: filterParams.offset,
		orderBy: filterParams.orderBy,
		orderDirection: filterParams.orderDirection,
		automations: filterParams.automations,
		stages: filterParams.stages,
		query: filterParams.query,
	}).execute()

	const [availableAutomations, stages] = await Promise.all([
		autoCache(
			db
				.selectFrom("automations")
				.where("communityId", "=", props.communityId)
				.select(["id", "name", "icon"])
				.orderBy("name", "asc")
		).execute(),
		getStages({ communityId: props.communityId, userId: null }).execute(),
	])

	const availableActions = Object.values(Action).map((action) => ({
		id: action,
		name: action
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" "),
	}))

	return (
		<div className="relative flex h-full flex-col">
			<AutomationRunSearchProvider
				availableAutomations={availableAutomations}
				availableStages={stages}
				availableActions={availableActions}
			>
				<div
					className={cn("mb-4 flex h-full w-full flex-col gap-3 overflow-y-scroll pb-16")}
				>
					<AutomationRunSearch>
						<Suspense fallback={<AutomationRunListSkeleton />}>
							<PaginatedAutomationRunListInner
								{...props}
								communitySlug={communitySlug}
								automationRunsPromise={automationRunsPromise}
								filterParams={{
									statuses: filterParams.statuses,
									actions: filterParams.actions,
								}}
							/>
						</Suspense>
					</AutomationRunSearch>
				</div>
				<Suspense fallback={null}>
					<AutomationRunListFooterPagination
						basePath={basePath}
						searchParams={props.searchParams}
						page={search.page}
						communityId={props.communityId}
						automationRunsPromise={automationRunsPromise}
					/>
				</Suspense>
			</AutomationRunSearchProvider>
		</div>
	)
}
