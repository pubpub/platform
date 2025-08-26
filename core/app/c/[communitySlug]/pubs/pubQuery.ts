/** Based on https://github.com/sadmann7/shadcn-table/blob/main/src/app/_lib/validations.ts */

import type { Prettify } from "@ts-rest/core";
import type { inferParserType } from "nuqs/server";

import {
	createSearchParamsCache,
	parseAsArrayOf,
	parseAsInteger,
	parseAsString,
} from "nuqs/server";

import type { ProcessedPub, SlugKeyFilter } from "contracts";
import type { PubTypesId, StagesId } from "db/public";
import { getFiltersStateParser, getSortingStateParser } from "ui/data-table-paged";

import type { GetManyParams, GetPubsWithRelatedValuesOptions } from "~/lib/server";

const DEFAULT_PAGE_SIZE = 10;
export type PubSearchParams = inferParserType<typeof pubSearchParsers>;
export const pubSearchParsers = {
	page: parseAsInteger.withDefault(1),
	perPage: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
	query: parseAsString.withDefault(""),
	sort: getSortingStateParser<{
		updatedAt: string;
		createdAt: string;
		title: string;
	}>().withDefault([{ id: "updatedAt", desc: true }]),
	filters: getFiltersStateParser<{
		[fieldString: `${string}:${string}`]: any;
	}>().withDefault([]),
	pubTypes: parseAsArrayOf(parseAsString).withDefault([]),
	stages: parseAsArrayOf(parseAsString).withDefault([]),
};
export const pubSearchParamsCache = createSearchParamsCache(pubSearchParsers);

/**
 * Returns the params we can pass into `getPubsWithRelatedValues` based on
 * search params
 */
export const getPubFilterParamsFromSearch = (
	search: PubSearchParams
): Pick<
	GetPubsWithRelatedValuesOptions,
	"filters" | "orderBy" | "orderDirection" | "limit" | "offset" | "filters"
> & {
	pubTypes?: PubTypesId[];
	stages?: StagesId[];
} => {
	// We are only able to sort by one thing right now, so grab the first thing
	const sort = search.sort[0];
	const limit = search.perPage;
	const offset = (search.page - 1) * search.perPage;
	// The search param parser lets us sort by any key of a pub, but we only support updatedAt and createdAt atm
	const orderBy = sort.id === "createdAt" ? "createdAt" : "updatedAt";
	const orderDirection = sort.desc ? "desc" : "asc";

	const filters = search.filters?.reduce((acc, filter) => {
		acc[filter.id] = {
			...(acc[filter.id] || {}),
			[filter.operator]: filter.value,
		};

		return acc;
	}, {} as SlugKeyFilter);

	return {
		limit,
		offset,
		orderBy,
		orderDirection,
		filters,
		pubTypes: search.pubTypes as PubTypesId[] | undefined,
		stages: search.stages as StagesId[] | undefined,
	};
};
