import type { CommunitiesId, PubsId, PubValues, StagesId } from "db/public";
import { expect } from "utils";

import { db } from "~/kysely/database";
import { getPubCached } from "~/lib/server";
import { getPubFields } from "~/lib/server/pubFields";
import { AutoReturnType, PubField } from "~/lib/types";
import { FormElement } from "../../forms/FormElement";
import { makeFormElementDefFromPubFields } from "./helpers";
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

	let pubType: AutoReturnType<
		typeof getCommunityById
	>["executeTakeFirstOrThrow"]["pubTypes"][number];
	let pubFields: Pick<PubField, "id" | "name" | "slug" | "schemaName">[];

	if (pub === undefined) {
		if (props.searchParams.pubTypeId) {
			pubType = expect(
				community.pubTypes.find((p) => p.id === props.searchParams.pubTypeId),
				"URL contained invalid pub type id"
			);
			pubFields = Object.values(pubType.fields);
		} else {
			pubType = community.pubTypes[0];
			pubFields = pubType.fields;
		}
	} else {
		pubType = expect(
			community.pubTypes.find((p) => p.id === pub.pubTypeId),
			"Invalid community pub type"
		);
		pubFields = Object.values(
			(await getPubFields({ pubId: pub.id }).executeTakeFirstOrThrow()).fields
		);
	}

	const formElements = makeFormElementDefFromPubFields(pubFields).map((formElementDef) => (
		<FormElement
			key={formElementDef.elementId}
			element={formElementDef}
			searchParams={props.searchParams}
			communitySlug={community.slug}
			values={pubValues}
			pubId={pub?.id}
		/>
	));

	const currentStageId = pub?.stages[0]?.id ?? ("stageId" in props ? props.stageId : undefined);

	return (
		<PubEditorClient
			availablePubTypes={community.pubTypes}
			availableStages={community.stages}
			communityId={community.id}
			formElements={formElements}
			parentId={"parentId" in props ? props.parentId : undefined}
			pubFields={pubFields}
			pubId={pub?.id}
			pubTypeId={pubType?.id}
			pubValues={pubValues as unknown as PubValues}
			stageId={currentStageId}
		/>
	);
}
