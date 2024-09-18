import type { CommunitiesId, PubsId, PubValues, StagesId } from "db/public";

import { db } from "~/kysely/database";
import { getPubCached } from "~/lib/server";
import { AutoReturnType } from "~/lib/types";
import { FormElement } from "../../forms/FormElement";
import { createDefaultFormElementDefsForPubType } from "./helpers";
import { PubEditorClient } from "./PubEditorClient";
import { getCommunityById, getStage } from "./queries";

export type PubEditorProps = {
	searchParams: Record<string, unknown>;
} & (
	| {
			pubId: PubsId;
			parentId?: PubsId;
	  }
	| {
			communityId: CommunitiesId;
	  }
	| {
			stageId: StagesId;
	  }
);

export async function PubEditor(props: PubEditorProps) {
	let pub: Awaited<ReturnType<typeof getPubCached>> | undefined;
	let stage: AutoReturnType<typeof getStage>["executeTakeFirstOrThrow"] | undefined;
	let community: AutoReturnType<typeof getCommunityById>["executeTakeFirstOrThrow"];

	if ("pubId" in props) {
		pub = await getPubCached(props.pubId);
		community = await getCommunityById(
			// @ts-expect-error FIXME: I don't know how to fix this,
			// not sure what the common type between EB and the DB is
			db,
			pub.communityId
		).executeTakeFirstOrThrow();
	} else if ("stageId" in props) {
		const result = await getStage(props.stageId).executeTakeFirstOrThrow();
		stage = result;
		community = result.community;
	} else {
		community = await getCommunityById(
			// @ts-expect-error FIXME: I don't know how to fix this,
			// not sure what the common type between EB and the DB is
			db,
			props.communityId
		).executeTakeFirstOrThrow();
	}

	const pubValues = pub?.values ?? {};

	let pubType: any;

	if (props.searchParams.pubTypeId) {
		pubType = community.pubTypes.find((p) => p.id === props.searchParams.pubTypeId);
	} else if (pub === undefined) {
		pubType = community.pubTypes[0];
	} else {
		pubType = community.pubTypes.find((p) => p.id === pub.pubTypeId);
	}

	const formElements = createDefaultFormElementDefsForPubType(pubType).map((formElementDef) => (
		<FormElement
			key={formElementDef.elementId}
			element={formElementDef}
			searchParams={props.searchParams}
			communitySlug={community.slug}
			values={pubValues}
			pubId={pub?.id}
		/>
	));

	console.log("pubType", pubType);
	console.log("formElements", formElements);

	const currentStageId = pub?.stages[0]?.id ?? ("stageId" in props ? props.stageId : undefined);
	const currentStage = community.stages.find((stage) => stage.id === currentStageId);

	return (
		<PubEditorClient
			currentStage={currentStage}
			communityStages={community.stages}
			availablePubTypes={community.pubTypes}
			parentId={"parentId" in props ? props.parentId : undefined}
			pubValues={pubValues as unknown as PubValues}
			pubTypeId={pubType?.id}
			formElements={formElements}
			pubId={pub?.id}
		/>
	);
}
