import { randomUUID } from "crypto";

import type { ProcessedPub } from "contracts";
import type { CommunitiesId, PubsId, PubTypesId, StagesId } from "db/public";
import { Capabilities, CoreSchemaType, MembershipType } from "db/public";
import { expect } from "utils";

import type { FormElements, PubFieldElement } from "../../forms/types";
import type { RenderWithPubContext } from "~/lib/server/render/pub/renderWithPubUtils";
import type { AutoReturnType, PubField } from "~/lib/types";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { transformRichTextValuesToProsemirror } from "~/lib/editor/serialize-server";
import { getPubByForm, getPubTitle } from "~/lib/pubs";
import { getForm } from "~/lib/server/form";
import { getPubsWithRelatedValues } from "~/lib/server/pub";
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
	relatedPub,
	fieldName,
	element,
}: {
	relatedPub: ProcessedPub<{ withPubType: true }>;
	fieldName: string;
	element: PubFieldElement;
}) => {
	const configLabel =
		"relationshipConfig" in element.config
			? element.config.relationshipConfig.label
			: element.config.label;
	const label = configLabel || element.label || element.slug;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-4 rounded border p-2">
				<h2>Related field value</h2>
				<p className="text-sm">
					You are creating a Pub related to{" "}
					<span className="font-semibold">{getPubTitle(relatedPub)}</span> through the{" "}
					<span className="font-semibold">{fieldName}</span> pub field.
					{element.schemaName !== CoreSchemaType.Null && (
						<span>Please enter a value for this relationship.</span>
					)}
				</p>
				<PubFieldFormElement
					label={label}
					element={element}
					pubId={relatedPub.id}
					slug={RELATED_PUB_SLUG}
					values={[]}
				/>
			</div>
			<hr />
		</div>
	);
};

const getRelatedPubData = async ({
	communityId,
	relatedPubId,
	slug,
}: {
	communityId: CommunitiesId;
	relatedPubId: PubsId | undefined;
	slug: string | undefined;
}) => {
	if (!relatedPubId || !slug) {
		return null;
	}
	const [relatedPub, relatedPubFieldResult] = await Promise.all([
		getPubsWithRelatedValues({ pubId: relatedPubId, communityId }, { withPubType: true }),
		getPubFields({
			communityId: communityId,
			slugs: [slug],
		}).executeTakeFirstOrThrow(
			() => new Error(`Could not find related field with slug ${slug}`)
		),
	]);
	const relatedPubField = Object.values(relatedPubFieldResult.fields)[0];

	// TODO: should maybe get this from the source pub's form?
	// otherwise this will always be the default component
	const relatedPubElement = makeFormElementDefFromPubFields([
		relatedPubField,
	])[0] as PubFieldElement;
	return {
		element: { ...relatedPubElement, slug: RELATED_PUB_SLUG },
		relatedPub,
		relatedPubField,
	};
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
	let pub: ProcessedPub<{ withStage: true; withPubType: true }> | undefined;
	let community: AutoReturnType<typeof getCommunityById>["executeTakeFirstOrThrow"];

	const { user } = await getLoginData();

	if ("pubId" in props) {
		// We explicitly do not pass the user here for two reasons:
		// (1) It's expected that to see the PubEditor component at all, the
		// user has the capabilities necessary to edit the pub's local values
		// exposed by the form.
		// (2) We want to fetch the pub's related pubs' values in order to
		// render the related pub title/name in the related pubs form element,
		// even if the user does not have capabilities to view the related pub.
		pub = await getPubsWithRelatedValues(
			{
				pubId: props.pubId,
				communityId: props.communityId,
			},
			{
				withPubType: true,
				withStage: true,
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

	const [pubs, pubTypes, relatedPubData] = await Promise.all([
		getPubsWithRelatedValues(
			{ communityId: community.id },
			{
				withPubType: true,
				withStage: true,
				limit: 30,
			}
		),
		getPubTypesForCommunity(community.id, { limit: 0 }),
		getRelatedPubData({
			relatedPubId,
			slug: relatedFieldSlug,
			communityId: community.id,
		}),
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

	const pubWithProsemirrorRichText = pub
		? transformRichTextValuesToProsemirror(pub, { toJson: true })
		: undefined;

	const formElements = form.elements.map((e) => (
		<FormElement
			key={e.id}
			pubId={pubId}
			element={e}
			values={pubWithProsemirrorRichText ? pubWithProsemirrorRichText.values : []}
		/>
	));

	// These are pub values that are only on the pub, but not on the form. We render them at the end of the form.
	const pubOnlyElementDefinitions = pubWithProsemirrorRichText
		? makeFormElementDefFromPubFields(
				pubFields.filter((pubField) => {
					return !form.elements.find((e) => e.slug === pubField.slug);
				})
			)
		: [];

	const allSlugs = [
		...form.elements.map((e) => e.slug),
		...pubOnlyElementDefinitions.map((e) => e.slug),
		relatedPubData ? relatedPubData.element.slug : undefined,
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

	const renderStageSelect =
		pubWithProsemirrorRichText === undefined ||
		(await userCan(Capabilities.movePub, { type: MembershipType.pub, pubId }, user!.id));

	const renderWithPubContext = {
		communityId: community.id,
		recipient: memberWithUser as RenderWithPubContext["recipient"],
		communitySlug: community.slug,
		pub: pubWithProsemirrorRichText as RenderWithPubContext["pub"],
		trx: db,
	} satisfies RenderWithPubContext;

	await hydrateMarkdownElements({
		elements: form.elements,
		renderWithPubContext: pubWithProsemirrorRichText ? renderWithPubContext : undefined,
	});

	const currentStageId =
		pubWithProsemirrorRichText?.stage?.id ?? ("stageId" in props ? props.stageId : undefined);
	const pubForForm = pubWithProsemirrorRichText
		? getPubByForm({
				pub: pubWithProsemirrorRichText,
				form,
				withExtraPubValues: user
					? await userCan(
							Capabilities.seeExtraPubValues,
							{ type: MembershipType.pub, pubId: pubWithProsemirrorRichText.id },
							user.id
						)
					: false,
			})
		: { id: pubId, values: [], pubTypeId: form.pubTypeId };

	// For the Context, we want both the pubs from the initial pub query (which is limited)
	// as well as the pubs related to this pub
	const relatedPubs = pubWithProsemirrorRichText
		? pubWithProsemirrorRichText.values.flatMap((v) => (v.relatedPub ? [v.relatedPub] : []))
		: [];
	const pubsForContext = [...pubs, ...relatedPubs];

	return (
		<FormElementToggleProvider fieldSlugs={allSlugs}>
			<ContextEditorContextProvider
				pubId={pubId}
				pubTypeId={pubType.id}
				pubs={pubsForContext}
				pubTypes={pubTypes}
			>
				<PubEditorWrapper
					elements={[
						...form.elements,
						...pubOnlyElementDefinitions,
						...(relatedPubData ? [relatedPubData.element] : []),
					]}
					pub={pubForForm}
					formSlug={form.slug}
					isUpdating={isUpdating}
					withAutoSave={false}
					withButtonElements
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
						{relatedPubData ? (
							<RelatedPubValueElement
								relatedPub={relatedPubData.relatedPub}
								element={relatedPubData.element}
								fieldName={relatedPubData.relatedPubField.name}
							/>
						) : null}
						{renderStageSelect && (
							<StageSelectClient
								fieldLabel="Stage"
								fieldName="stageId"
								stages={community.stages}
							/>
						)}
						{formElements}
						{pubOnlyElementDefinitions.map((formElementDef) => (
							<FormElement
								key={formElementDef.slug}
								element={formElementDef as FormElements}
								pubId={pubId}
								values={
									pubWithProsemirrorRichText
										? pubWithProsemirrorRichText.values
										: []
								}
							/>
						))}
					</>
				</PubEditorWrapper>
			</ContextEditorContextProvider>
		</FormElementToggleProvider>
	);
}
