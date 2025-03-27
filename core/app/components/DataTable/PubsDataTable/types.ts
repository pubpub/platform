import type { ProcessedPub } from "contracts";

export type PubForTable = ProcessedPub<{
	withPubType: true;
	withRelatedPubs: false;
	withStage: true;
	withValues: false;
	withLegacyAssignee: true;
}>;
