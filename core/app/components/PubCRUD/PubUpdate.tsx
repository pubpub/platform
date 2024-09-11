import { Suspense } from "react";
import dynamic from "next/dynamic";

import type { PubsId, PubTypesId } from "db/public";

import { getPubCached, getPubType } from "~/lib/server";
import { SkeletonCard } from "../skeletons/SkeletonCard";
import { availableStagesAndCurrentStage } from "./queries";

export type PubUpdateProps = {
	pubId: PubsId;
};

const PubUpdateForm = dynamic(
	async () => {
		return import("./PubUpdateForm").then((mod) => ({
			default: mod.PubUpdateForm,
		}));
	},
	{ ssr: false, loading: () => <SkeletonCard /> }
);

export async function PubUpdate({ pubId }: PubUpdateProps) {
	const pub = await getPubCached(pubId);
	const stages = await availableStagesAndCurrentStage({
		pubId: pub.id,
		communityId: pub.communityId,
	}).executeTakeFirst();

	const { availableStagesOfCurrentPub = [], stageOfCurrentPub } = stages ?? {};

	const pubType = await getPubType(pub.pubTypeId as PubTypesId).executeTakeFirst();
	if (!pubType) {
		throw new Error("Pub type not found");
	}

	return (
		<>
			<Suspense fallback={<div>Loading...</div>}>
				<PubUpdateForm
					pub={pub}
					pubType={pubType}
					availableStages={availableStagesOfCurrentPub}
					currentStage={stageOfCurrentPub}
				/>
			</Suspense>
		</>
	);
}
