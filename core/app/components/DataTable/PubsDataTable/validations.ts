/** Based on https://github.com/sadmann7/shadcn-table/blob/main/src/app/_lib/validations.ts */

import type { inferParserType } from "nuqs/server";

import { createSearchParamsCache, parseAsInteger } from "nuqs/server";

import type { ProcessedPub } from "contracts";
import { getSortingStateParser } from "ui/data-table-paged";

import type { GetManyParams } from "~/lib/server";

const DEFAULT_PAGE_SIZE = 10;
export type DataTableSearchParams = inferParserType<typeof dataTableParsers>;
export const dataTableParsers = {
	page: parseAsInteger.withDefault(1),
	perPage: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
	sort: getSortingStateParser<
		ProcessedPub<{
			withPubType: true;
			withRelatedPubs: false;
			withStage: true;
			withValues: false;
			withLegacyAssignee: true;
		}>
	>().withDefault([{ id: "updatedAt", desc: true }]),
};
export const searchParamsCache = createSearchParamsCache(dataTableParsers);

/**
 * Returns the params we can pass into `getPubsWithRelatedValues` based on
 * search params
 */
export const getFilterParamsFromSearch = (search: DataTableSearchParams): GetManyParams => {
	// We are only able to sort by one thing right now, so grab the first thing
	const sort = search.sort[0];
	const limit = search.perPage;
	const offset = (search.page - 1) * search.perPage;
	// The search param parser lets us sort by any key of a pub, but we only support updatedAt and createdAt atm
	const orderBy = sort.id === "createdAt" ? "createdAt" : "updatedAt";
	const orderDirection = sort.desc ? "desc" : "asc";

	return { limit, offset, orderBy, orderDirection };
};
