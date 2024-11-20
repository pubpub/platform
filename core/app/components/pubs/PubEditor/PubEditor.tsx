import assert from "assert";
import { randomUUID } from "crypto";

import dynamic from "next/dynamic";

import type { PubsId, StagesId } from "db/public";
import { expect } from "utils";

import type { AutoReturnType } from "~/lib/types";
import { db } from "~/kysely/database";
import { getPubCached, getPubs } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { ContextEditorContextProvider } from "../../ContextEditor/ContextEditorContext";
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
	const pubTypes = community.pubTypes;
	if (!pubTypeId) {
		const pubType = pubTypes[0];
		const pubFields = pubType.fields;
		return {
			pubType,
			pubTypes,
			pubFields,
		};
	}
	const pubType = expect(
		pubTypes.find((p) => p.id === pubTypeId),
		"URL contained invalid pub type id"
	);
	const pubFields = Object.values(pubType.fields);
	return {
		pubType,
		pubTypes,
		pubFields,
	};
};

const getCorrectPubEditorProps = async (props: PubEditorProps) => {
	const comm = await findCommunityBySlug();
	assert(comm);

	if (props.method === "update") {
		const [pubs, pub, community] = await Promise.all([
			getPubs({ communityId: comm.id }),
			getPubCached(props.pubId),
			getCommunityById(
				// @ts-expect-error FIXME: I don't know how to fix this,
				// not sure what the common type between EB and the DB is
				db,
				comm.id
			).executeTakeFirstOrThrow(),
		]);

		const { pubType, pubFields, pubTypes } = getPubTypeFromCommunity(community, pub.pubTypeId);

		return {
			pub,
			pubs,
			pubFields,
			pubType,
			pubTypes,
			community,
			stage: null,
			pubValues: pub.values,
		};
	}
	// else it's a create form

	// create form with stage
	if (props.method === "create" && props.stageId) {
		const [pubs, result] = await Promise.all([
			getPubs({ communityId: comm.id }),
			getStage(props.stageId).executeTakeFirstOrThrow(),
		]);
		const { pubType, pubFields, pubTypes } = getPubTypeFromCommunity(
			result.community,
			props.searchParams.pubTypeId as string | undefined
		);

		return {
			pub: null,
			pubs,
			stage: result,
			community: result.community,
			pubType,
			pubFields,
			pubTypes,
			pubValues: {},
		};
	}

	// create form without stage

	const [pubs, community] = await Promise.all([
		getPubs({ communityId: comm.id }),
		getCommunityById(
			// @ts-expect-error FIXME: I don't know how to fix this,
			// not sure what the common type between EB and the DB is
			db,
			comm.id
		).executeTakeFirstOrThrow(),
	]);

	const { pubType, pubFields, pubTypes } = getPubTypeFromCommunity(
		community,
		props.searchParams.pubTypeId as string | undefined
	);
	return { community, pub: null, pubs, stage: null, pubType, pubFields, pubTypes, pubValues: {} };
};

export async function PubEditor(props: PubEditorProps) {
	const { pub, pubs, pubTypes, pubFields, pubType, community, pubValues } =
		await getCorrectPubEditorProps(props);

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
		<ContextEditorContextProvider
			pubId={pub?.id}
			pubTypeId={pubType.id}
			pubs={pubs}
			pubTypes={pubTypes}
		>
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
		</ContextEditorContextProvider>
	);

	if (props.method === "update") {
		return editor;
	}

	return (
		<FormElementToggleProvider fieldSlugs={pubFields.map((pubField) => pubField.slug)}>
			{editor}
		</FormElementToggleProvider>
	);
}
