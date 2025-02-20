import { randomUUID } from "crypto";

import type { ProcessedPub } from "contracts";
import type { CommunitiesId, PubFieldsId, PubsId, PubTypesId, StagesId } from "db/public";
import { expect } from "utils";

import type { FormElements, PubFieldElement } from "../../forms/types";
import type { RenderWithPubContext } from "~/lib/server/render/pub/renderWithPubUtils";
import type { AutoReturnType, PubField } from "~/lib/types";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";
import { getForm } from "~/lib/server/form";
import { getPubsWithRelatedValuesAndChildren } from "~/lib/server/pub";
import { getPubFields } from "~/lib/server/pubFields";
import { getPubTypesForCommunity } from "~/lib/server/pubtype";
import { ContextEditorContextProvider } from "../../ContextEditor/ContextEditorContext";
import { FormElement } from "../../forms/FormElement";
import { FormElementToggleProvider } from "../../forms/FormElementToggleContext";
import { PubFieldFormElement } from "../../forms/PubFieldFormElement";
import { hydrateMarkdownElements } from "../../forms/structural";
import { StageSelectClient } from "../../StageSelect/StageSelectClient";
import { RELATED_PUB_SLUG } from "./constants";
import { makeFormElementDefFromPubFields } from "./helpers";
import { PubEditorWrapper } from "./PubEditorWrapper";
import { getCommunityById, getStage } from "./queries";

const RelatedPubValueElement = ({
	relatedPubId,
	element,
}: {
	relatedPubId: PubsId;
	element: PubFieldElement | null;
}) => {
	if (!element || !relatedPubId) {
		return null;
	}
	const configLabel = "label" in element.config ? element.config.label : undefined;
	const label = configLabel || element.label || element.slug;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-4 rounded border p-2">
				<h2>Related field value</h2>
				<PubFieldFormElement
					label={label}
					element={element}
					pubId={relatedPubId}
					slug={RELATED_PUB_SLUG}
					values={[]}
				/>
			</div>
			<hr />
		</div>
	);
};

const makeRelatedPubElement = ({
	relatedPubFieldResult,
}: {
	relatedPubFieldResult: {
		fields: Record<PubFieldsId, PubField>;
	} | null;
}) => {
	if (!relatedPubFieldResult) {
		return null;
	}
	const relatedPubField = Object.values(relatedPubFieldResult.fields)[0];

	// TODO: should really get this from the source pub's form, if it exists
	const relatedPubElement = makeFormElementDefFromPubFields([
		relatedPubField,
	])[0] as PubFieldElement;
	return { ...relatedPubElement, slug: RELATED_PUB_SLUG };
};

export type PubEditorProps = {
	searchParams: { relatedPubId?: PubsId; slug?: string; pubTypeId?: PubTypesId };
	formId?: string;
} & (
	| {
			pubId: PubsId;
			communityId: CommunitiesId;
	  }
	| {
			communityId: CommunitiesId;
	  }
	| {
			communityId: CommunitiesId;
			stageId: StagesId;
	  }
);

export async function PubEditor(props: PubEditorProps) {
	let pub:
		| ProcessedPub<{ withStage: true; withLegacyAssignee: true; withPubType: true }>
		| undefined;
	let community: AutoReturnType<typeof getCommunityById>["executeTakeFirstOrThrow"];

	const { user } = await getLoginData();

	if ("pubId" in props) {
		pub = await getPubsWithRelatedValuesAndChildren(
			{
				pubId: props.pubId,
				communityId: props.communityId,
				userId: user?.id,
			},
			{
				withPubType: true,
				withStage: true,
				withLegacyAssignee: true,
			}
		);
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

	const { relatedPubId, slug: relatedFieldSlug } = props.searchParams;

	const [pubs, pubTypes, relatedPubFieldResult] = await Promise.all([
		getPubsWithRelatedValuesAndChildren(
			{ communityId: community.id },
			{
				withLegacyAssignee: true,
				withPubType: true,
				withStage: true,
				limit: 30,
			}
		),
		getPubTypesForCommunity(community.id),
		relatedPubId && relatedFieldSlug
			? getPubFields({
					communityId: community.id,
					slugs: [relatedFieldSlug as string],
				}).executeTakeFirstOrThrow(
					() => new Error(`Could not find related field with slug ${relatedFieldSlug}`)
				)
			: Promise.resolve(null),
	]);

	const relatedPubElement = makeRelatedPubElement({
		relatedPubFieldResult,
	});

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
	const parentPub = pub?.parentId
		? await getPubsWithRelatedValuesAndChildren(
				{ pubId: pub.parentId, communityId: props.communityId },
				{ withStage: true, withLegacyAssignee: true, withPubType: true }
			)
		: undefined;

	const formElements = form.elements.map((e) => (
		<FormElement key={e.id} pubId={pubId} element={e} values={pub ? pub.values : []} />
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
		relatedPubElement ? relatedPubElement.slug : undefined,
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
		recipient: memberWithUser as RenderWithPubContext["recipient"],
		communitySlug: community.slug,
		pub: pub as RenderWithPubContext["pub"],
		parentPub,
	} satisfies RenderWithPubContext;

	await hydrateMarkdownElements({
		elements: form.elements,
		renderWithPubContext: pub ? renderWithPubContext : undefined,
	});

	const currentStageId = pub?.stage?.id ?? ("stageId" in props ? props.stageId : undefined);
	const pubForForm = pub ?? { id: pubId, values: [], pubTypeId: form.pubTypeId };

	return (
		<FormElementToggleProvider fieldSlugs={allSlugs}>
			<ContextEditorContextProvider
				pubId={pubId}
				pubTypeId={pubType.id}
				pubs={pubs}
				pubTypes={pubTypes}
			>
				<PubEditorWrapper
					elements={[
						...form.elements,
						...pubOnlyElementDefinitions,
						...(relatedPubElement ? [relatedPubElement] : []),
					]}
					pub={pubForForm}
					formSlug={form.slug}
					isUpdating={isUpdating}
					withAutoSave={false}
					withButtonElements={false}
					htmlFormId={props.formId}
					stageId={currentStageId}
					relatedPub={
						relatedPubId && relatedFieldSlug
							? {
									id: relatedPubId as PubsId,
									slug: relatedFieldSlug as string,
								}
							: undefined
					}
				>
					<>
						<RelatedPubValueElement
							relatedPubId={relatedPubId as PubsId}
							element={relatedPubElement}
						/>
						<StageSelectClient
							fieldLabel="Stage"
							fieldName="stageId"
							stages={community.stages}
						/>
						{formElements}
						{pubOnlyElementDefinitions.map((formElementDef) => (
							<FormElement
								key={formElementDef.slug}
								element={formElementDef as FormElements}
								pubId={pubId}
								values={pub ? pub.values : []}
							/>
						))}
					</>
				</PubEditorWrapper>
			</ContextEditorContextProvider>
		</FormElementToggleProvider>
	);
}
