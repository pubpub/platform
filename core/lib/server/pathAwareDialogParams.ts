import { createSearchParamsCache, parseAsString } from "nuqs/server";

export const PATH_AWARE_DIALOG_SEARCH_PARAM = "pad" as const;

export const pathAwareDialogSearchParamParser = parseAsString.withOptions({
	shallow: false,
});

export const pathAwareDialogSearchParamsCache = createSearchParamsCache({
	[PATH_AWARE_DIALOG_SEARCH_PARAM]: pathAwareDialogSearchParamParser,
});

/**
 * This will make sure that the cache is populated
 *
 * Required to call on the searchparams of any page that uses the `PathAwareDialog` component
 *
 * TODO: Might be better to just do this inside the component
 */
export const setupPathAwareDialogSearchParamCache = (
	searchParams: Record<string, string | string[] | undefined>
) => pathAwareDialogSearchParamsCache.parse(searchParams);

export const getPathAwareDialogSearchParam = () =>
	pathAwareDialogSearchParamsCache.get(PATH_AWARE_DIALOG_SEARCH_PARAM);

export const isPathAwareDialogOpen = (identifyingString: string) =>
	pathAwareDialogSearchParamsCache.get(PATH_AWARE_DIALOG_SEARCH_PARAM) === identifyingString;
