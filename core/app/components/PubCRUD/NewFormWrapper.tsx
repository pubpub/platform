import { Suspense } from "react";

import { assert } from "utils";

import type { CreateEditPubProps } from "./types";
import { db } from "~/kysely/database";
import { getPubCached } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { UserSelectServer } from "../UserSelect/UserSelectServer";
import { GenericDynamicPubForm } from "./NewForm";
import { availableStagesAndCurrentStage, getCommunityById, getCommunityByStage } from "./queries";

type Props = CreateEditPubProps & { searchParams?: Record<string, unknown> };

const HackyUserIdSelect = async ({ searchParams }: { searchParams: Record<string, unknown> }) => {
	const community = await findCommunityBySlug();
	const queryParamName = `user-wow`;
	const query = searchParams?.[queryParamName] as string | undefined;
	return (
		<UserSelectServer
			community={community!}
			fieldLabel={"Member"}
			fieldName={`hack`}
			query={query}
			queryParamName={queryParamName}
		/>
	);
};

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
	const values = pub?.values ?? {};
	const pubType = pub?.pubTypeId ?? "";
	return (
		<>
			<Suspense fallback={<div>Loading...</div>}>
				<GenericDynamicPubForm
					currentStage={stageOfPubRnRn}
					communitySlug={community.slug}
					availableStages={availableStages}
					availablePubTypes={community.pubTypes}
					parentId={props.parentId}
					__hack__memberIdField={
						<HackyUserIdSelect searchParams={props.searchParams ?? {}} />
					}
					values={values}
					pubType={pubType}
				/>
			</Suspense>
		</>
	);
}

export { GenericDynamicPubFormWrapper };