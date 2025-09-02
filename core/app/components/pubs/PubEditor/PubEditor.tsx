import { randomUUID } from "crypto";

import type { User } from "lucia";

import { notFound } from "next/navigation";

import type { ProcessedPub } from "contracts";
import type { Communities, CommunitiesId, FormsId, PubsId, PubTypesId, StagesId } from "db/public";
import { Capabilities, CoreSchemaType, MembershipType } from "db/public";
import { expect } from "utils";

import type {
	BasicPubFieldElement,
	FormElements,
	PubFieldElement,
	PubFieldElementComponent,
} from "../../forms/types";
import type { Form } from "~/lib/server/form";
import type { RenderWithPubContext } from "~/lib/server/render/pub/renderWithPubUtils";
import { db } from "~/kysely/database";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan, userCanMoveAllPubs } from "~/lib/authorization/capabilities";
import { transformRichTextValuesToProsemirror } from "~/lib/editor/serialize-server";
import { getPubByForm, getPubTitle } from "~/lib/pubs";
import { findCommunityBySlug } from "~/lib/server/community";
import { getForm } from "~/lib/server/form";
import { getPubsWithRelatedValues } from "~/lib/server/pub";
import { getPubFields } from "~/lib/server/pubFields";
import { getPubTypesForCommunity } from "~/lib/server/pubtype";
import { getStages } from "~/lib/server/stages";
import { ContextEditorContextProvider } from "../../ContextEditor/ContextEditorContext";
import { FormElement } from "../../forms/FormElement";
import { FormElementToggleProvider } from "../../forms/FormElementToggleContext";
import { PubFieldFormElement } from "../../forms/PubFieldFormElement";
import { hydrateMarkdownElements } from "../../forms/structural";
import { PubFormProvider } from "../../providers/PubFormProvider";
import { StageSelectClient } from "../../StageSelect/StageSelectClient";
import { RELATED_PUB_SLUG } from "./constants";
import { makeFormElementDefFromPubFields } from "./helpers";
import { PubEditorWrapper } from "./PubEditorWrapper";

const RelatedPubValueElement = ({
	relatedPub,
	fieldName,
	element,
}: {
	relatedPub: ProcessedPub<{ withPubType: true }>;
	fieldName: string;
	element: BasicPubFieldElement;
}) => {
	const label = element.label || element.slug;

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
					element={element as PubFieldElement<PubFieldElementComponent, false>}
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
	const relatedPubElement = makeFormElementDefFromPubFields([relatedPubField])[0];
	return {
		element: { ...relatedPubElement, slug: RELATED_PUB_SLUG },
		relatedPub,
		relatedPubField,
	};
};

const getPubEditorData = (
	props: PubEditorProps & {
		form: Form;
		relatedPubData: Awaited<ReturnType<typeof getRelatedPubData>> | undefined;
		user: User;
		community: Communities;
		canSeeExtraPubValues: boolean;
		pubTypes: Awaited<ReturnType<typeof getPubTypesForCommunity>>;
	}
) => {
	if (props.mode === "create") {
		const pubFields = expect(props.pubTypes.find((pt) => pt.id === props.pubTypeId)).fields;
		const allSlugs = [
			...props.form.elements.map((e) => e.slug),
			props.relatedPubData ? props.relatedPubData.element.slug : undefined,
		].filter((slug) => !!slug) as string[];

		const currentStageId = props.stageId;

		const pubId = randomUUID() as PubsId;

		return {
			mode: props.mode,
			pubId,
			allSlugs,
			pubFields,
			currentStageId,
			pubsForContext: [],
			pubForForm: {
				id: pubId,
				values: [],
				pubTypeId: props.pubTypeId,
			},
		};
	}

	// Create the pubId before inserting into the DB if one doesn't exist.
	// FileUpload needs the pubId when uploading the file before the pub exists
	const pubId = props.pub.id;
	const pubFields = expect(props.pubTypes.find((pt) => pt.id === props.pub.pubTypeId)).fields;

	const pubWithProsemirrorRichText = transformRichTextValuesToProsemirror(props.pub, {
		toJson: true,
	});

	const pubPubFields = props.pub.values.map((v) => ({
		id: v.fieldId,
		name: v.fieldName,
		slug: v.fieldSlug,
		schemaName: v.schemaName,
	}));

	// These are pub values that are only on the pub, but not on the form. We render them at the end of the form.
	const pubOnlyElementDefinitions = makeFormElementDefFromPubFields(
		pubPubFields.filter((pubField) => {
			return !props.form.elements.find((e) => e.slug === pubField.slug);
		})
	);

	const allSlugs = [
		...props.form.elements.map((e) => e.slug),
		...pubOnlyElementDefinitions.map((e) => e.slug),
		props.relatedPubData ? props.relatedPubData.element.slug : undefined,
	].filter((slug) => !!slug) as string[];

	const member = expect(props.user.memberships.find((m) => m.communityId === props.community.id));

	const memberWithUser = {
		...member,
		id: member.id,
		user: props.user,
	};

	const renderWithPubContext = {
		communityId: props.community.id,
		recipient: memberWithUser as RenderWithPubContext["recipient"],
		communitySlug: props.community.slug,
		pub: pubWithProsemirrorRichText as RenderWithPubContext["pub"],
		trx: db,
	} satisfies RenderWithPubContext;

	const currentStageId =
		pubWithProsemirrorRichText?.stage?.id ?? ("stageId" in props ? props.stageId : undefined);

	const pubForForm = getPubByForm({
		pub: pubWithProsemirrorRichText,
		form: props.form,
		withExtraPubValues: props.canSeeExtraPubValues,
	});

	// For the Context, we want both the pubs from the initial pub query (which is limited)
	// as well as the pubs related to this pub
	const relatedPubs = pubWithProsemirrorRichText
		? pubWithProsemirrorRichText.values.flatMap((v) => (v.relatedPub ? [v.relatedPub] : []))
		: [];

	const pubsForContext = [...relatedPubs];

	return {
		mode: props.mode,
		pubForForm,
		pub: pubWithProsemirrorRichText,
		currentStageId,
		pubsForContext,
		pubOnlyElementDefinitions,
		renderWithPubContext,
		pubId,
		pubFields,
		allSlugs,
		member,
	};
};

export type PubEditorProps = {
	// searchParams: { relatedPubId?: PubsId; slug?: string; pubTypeId?: PubTypesId; form?: string };
	htmlFormId?: string;
	form: {
		id: FormsId;
		name: string;
		slug: string;
		isDefault: boolean;
	};
} & (
	| {
			pubId: PubsId;
			pubTypeId?: PubTypesId;
			pub: ProcessedPub<{ withStage: true; withPubType: true }>;
			mode: "edit";
			stageId?: never;
	  }
	| {
			pubId?: never;
			pub?: never;
			mode: "create";
			pubTypeId: PubTypesId;
			/** Stage to create Pub in, if known */
			stageId?: StagesId;
	  }
) &
	(
		| {
				/** The "parent" Pub which this Pub is created from using the "Create Related Pub" button */
				relatedPubId: PubsId;
				/** The field on the "parent" Pub which this Pub is created from using the "Create Related Pub" button */
				relatedFieldSlug: string;
		  }
		| {
				/** The "parent" Pub which this Pub is created from using the "Create Related Pub" button */
				relatedPubId?: never;
				/** The field on the "parent" Pub which this Pub is created from using the "Create Related Pub" button */
				relatedFieldSlug?: never;
		  }
	);

export async function PubEditor(props: PubEditorProps) {
	const [{ user }, community] = await Promise.all([getPageLoginData(), findCommunityBySlug()]);

	if (!user || !community) {
		notFound();
	}

	const [pubTypes, relatedPubData, form, stages, canSeeExtraPubValues, canMovePub] =
		await Promise.all([
			getPubTypesForCommunity(community.id, { limit: 0 }),
			getRelatedPubData({
				relatedPubId: props.relatedPubId,
				slug: props.relatedFieldSlug,
				communityId: community.id,
			}),
			getForm({
				communityId: community.id,
				slug: props.form.slug,
			}).executeTakeFirstOrThrow(
				() => new Error(`Could not find a form for pubtype ${props.form.name}`)
			),
			getStages({ communityId: community.id, userId: user.id }).execute(),
			props.pubId
				? await userCan(
						Capabilities.seeExtraPubValues,
						{ type: MembershipType.pub, pubId: props.pubId },
						user.id
					)
				: false,
			props.pubId
				? await userCan(
						Capabilities.movePub,
						{ type: MembershipType.pub, pubId: props.pubId },
						user.id
					)
				: await userCanMoveAllPubs(community.slug),
		]);

	const pubEditorData = getPubEditorData({
		...props,
		user,
		community,
		form,
		canSeeExtraPubValues,
		relatedPubData,
		pubTypes,
	});

	await hydrateMarkdownElements({
		elements: form.elements,
		renderWithPubContext: pubEditorData.renderWithPubContext,
	});

	return (
		<PubFormProvider
			form={{ pubId: pubEditorData.pubId, form, mode: props.mode, isExternalForm: false }}
		>
			<FormElementToggleProvider fieldSlugs={pubEditorData.allSlugs}>
				<ContextEditorContextProvider
					pubId={pubEditorData.pubId}
					pubTypeId={props.pubTypeId}
					pubs={pubEditorData.pubsForContext}
					pubTypes={pubTypes}
				>
					<PubEditorWrapper
						elements={[
							...form.elements,
							...(pubEditorData.pubOnlyElementDefinitions ?? []),
							...(relatedPubData ? [relatedPubData.element] : []),
						]}
						pub={pubEditorData.pubForForm}
						formSlug={form.slug}
						mode={props.mode}
						withAutoSave={false}
						withButtonElements
						htmlFormId={props.htmlFormId}
						stageId={pubEditorData.currentStageId}
						relatedPub={
							relatedPubData
								? {
										relatedPubId: relatedPubData.relatedPub.id,
										relatedFieldSlug: relatedPubData.relatedPubField.slug,
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
							{canMovePub && (
								<StageSelectClient
									fieldLabel="Stage"
									fieldName="stageId"
									stages={stages}
								/>
							)}

							{form.elements.map((e) => (
								<FormElement
									key={e.id}
									pubId={pubEditorData.pubId}
									element={e}
									values={pubEditorData.pub?.values ?? []}
								/>
							))}
							{pubEditorData.pubOnlyElementDefinitions &&
								pubEditorData.pubOnlyElementDefinitions.map((formElementDef) => (
									<FormElement
										key={formElementDef.slug}
										element={formElementDef as FormElements}
										pubId={pubEditorData.pubId}
										values={pubEditorData.pub?.values ?? []}
									/>
								))}
						</>
					</PubEditorWrapper>
				</ContextEditorContextProvider>
			</FormElementToggleProvider>
		</PubFormProvider>
	);
}
