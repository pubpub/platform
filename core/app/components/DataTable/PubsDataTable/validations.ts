/** Based on https://github.com/sadmann7/shadcn-table/blob/main/src/app/_lib/validations.ts */

import { createSearchParamsCache, parseAsInteger } from "nuqs/server";

import { getSortingStateParser } from "ui/data-table-paged";

import type { PubForTable } from "./types";

const DEFAULT_PAGE_SIZE = 10;
export const searchParamsCache = createSearchParamsCache({
	page: parseAsInteger.withDefault(1),
	perPage: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
	sort: getSortingStateParser<PubForTable>().withDefault([{ id: "updatedAt", desc: true }]),
});
