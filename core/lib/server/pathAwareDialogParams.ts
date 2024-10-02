import { createSearchParamsCache, parseAsString } from "nuqs/server";

export const PATH_AWARE_DIALOG_SEARCH_PARAM = "pad" as const;

export const pathAwareDialogSearchParamParser = parseAsString.withOptions({
	shallow: false,
});

export const pathAwareDialogSearchParamsCache = createSearchParamsCache({
	[PATH_AWARE_DIALOG_SEARCH_PARAM]: pathAwareDialogSearchParamParser,
});

/**
 * When called at the top of a component, will allow subsequent calls to `getPathAwareDialogSearchParam` to return the same value.
 * This is very much like a `jotai` atom, only on the server.
 *
 */
export const setupPathAwareDialogSearchParamCache = (
	searchParams: Record<string, string | string[] | undefined>
) => pathAwareDialogSearchParamsCache.parse(searchParams);

export const getPathAwareDialogSearchParam = () =>
	pathAwareDialogSearchParamsCache.get(PATH_AWARE_DIALOG_SEARCH_PARAM);

export const isPathAwareDialogOpen = (identifyingString: string) =>
	pathAwareDialogSearchParamsCache.get(PATH_AWARE_DIALOG_SEARCH_PARAM) === identifyingString;
