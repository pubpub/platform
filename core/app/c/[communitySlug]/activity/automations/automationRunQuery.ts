import type { Action, ActionRunStatus, AutomationsId, StagesId } from "db/public"
import type { inferParserType } from "nuqs/server"
import type { AutomationRunComputedStatus } from "~/actions/results"

import { createSearchParamsCache, parseAsArrayOf, parseAsInteger, parseAsString } from "nuqs/server"

import { getFiltersStateParser, getSortingStateParser } from "ui/data-table-paged"

const DEFAULT_PAGE_SIZE = 25

export type AutomationRunSearchParams = inferParserType<typeof automationRunSearchParsers>

export const automationRunSearchParsers = {
	page: parseAsInteger.withDefault(1),
	perPage: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
	query: parseAsString.withDefault(""),
	sort: getSortingStateParser<{
		createdAt: string
	}>().withDefault([{ id: "createdAt", desc: true }]),
	filters: getFiltersStateParser<Record<string, unknown>>().withDefault([]),
	automations: parseAsArrayOf(parseAsString).withDefault([]),
	statuses: parseAsArrayOf(parseAsString).withDefault([]),
	stages: parseAsArrayOf(parseAsString).withDefault([]),
	actions: parseAsArrayOf(parseAsString).withDefault([]),
}

export const automationRunSearchParamsCache = createSearchParamsCache(automationRunSearchParsers)

export type GetAutomationRunsFilterParams = {
	limit: number
	offset: number
	orderBy: "createdAt"
	orderDirection: "desc" | "asc"
	automations?: AutomationsId[]
	statuses?: (ActionRunStatus | "partial")[]
	stages?: StagesId[]
	actions?: Action[]
	query?: string
}

export const getAutomationRunFilterParamsFromSearch = (
	search: AutomationRunSearchParams
): GetAutomationRunsFilterParams => {
	const sort = search.sort[0]
	const limit = search.perPage
	const offset = (search.page - 1) * search.perPage
	const orderBy = "createdAt"
	const orderDirection = sort?.desc ? "desc" : "asc"

	return {
		limit,
		offset,
		orderBy,
		orderDirection,
		automations:
			search.automations.length > 0 ? (search.automations as AutomationsId[]) : undefined,
		statuses:
			search.statuses.length > 0
				? (search.statuses as AutomationRunComputedStatus[])
				: undefined,
		stages: search.stages.length > 0 ? (search.stages as StagesId[]) : undefined,
		actions: search.actions.length > 0 ? (search.actions as Action[]) : undefined,
		query: search.query || undefined,
	}
}
