import { Suspense } from "react";
import dynamic from "next/dynamic";

import type { PubsId } from "db/public";

import { SkeletonCard } from "../skeletons/SkeletonCard";

export type PubRemoveProps = {
	pubId: PubsId;
};

const PubRemoveForm = dynamic(
	async () => {
		return import("./RemovePubFormClient").then((mod) => ({
			default: mod.PubRemoveForm,
		}));
	},
	{ ssr: false, loading: () => <SkeletonCard /> }
);

export async function PubRemove({ pubId }: PubRemoveProps) {
	return <PubRemoveForm pubId={pubId} />;
}
