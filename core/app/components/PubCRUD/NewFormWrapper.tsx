import type { PubTypesId, PubValues } from "db/public";

import type { CreateEditPubProps } from "./types";
import { db } from "~/kysely/database";
import { getPubCached } from "~/lib/server";
import { FormElement } from "../FormSchemaRendering/FormElement";
import { createElementFromPubType } from "./helpers";
import { NewForm } from "./NewForm";
import { availableStagesAndCurrentStage, getCommunityById, getCommunityByStage } from "./queries";

type Props = CreateEditPubProps;

async function NewFormWrapper(props: Props) {
	const pub = props.pubId ? await getPubCached(props.pubId) : undefined;
	const communityId = pub ? pub.communityId : props.communityId!;
	const query = props.stageId
		? getCommunityByStage(props.stageId).executeTakeFirstOrThrow()
		: getCommunityById(
				// @ts-expect-error FIXME: I don't know how to fix this,
				// not sure what the common type between EB and the DB is
				db,
				communityId as string
			).executeTakeFirstOrThrow();
	const result = await query;
	const { community, ...stage } = "communityId" in result ? result : { community: result };
	let currentStage = "id" in stage ? stage : null;
	if (!community) {
		return null;
	}
	const { availableStagesOfCurrentPub = null, stageOfCurrentPub = null } = pub
		? (await availableStagesAndCurrentStage({
				pubId: pub.id,
				communityId,
			}).executeTakeFirst()) ?? {}
		: {};
	const availableStages = availableStagesOfCurrentPub ?? community.stages;
	const stageOfPubRnRn = stageOfCurrentPub ?? currentStage;
	const values = pub ? pub.values : {};
	const pubTypeId = pub?.pubTypeId ?? (props.searchParams.pubTypeId as PubTypesId);
	const currentlySelectedPubType = community.pubTypes.find((p) => p.id === pubTypeId);
	const elements = currentlySelectedPubType
		? createElementFromPubType(currentlySelectedPubType)
		: [];
	const formElements = elements.map((element) => (
		<FormElement
			key={element.elementId}
			element={element}
			searchParams={props.searchParams}
			communitySlug={community.slug}
			values={values}
			pubId={pub?.id}
		/>
	));

	return (
		<NewForm
			currentStage={stageOfPubRnRn}
			communityStages={availableStages}
			availablePubTypes={community.pubTypes}
			parentId={props.parentId}
			pubValues={values as unknown as PubValues}
			pubTypeId={pubTypeId}
			formElements={formElements}
			pubId={pub?.id}
		/>
	);
}

export { NewFormWrapper };
