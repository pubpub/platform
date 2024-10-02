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
	searchParams: Record<string, string | string[] | undefined>;
} & (
	| {
			method: "update";
			pubId: PubsId;
	  }
	| {
			method: "create";
			stageId?: StagesId;
			parentId?: PubsId;
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

const getPubTypeFromCommunity = (
	community: AutoReturnType<typeof getCommunityById>["executeTakeFirstOrThrow"],
	pubTypeId?: string
) => {
	if (!pubTypeId) {
		const pubType = community.pubTypes[0];
		const pubFields = pubType.fields;
		return {
			pubType,
			pubFields,
		};
	}
	const pubType = expect(
		community.pubTypes.find((p) => p.id === pubTypeId),
		"URL contained invalid pub type id"
	);
	const pubFields = Object.values(pubType.fields);
	return {
		pubType,
		pubFields,
	};
};

const getCorrectPubEditorProps = async (props: PubEditorProps) => {
	const comm = await findCommunityBySlug();
	assert(comm);

	if (props.method === "update") {
		const [pub, community] = await Promise.all([
			getPubCached(props.pubId),
			getCommunityById(
				// @ts-expect-error FIXME: I don't know how to fix this,
				// not sure what the common type between EB and the DB is
				db,
				comm.id
			).executeTakeFirstOrThrow(),
		]);

		const pubType = expect(
			community.pubTypes.find((p) => p.id === pub.pubTypeId),
			"Invalid pub type"
		);

		// const pubFieldsResult = await getPubFields({ pubId: pub.id }).executeTakeFirstOrThrow();

		const { pubFields } = getPubTypeFromCommunity(community, pubType.id);

		return {
			pub,
			pubFields,
			pubType,
			community,
			stage: null,
			pubValues: pub.values,
		};
	}
	// else it's a create form

	if (props.method === "create" && props.stageId) {
		const result = await getStage(props.stageId).executeTakeFirstOrThrow();
		const { pubType, pubFields } = getPubTypeFromCommunity(
			result.community,
			props.searchParams.pubTypeId as string | undefined
		);
		return {
			pub: null,
			stage: result,
			community: result.community,
			pubType,
			pubFields,
			pubValues: {},
		};
	}

	const community = await getCommunityById(
		// @ts-expect-error FIXME: I don't know how to fix this,
		// not sure what the common type between EB and the DB is
		db,
		comm.id
	).executeTakeFirstOrThrow();

	const { pubType, pubFields } = getPubTypeFromCommunity(
		community,
		props.searchParams.pubTypeId as string | undefined
	);
	return { community, pub: null, stage: null, pubType, pubFields, pubValues: {} };
};

export async function PubEditor(props: PubEditorProps) {
	const { pub, pubFields, pubType, community, pubValues } = await getCorrectPubEditorProps(props);

	const pubId = pub?.id ?? (randomUUID() as PubsId);

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
			method={props.method}
		/>
	);

	if (props.method === "update") {
		return editor;
	}

	return (
		<FormElementToggleProvider fields={pubFields.map((pubField) => pubField.slug)}>
			{editor}
		</FormElementToggleProvider>
	);
}
