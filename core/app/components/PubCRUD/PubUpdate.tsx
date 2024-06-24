import type { CommunitiesId } from "db/public/Communities";
import type { PubsId } from "db/public/Pubs";
import type { PubTypesId } from "db/public/PubTypes";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import { db } from "~/kysely/database";
import { getPub, getPubType } from "~/lib/server";
import { SkeletonCard } from "../skeletons/SkeletonCard";

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
	const pub = await getPub(pubId);
	const availableStagesAndCurrentStage = await db
		.with("currentStageId", (db) =>
			db
				.selectFrom("PubsInStages")
				.select((eb) => ["stageId as currentStageId"])
				.where("PubsInStages.pubId", "=", pubId)
		)
		.selectFrom("stages")
		.select((eb) => [
			jsonObjectFrom(
				eb
					.selectFrom("stages")
					.select(["id", "name", "order"])
					.whereRef(
						"stages.id",
						"=",
						eb.selectFrom("currentStageId").select("currentStageId")
					)
			).as("currentStage"),
			jsonArrayFrom(
				eb
					.selectFrom("stages")
					.select(["id", "name", "order"])
					.orderBy("order desc")
					.where("stages.communityId", "=", pub.communityId as CommunitiesId)
			).as("availableStages"),
		])
		.executeTakeFirst();

	const { availableStages = [], currentStage } = availableStagesAndCurrentStage ?? {};

	const pubType = await getPubType(pub.pubTypeId as PubTypesId);
	if (!pubType) {
		throw new Error("Pub type not found");
	}

	return (
		<>
			<Suspense fallback={<div>Loading...</div>}>
				<PubUpdateForm
					pub={pub}
					pubType={pubType}
					availableStages={availableStages}
					currentStage={currentStage}
				/>
			</Suspense>
		</>
	);
}
