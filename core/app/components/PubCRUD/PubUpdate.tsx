import { Suspense } from "react";
import dynamic from "next/dynamic";

import type { PubsId } from "~/kysely/types/public/Pubs";
import type { PubTypesId } from "~/kysely/types/public/PubTypes";
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

	const pubType = await getPubType(pub.pubTypeId as PubTypesId);
	if (!pubType) {
		throw new Error("Pub type not found");
	}

	return (
		<>
			<Suspense fallback={<div>Loading...</div>}>
				<PubUpdateForm pub={pub} pubType={pubType} />
			</Suspense>
		</>
	);
}
