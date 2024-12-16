import { randomUUID } from "crypto";

import type { CommunitiesId, PubsId, StagesId } from "db/public";
import { expect } from "utils";

import type { RenderWithPubContext } from "~/lib/server/render/pub/renderWithPubUtils";
import type { AutoReturnType, PubField } from "~/lib/types";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";
import { getPubCached, getPubs, getPubTypesForCommunity } from "~/lib/server";
import { getForm } from "~/lib/server/form";
import { getPubFields } from "~/lib/server/pubFields";
import { ContextEditorContextProvider } from "../../ContextEditor/ContextEditorContext";
import { FormElement } from "../../forms/FormElement";
import { FormElementToggleProvider } from "../../forms/FormElementToggleContext";
import { hydrateMarkdownElements } from "../../forms/structural";
import { StageSelectClient } from "../../StageSelect/StageSelectClient";
import { makeFormElementDefFromPubFields } from "./helpers";
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

	const { user } = await getLoginData();

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
	const parentPub = pub?.parentId ? await getPubCached(pub.parentId) : undefined;

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

	// These are pub values that are only on the pub, but not on the form. We render them at the end of the form.
	const pubOnlyElementDefinitions = pub
		? makeFormElementDefFromPubFields(
				pubFields.filter((pubField) => {
					return !form.elements.find((e) => e.slug === pubField.slug);
				})
			)
		: [];

	const allSlugs = [
		...form.elements.map((e) => e.slug),
		...pubOnlyElementDefinitions.map((e) => e.slug),
	].filter((slug) => !!slug) as string[];

	const member = expect(user?.memberships.find((m) => m.communityId === community?.id));

	const memberWithUser = {
		...member,
		id: member.id,
		user: {
			...user,
			id: user?.id,
		},
	};

	const renderWithPubContext = {
		communityId: community.id,
		recipient: memberWithUser,
		communitySlug: community.slug,
		pub,
		parentPub,
	};

	await hydrateMarkdownElements({
		elements: form.elements,
		renderWithPubContext: pub ? (renderWithPubContext as RenderWithPubContext) : undefined,
	});

	const currentStageId = pub?.stages[0]?.id ?? ("stageId" in props ? props.stageId : undefined);
	const pubForForm = pub ?? { id: pubId, values: {}, pubTypeId: form.pubTypeId };

	return (
		<FormElementToggleProvider fieldSlugs={allSlugs}>
			<ContextEditorContextProvider
				pubId={pubId}
				pubTypeId={pubType.id}
				pubs={pubs}
				pubTypes={pubTypes}
			>
				<PubEditorWrapper
					elements={[...form.elements, ...pubOnlyElementDefinitions]}
					parentId={"parentId" in props ? props.parentId : undefined}
					pub={pubForForm}
					formSlug={form.slug}
					isUpdating={isUpdating}
					withAutoSave={false}
					withButtonElements={false}
					htmlFormId={props.formId}
					stageId={currentStageId}
				>
					<>
						<StageSelectClient
							fieldLabel="Stage"
							fieldName="stageId"
							stages={community.stages}
						/>
						{formElements}
						{pubOnlyElementDefinitions.map((formElementDef) => (
							<FormElement
								key={formElementDef.elementId}
								element={formElementDef}
								pubId={pubId}
								searchParams={props.searchParams}
								communitySlug={community.slug}
								values={pub ? pub.values : {}}
							/>
						))}
					</>
				</PubEditorWrapper>
			</ContextEditorContextProvider>
		</FormElementToggleProvider>
	);
}
