import { randomUUID } from "crypto";

import type { CommunitiesId, PubsId, StagesId } from "db/public";
import { expect } from "utils";

import type { AutoReturnType, PubField } from "~/lib/types";
import { db } from "~/kysely/database";
import { getPubCached, getPubs, getPubTypesForCommunity } from "~/lib/server";
import { getForm } from "~/lib/server/form";
import { getPubFields } from "~/lib/server/pubFields";
import { ContextEditorContextProvider } from "../../ContextEditor/ContextEditorContext";
import { FormElement } from "../../forms/FormElement";
import { FormElementToggleProvider } from "../../forms/FormElementToggleContext";
import { StageSelectClient } from "../../StageSelect/StageSelectClient";
import { PubEditorWrapper } from "./PubEditorWrapper";
import { getCommunityById, getStage } from "./queries";

export type PubEditorProps = {
	searchParams: Record<string, unknown>;
	formId?: string;
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
		community = await getCommunityById(
			// @ts-expect-error FIXME: I don't know how to fix this,
			// not sure what the common type between EB and the DB is
			db,
			props.communityId
		).executeTakeFirstOrThrow();
	}

	const [pubs, pubTypes] = await Promise.all([
		getPubs({ communityId: community.id }),
		getPubTypesForCommunity(community.id),
	]);

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
			(
				await getPubFields({
					pubId: pub.id,
					communityId: community.id,
				}).executeTakeFirstOrThrow()
			).fields
		);
	}

	const form = await getForm({
		communityId: community.id,
		pubTypeId: pubType.id,
	}).executeTakeFirstOrThrow(
		() => new Error(`Could not find a form for pubtype ${pubType.name}`)
	);

	// TODO: render markdown content
	// TODO: render the pubvalues that are not on the form but might be on the pub
	const formElements = form.elements.map((e) => (
		<FormElement
			key={e.elementId}
			pubId={pubId}
			element={e}
			searchParams={props.searchParams}
			communitySlug={community.slug}
			values={pub ? pub.values : {}}
		/>
	));

	const currentStageId = pub?.stages[0]?.id ?? ("stageId" in props ? props.stageId : undefined);
	const pubForForm = pub ?? { id: pubId, values: {}, pubTypeId: form.pubTypeId };

	return (
		<FormElementToggleProvider fieldSlugs={pubFields.map((pubField) => pubField.slug)}>
			<ContextEditorContextProvider
				pubId={pubId}
				pubTypeId={pubType.id}
				pubs={pubs}
				pubTypes={pubTypes}
			>
				<PubEditorWrapper
					elements={form.elements}
					parentId={"parentId" in props ? props.parentId : undefined}
					pub={pubForForm}
					isUpdating={isUpdating}
					withAutoSave={false}
					withButtonElements={false}
					formId={props.formId}
					stageId={currentStageId}
				>
					<>
						<StageSelectClient
							fieldLabel="Stage"
							fieldName="stageId"
							stages={community.stages}
						/>
						{formElements}
					</>
				</PubEditorWrapper>
			</ContextEditorContextProvider>
		</FormElementToggleProvider>
	);
}
