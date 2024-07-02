import { Suspense } from "react";
import dynamic from "next/dynamic";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { GetPubTypeResponseBody } from "contracts";

import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { PubTypesId } from "~/kysely/types/public/PubTypes";
import { db } from "~/kysely/database";
import { PubFieldsId } from "~/kysely/types/public/PubFields";
import { getPub, getPubCached, getPubFieldsForPub, getPubType } from "~/lib/server";
import { autoCache } from "~/lib/server/cache/autoCache";
import { SkeletonCard } from "../skeletons/SkeletonCard";

export type PubUpdateProps = {
	pubId: PubsId;
};

const buildPseudoPubTypeFromValues = (
	fields: Awaited<ReturnType<ReturnType<typeof getPubFieldsForPub>["execute"]>>
): GetPubTypeResponseBody => {
	return {
		id: "test",
		name: "test",
		description: "test",
		// cast is necessary bc field.schema.schema is unknown in our DB, but it needs to be a JSON object
		fields: fields as GetPubTypeResponseBody["fields"],
	};
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
	const availableStagesAndCurrentStage = await autoCache(
		db
			.with("currentStageId", (db) =>
				db
					.selectFrom("PubsInStages")
					.select("stageId as currentStageId")
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
	).executeTakeFirst();

	const { availableStages = [], currentStage } = availableStagesAndCurrentStage ?? {};

	const pubType = await getPubType(pub.pubTypeId as PubTypesId).executeTakeFirst();
	const pubFields = await getPubFieldsForPub(pub.id as PubsId).execute();
	if (!pubType) {
		throw new Error("No pub type found for pub");
	}

	const nonPubTypeFields = pubFields.filter(
		(field) => !pubType.fields.some((pubTypeField) => pubTypeField.id === field.id)
	);

	const pseudoPubType = nonPubTypeFields.length
		? buildPseudoPubTypeFromValues(nonPubTypeFields)
		: undefined;
	if (true) {
		//pubType.name === "Submission") {
		console.log({
			pub,
			pubFields: pubType.fields,
			actualPubFields: pub.values,
			pubFieldsForPub: pubFields,
		});
	}
	const pubvaluesFieldsSlugs = JSON.stringify(Object.keys(pub.values).sort());

	const pubFieldsSlugs = JSON.stringify(pubFields.map((field) => field.slug).sort());
	if (pubvaluesFieldsSlugs !== pubFieldsSlugs) {
		console.log({
			pubvaluesFieldsSlugs,
			pubFieldsSlugs,
		});
		throw new Error("Pub values and pseudo pub type fields do not match");
	}

	return (
		<>
			<Suspense fallback={<div>Loading...</div>}>
				<PubUpdateForm
					pub={pub}
					pubType={{
						...pubType,
						fields: pubType.fields as GetPubTypeResponseBody["fields"],
					}}
					pseudoPubType={pseudoPubType}
					availableStages={availableStages}
					currentStage={currentStage}
				/>
			</Suspense>
		</>
	);
}
