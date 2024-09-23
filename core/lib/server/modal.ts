import { createSearchParamsCache, parseAsString } from "nuqs/server";

export const MODAL_SEARCH_PARAM = "modal" as const;

export const modalSearchParamParser = parseAsString.withOptions({
	shallow: false,
});

export const modalSearchParamsCache = createSearchParamsCache({
	[MODAL_SEARCH_PARAM]: modalSearchParamParser,
});

export const isModalOpen = (identifyingString: string) =>
	modalSearchParamsCache.get(MODAL_SEARCH_PARAM) === identifyingString;
