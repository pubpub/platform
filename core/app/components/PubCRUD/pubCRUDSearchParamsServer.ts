import { createSearchParamsCache, parseAsString } from "nuqs/server";

export const pubCRUDSearchParamsParser = parseAsString.withOptions({
	shallow: false,
});

export const pubCRUDSearchParamsCache = createSearchParamsCache({
	"create-pub-form": pubCRUDSearchParamsParser,
	"update-pub-form": pubCRUDSearchParamsParser,
	"remove-pub-form": pubCRUDSearchParamsParser,
});
