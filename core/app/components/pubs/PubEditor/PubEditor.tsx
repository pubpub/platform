import assert from "assert";
import { randomUUID } from "crypto";

import dynamic from "next/dynamic";

import type { CommunitiesId, PubsId, StagesId } from "db/public";
import { expect } from "utils";

import type { AutoReturnType, PubField } from "~/lib/types";
import { db } from "~/kysely/database";
import { getPubCached } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { getPubFields } from "~/lib/server/pubFields";
import { FormElement } from "../../forms/FormElement";
import { FormElementToggleProvider } from "../../forms/FormElementToggleContext";
import { SkeletonCard } from "../../skeletons/SkeletonCard";
import { makeFormElementDefFromPubFields } from "./helpers";
import { getCommunityById, getStage } from "./queries";

export type PubEditorProps = {
	searchParams: Record<string, unknown>;
} & (
	| {
			pubId: PubsId;
			parentId?: PubsId;
	  }
	// | {
	// 		communityId: CommunitiesId;
	//   }
	| {
			stageId: StagesId;
	  }
);

const PubEditorClient = dynamic(
	async () => {
		return import("./PubEditorClient").then((mod) => ({
			default: mod.PubEditorClient,
		}));
	},
	{ ssr: false, loading: () => <SkeletonCard /> }
);

export async function PubEditor(props: PubEditorProps) {
	let pub: Awaited<ReturnType<typeof getPubCached>> | undefined;
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
		community = result.community;
	} else {
		const commy = await findCommunityBySlug();
		assert(commy);
		community = await getCommunityById(
			// @ts-expect-error FIXME: I don't know how to fix this,
			// not sure what the common type between EB and the DB is
			db,
			commy.id
		).executeTakeFirstOrThrow();
	}

	const pubValues = pub?.values ?? {};

	let pubType: AutoReturnType<
		typeof getCommunityById
	>["executeTakeFirstOrThrow"]["pubTypes"][number];
	let pubFields: Pick<PubField, "id" | "name" | "slug" | "schemaName">[];

	// Create the pubId before inserting into the DB if one doesn't exist.
	// FileUpload needs the pubId when uploading the file before the pub exists
	const isUpdating = !!pub?.id;
	const pubId = pub?.id ?? (randomUUID() as PubsId);

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
			pubId={pubId}
		/>
	));

	const currentStageId = pub?.stages[0]?.id ?? ("stageId" in props ? props.stageId : undefined);

	const editor = (
		<PubEditorClient
			availablePubTypes={community.pubTypes}
			availableStages={community.stages}
			communityId={community.id}
			formElements={formElements}
			parentId={"parentId" in props ? props.parentId : undefined}
			pubFields={pubFields}
			pubId={pubId}
			pubTypeId={pubType?.id}
			pubValues={pubValues}
			stageId={currentStageId}
			isUpdating={isUpdating}
		/>
	);

	if (isUpdating) {
		return editor;
	}

	return (
		<FormElementToggleProvider fields={pubFields.map((pubField) => pubField.slug)}>
			{editor}
		</FormElementToggleProvider>
	);
}
