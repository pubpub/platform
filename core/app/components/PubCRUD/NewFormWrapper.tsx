import { Suspense } from "react";

import type { GetPubResponseBody } from "contracts";
import type { PubTypesId, PubValues } from "db/public";

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
		return null; // guard against null community for free?
	}

	const { availableStagesOfCurrentPub, stageOfCurrentPub } = pub
		? (await availableStagesAndCurrentStage(pub).executeTakeFirst()) ?? {}
		: {};

	const availableStages = availableStagesOfCurrentPub ?? community.stages;
	const stageOfPubRnRn = stageOfCurrentPub ?? currentStage;
	const values = pub?.values ?? ({} as GetPubResponseBody["values"]);
	const pubType = pub?.pubTypeId ?? ("" as PubTypesId);

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

	return (
		<>
			<Suspense fallback={<div>Loading...</div>}>
				<GenericDynamicPubForm
					currentStage={stageOfPubRnRn}
					communitySlug={community.slug}
					availableStages={availableStages}
					availablePubTypes={community.pubTypes}
					parentId={props.parentId}
					searchParams={props.searchParams}
					values={values}
					pubTypeId={pubType}
					formElements={formElementsByPubType}
				/>
			</Suspense>
		</>
	);
}

export { GenericDynamicPubFormWrapper };
