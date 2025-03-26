import type { inferParserType } from "nuqs";

import type { ProcessedPub } from "contracts";

import type { dataTableParsers } from "./validations";

export type PubForTable = ProcessedPub<{
	withPubType: true;
	withRelatedPubs: false;
	withStage: true;
	withValues: false;
	withLegacyAssignee: true;
}>;

export type DataTableSearchParams = inferParserType<typeof dataTableParsers>;
