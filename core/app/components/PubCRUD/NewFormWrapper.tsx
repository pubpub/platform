import { Suspense } from "react";

import type { PubsId, PubTypesId } from "db/public";

import type { CreateEditPubProps } from "./types";
import { db } from "~/kysely/database";
import { getPubCached } from "~/lib/server";
import { FormElement } from "../FormSchemaRendering/FormElement";
import { createElementFromPubType } from "./helpers";
import { GenericDynamicPubForm } from "./NewForm";
import { availableStagesAndCurrentStage, getCommunityById, getCommunityByStage } from "./queries";

type Props = CreateEditPubProps;

async function GenericDynamicPubFormWrapper(props: Props) {
	const pub = props.pubId ? await getPubCached(props.pubId) : undefined;
	const communityId = pub ? pub.communityId : props.communityId;
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

	const { availableStagesOfCurrentPub, stageOfCurrentPub } = pub
		? (await availableStagesAndCurrentStage(pub).executeTakeFirst()) ?? {}
		: {};

	const availableStages = availableStagesOfCurrentPub ?? community.stages;
	const stageOfPubRnRn = stageOfCurrentPub ?? currentStage;
	const values = pub ? pub.values : {};

	const formElementsByPubType: Record<string, React.ReactNode> = community.pubTypes.reduce(
		(acc, pubType) => {
			acc[pubType.id] = createElementFromPubType(pubType).map((element) => (
				<FormElement
					key={element.elementId}
					element={element}
					searchParams={props.searchParams}
					communitySlug={community.slug}
					values={values}
				/>
			));
			return acc;
		},
		{}
	);
	const pubType = pub?.pubTypeId ?? ("" as PubTypesId);

	return (
		<>
			<Suspense fallback={<div>Loading...</div>}>
				<GenericDynamicPubForm
					currentStage={stageOfPubRnRn}
					communityStages={availableStages}
					availablePubTypes={community.pubTypes}
					parentId={props.parentId ?? ("" as PubsId)}
					pubValues={values}
					pubTypeId={pubType}
					formElements={formElementsByPubType}
					pubId={pub?.id ?? ("" as PubsId)}
				/>
			</Suspense>
		</>
	);
}

export { GenericDynamicPubFormWrapper };
