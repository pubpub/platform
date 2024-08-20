import { Suspense } from "react";

import { StagesTable } from "db/public";

import type { CreateEditPubProps } from "./types";
import { db } from "~/kysely/database";
import { getPubCached } from "~/lib/server";
import { GenericDynamicPubForm } from "./NewForm";
import { availableStagesAndCurrentStage, getCommunityById, getStage } from "./queries";

type Props = CreateEditPubProps & { searchParams?: Record<string, unknown> };

async function GenericDynamicPubFormWrapper(props: Props) {
	const query = props.stageId
		? getStage(props.stageId).executeTakeFirstOrThrow()
		: getCommunityById(
				// @ts-expect-error FIXME: I don't know how to fix this,
				// not sure what the common type between EB and the DB is
				db,
				props.communityId
			).executeTakeFirstOrThrow();

	const result = await query;
	const { community, ...stage } = "communityId" in result ? result : { community: result };

	let currentStage = "id" in stage ? stage : null;

	if (!community) { 
		return null;
	}

	const pub = props.pubId !== undefined ? await getPubCached(props.pubId) : undefined;

	const { availableStagesOfCurrentPub, stageOfCurrentPub } = pub
		? (await availableStagesAndCurrentStage(pub).executeTakeFirst()) || {}
		: {};

	const availableStages = availableStagesOfCurrentPub ?? community.stages;
	const stageOfPubRnRn = stageOfCurrentPub ?? currentStage;

	return (
		<>
			<Suspense fallback={<div>Loading...</div>}>
				<GenericDynamicPubForm
					currentStage={stageOfPubRnRn}
					communityId={community.id}
					availableStages={availableStages}
					availablePubTypes={community.pubTypes}
					parentId={props.parentId}
				/>
			</Suspense>
		</>
	);
}

export { GenericDynamicPubFormWrapper };
