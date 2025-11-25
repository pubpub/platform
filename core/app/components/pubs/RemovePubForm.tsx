import type { PubRemoveProps } from "./RemovePubFormClient"

import { Suspense } from "react"
import dynamic from "next/dynamic"

import { SkeletonCard } from "../skeletons/SkeletonCard"

const PubRemoveForm = dynamic(
	async () => {
		return import("./RemovePubFormClient").then((mod) => ({
			default: mod.PubRemoveForm,
		}))
	},
	{ loading: () => <SkeletonCard /> }
)

export async function PubRemove({ pubId, redirectTo }: PubRemoveProps) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<PubRemoveForm pubId={pubId} redirectTo={redirectTo} />
		</Suspense>
	)
}
