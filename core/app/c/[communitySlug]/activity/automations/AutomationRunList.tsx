import type { AutoReturnType } from "~/lib/types"

import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Activity } from "lucide-react"

import { Action, type Communities, type CommunitiesId } from "db/public"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "ui/empty"

import { getAutomationRunStatus } from "~/actions/results"
import { db } from "~/kysely/database"
import {
	type FullAutomationRun,
	getAutomationRuns,
	getAutomationRunsCount,
} from "~/lib/server/actions"
import { autoCache } from "~/lib/server/cache/autoCache"
import { findCommunityBySlug } from "~/lib/server/community"
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
		community: Communities
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
						community={props.community}
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
		<AutomationRunSearchFooter {...props} {...paginationProps} className="fixed z-20">
			{props.children}
		</AutomationRunSearchFooter>
	)
}

export const PaginatedAutomationRunList: React.FC<PaginatedAutomationRunListProps> = async (
	props
) => {
	const search = automationRunSearchParamsCache.parse(props.searchParams)
	const filterParams = getAutomationRunFilterParamsFromSearch(search)

	const automationRunsPromise = getAutomationRuns(props.communityId, {
		limit: filterParams.limit,
		offset: filterParams.offset,
		orderBy: filterParams.orderBy,
		orderDirection: filterParams.orderDirection,
		automations: filterParams.automations,
		stages: filterParams.stages,
		query: filterParams.query,
	}).execute()

	const [community, availableAutomations, stages] = await Promise.all([
		findCommunityBySlug(),
		autoCache(
			db
				.selectFrom("automations")
				.where("communityId", "=", props.communityId)
				.select(["id", "name", "icon"])
				.orderBy("name", "asc")
		).execute(),
		getStages({ communityId: props.communityId, userId: null }).execute(),
	])
	if (!community) {
		notFound()
	}

	const basePath = props.basePath ?? `/c/${community.slug}/activity/automations`
	const availableActions = Object.values(Action).map((action) => ({
		id: action,
		name: action
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" "),
	}))

	return (
		<div className="relative mb-4 flex h-full w-full flex-col gap-3 overflow-x-hidden overflow-y-scroll p-4 pb-16">
			<AutomationRunSearchProvider
				availableAutomations={availableAutomations}
				availableStages={stages}
				availableActions={availableActions}
			>
				<AutomationRunSearch>
					<Suspense fallback={<AutomationRunListSkeleton />}>
						<PaginatedAutomationRunListInner
							{...props}
							community={community}
							automationRunsPromise={automationRunsPromise}
							filterParams={{
								statuses: filterParams.statuses,
								actions: filterParams.actions,
							}}
						/>
					</Suspense>
				</AutomationRunSearch>
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
