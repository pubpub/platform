import { Suspense } from "react";
import dynamic from "next/dynamic";

import type { CommunitiesId, PubsId, StagesId } from "db/public";

import type { CreateEditPubProps } from "./types";
import { db } from "~/kysely/database";
import { findCommunityBySlug } from "~/lib/server/community";
import { SkeletonCard } from "../skeletons/SkeletonCard";
import { UserSelectServer } from "../UserSelect/UserSelectServer";
import { getCommunityById, getCommunityByStage } from "./queries";

const PubCreateForm = dynamic(
	async () => {
		return import("./PubCreateForm").then((mod) => ({
			default: mod.PubCreateForm,
		}));
	},
	{ ssr: false, loading: () => <SkeletonCard /> }
);

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

export async function PubCreate({
	communityId,
	stageId,
	parentId,
	searchParams,
}: CreateEditPubProps & { searchParams?: Record<string, unknown> }) {
	const query = stageId
		? getCommunityByStage(stageId).executeTakeFirstOrThrow()
		: getCommunityById(
				// @ts-expect-error FIXME: I don't know how to fix this,
				// not sure what the common type between EB and the DB is
				db,
				communityId
			).executeTakeFirstOrThrow();

	const result = await query;

	const { community, ...stage } = "communityId" in result ? result : { community: result };
	const currentStage = "id" in stage ? stage : null;

	if (!community) {
		return null;
	}

	return (
		<>
			<Suspense fallback={<div>Loading...</div>}>
				<PubCreateForm
					currentStage={currentStage}
					communityId={community.id}
					availableStages={community.stages}
					availablePubTypes={community.pubTypes}
					parentId={parentId}
					__hack__memberIdField={<HackyUserIdSelect searchParams={searchParams ?? {}} />}
				/>
			</Suspense>
		</>
	);
}
